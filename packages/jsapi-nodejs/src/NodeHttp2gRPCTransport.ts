import http2 from 'node:http2';
import { performance } from 'node:perf_hooks';
import type { dh as DhcType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';

const logger = Log.module('@deephaven/jsapi-nodejs.NodeHttp2gRPCTransport');

type LogLevel = 'debug' | 'error';
type GrpcTransport = DhcType.grpc.GrpcTransport;
type GrpcTransportFactory = DhcType.grpc.GrpcTransportFactory;
type GrpcTransportOptions = DhcType.grpc.GrpcTransportOptions;

/**
 * Node defaults both HTTP/2 receive windows to 64KB and, unlike browsers, never
 * grows them, which caps a single stream at roughly `window / RTT`.
 */

/**
 * Configuration for a {@link NodeHttp2gRPCTransport} factory.
 */
export interface NodeHttp2TransportConfig {
  /**
   * Per-stream receive window (SETTINGS_INITIAL_WINDOW_SIZE).
   *
   * Unset by default — Node's 64KB applies, which caps a single stream at
   * roughly `window / RTT`. Size it from the bandwidth-delay product you need:
   * at 80ms RTT, 64KB allows ~819KB/s and 4MiB allows ~52MB/s. Raising it costs
   * buffer memory and weakens backpressure, so the right value depends on the
   * deployment and is left to the consumer.
   *
   * Setting this alone is sufficient:
   * {@link NodeHttp2TransportConfig.sessionWindowSize} defaults to the same
   * value, since a connection window below it would make it unreachable.
   * @default undefined (Node's 65535)
   */
  initialWindowSize?: number;
  /**
   * Connection-level receive window, applied via `session.setLocalWindowSize()`.
   * NOT an `http2.connect` option: per RFC 9113 6.9.2,
   * SETTINGS_INITIAL_WINDOW_SIZE cannot alter the connection window, which
   * changes only via a WINDOW_UPDATE on stream 0.
   *
   * Defaults to {@link NodeHttp2TransportConfig.initialWindowSize} when that is
   * set. Raise it above that when several heavy streams share the session, since
   * this budget is shared across all of them. Setting it *below*
   * `initialWindowSize` is logged as an error — the connection window caps every
   * stream, so the larger stream window could never be reached.
   * @default undefined, or `initialWindowSize` when that is set
   */
  sessionWindowSize?: number;
  /** Merged into the `http2.connect` options. */
  sessionOptions?: http2.SecureClientSessionOptions;

  onSessionMetrics?: (metrics: NodeHttp2SessionMetrics) => void;
  onStreamMetrics?: (metrics: NodeHttp2StreamMetrics) => void;
  /**
   * Emit an `'interval'` stream-metrics event this often. Required to observe
   * long-lived streams that never end (e.g. a controller subscription).
   * @default undefined (end-of-stream events only)
   */
  metricsIntervalMs?: number;
}

/**
 * A {@link NodeHttp2TransportConfig}, or a function resolving one per origin.
 * Consumers commonly connect to multiple origins (e.g. a server plus one per
 * worker) whose TLS material may legitimately differ.
 */
export type NodeHttp2TransportConfigResolver =
  | NodeHttp2TransportConfig
  | ((origin: string) => NodeHttp2TransportConfig);

export interface NodeHttp2SessionMetrics {
  origin: string;
  event: 'connect' | 'remoteSettings' | 'close' | 'error';
  /** `session.localSettings.initialWindowSize` — per-stream, what we advertise. */
  localInitialWindowSize: number | undefined;
  /** `session.state.localWindowSize` — connection level. */
  localWindowSize: number | undefined;
  /** `session.remoteSettings.initialWindowSize`. */
  remoteInitialWindowSize: number | undefined;
  /** Echo of the resolved config value; not readable from the session. */
  maxSessionMemoryMb: number | undefined;
  /**
   * `session.remoteSettings.maxConcurrentStreams` — what the peer advertised.
   * Deliberately not named after the `peerMaxConcurrentStreams` connect option,
   * which is the opposite thing: a local assumption applied until the peer says
   * otherwise.
   */
  remoteMaxConcurrentStreams: number | undefined;
  error?: Error;
}

export interface NodeHttp2StreamMetrics {
  origin: string;
  /** Request path, e.g. `/io.deephaven.proto.controller.grpc.ControllerApi/subscribe`. */
  path: string;
  event: 'interval' | 'end';
  durationMs: number;
  timeToFirstChunkMs: number | undefined;
  chunkCount: number;
  byteCount: number;
  maxChunkBytes: number;
  bytesPerSecond: number;
  /**
   * Wall-clock spent inside `options.onChunk`. Compare against `durationMs`: a
   * small ratio means the transport is waiting on the wire, a large one means
   * the consumer is the bottleneck.
   */
  consumerTimeMs: number;
}

/**
 * Session state getters can throw once a session is destroyed, which races with
 * the `close` / `error` handlers that report them.
 */
function safeRead<T>(read: () => T): T | undefined {
  try {
    return read() ?? undefined;
  } catch {
    return undefined;
  }
}

function createSessionMetrics(
  origin: string,
  session: http2.ClientHttp2Session,
  config: NodeHttp2TransportConfig,
  event: NodeHttp2SessionMetrics['event'],
  error?: Error
): NodeHttp2SessionMetrics {
  return {
    origin,
    event,
    localInitialWindowSize: safeRead(
      () => session.localSettings.initialWindowSize
    ),
    localWindowSize: safeRead(() => session.state.localWindowSize),
    remoteInitialWindowSize: safeRead(
      () => session.remoteSettings.initialWindowSize
    ),
    maxSessionMemoryMb: config.sessionOptions?.maxSessionMemory,
    remoteMaxConcurrentStreams: safeRead(
      () => session.remoteSettings.maxConcurrentStreams
    ),
    ...(error == null ? {} : { error }),
  };
}

/** Mutable accounting for a single in-flight stream. */
interface StreamMetricsTracker {
  startTime: number;
  firstChunkTime: number | undefined;
  chunkCount: number;
  byteCount: number;
  maxChunkBytes: number;
  consumerTimeMs: number;
  intervalId: ReturnType<typeof setInterval> | undefined;
  isEnded: boolean;
}

/**
 * A gRPC transport implementation using Node.js's built-in HTTP/2 client. This
 * can be passed to the CoreClient constructor to adapt the underlying transport
 * to use http2. This addresses a limitation of nodejs `fetch` implementation
 * which currently uses http1.
 *
 * e.g.
 * const client = new dhc.CoreClient(dhServerUrl, {
 *   transportFactory: NodeHttp2gRPCTransport.createFactory(),
 * })
 */
export class NodeHttp2gRPCTransport implements GrpcTransport {
  private static readonly logMessageHandlers = new Set<
    (logLevel: LogLevel, ...args: unknown[]) => void
  >();

  /**
   * Session maps of factories created by {@link createFactory}, so that the
   * static {@link dispose} can still close every session across all factories.
   */
  private static readonly sessionMaps = new Set<
    Map<string, http2.ClientHttp2Session>
  >();

  /**
   * Log a message to the logger + any registered log message handlers.
   * @param logLevel The log level
   * @param args Additional args to log
   */
  static logMessage = (logLevel: LogLevel, ...args: unknown[]): void => {
    logger[logLevel](...args);

    // eslint-disable-next-line no-restricted-syntax
    for (const handler of NodeHttp2gRPCTransport.logMessageHandlers) {
      handler(logLevel, ...args);
    }
  };

  /**
   * Create a factory for creating new NodeHttp2gRPCTransport instances. Each
   * factory owns its sessions, memoized by origin. Config is never hashed (it
   * can contain functions and Buffers), so sessions are shared by reusing a
   * factory and in no other way.
   * @param config Optional config, or a function resolving config for an origin.
   * The resolver is called once per origin, not per created transport.
   * @returns A gRPC transport factory
   */
  static createFactory(
    config?: NodeHttp2TransportConfigResolver
  ): GrpcTransportFactory {
    const sessionMap = new Map<string, http2.ClientHttp2Session>();
    const configMap = new Map<string, NodeHttp2TransportConfig>();

    NodeHttp2gRPCTransport.sessionMaps.add(sessionMap);

    function resolveConfig(origin: string): NodeHttp2TransportConfig {
      let resolved = configMap.get(origin);

      if (resolved == null) {
        resolved =
          (typeof config === 'function' ? config(origin) : config) ?? {};
        configMap.set(origin, resolved);
      }

      return resolved;
    }

    function createSession(
      origin: string,
      transportConfig: NodeHttp2TransportConfig
    ): http2.ClientHttp2Session {
      const {
        initialWindowSize,
        sessionWindowSize,
        sessionOptions,
        onSessionMetrics,
      } = transportConfig;

      // Every DATA frame debits both the stream window and the connection
      // window, so a stream's usable throughput is the lesser of the two. A
      // stream window above the connection window is therefore unreachable, and
      // setting `initialWindowSize` alone would be silently inert. Derive the
      // connection window from it so the setting means something on its own; the
      // reverse is NOT derived, because a large connection window over a small
      // stream window is a valid way to share a session between many streams.
      const resolvedSessionWindowSize = sessionWindowSize ?? initialWindowSize;

      if (
        sessionWindowSize != null &&
        initialWindowSize != null &&
        sessionWindowSize < initialWindowSize
      ) {
        NodeHttp2gRPCTransport.logMessage(
          'error',
          `sessionWindowSize (${sessionWindowSize}) is below initialWindowSize ` +
            `(${initialWindowSize}) for ${origin}. The connection window caps ` +
            `every stream, so the stream window is unreachable and throughput ` +
            `is limited to the smaller value.`
        );
      }

      // Both windows are left at Node's defaults unless configured, so an
      // unconfigured factory behaves exactly as a bare `http2.connect(origin)`
      // would. `initialWindowSize` is spread in only when set, so it neither
      // overrides nor introduces a `settings` key that the caller did not ask
      // for.
      const session = http2.connect(origin, {
        ...sessionOptions,
        ...(sessionOptions?.settings != null || initialWindowSize != null
          ? {
              settings: {
                ...sessionOptions?.settings,
                ...(initialWindowSize != null ? { initialWindowSize } : {}),
              },
            }
          : {}),
      });

      const emitSessionMetrics = (
        event: NodeHttp2SessionMetrics['event'],
        error?: Error
      ): void => {
        onSessionMetrics?.(
          createSessionMetrics(origin, session, transportConfig, event, error)
        );
      };

      session.on('connect', () => {
        // SETTINGS_INITIAL_WINDOW_SIZE applies to streams only. Per RFC 9113
        // 6.9.2 the connection level window can only change via a WINDOW_UPDATE
        // on stream 0, which is what `setLocalWindowSize` sends. The session is
        // not established until `connect`, so this cannot happen any earlier.
        try {
          if (resolvedSessionWindowSize != null) {
            session.setLocalWindowSize(resolvedSessionWindowSize);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          NodeHttp2gRPCTransport.logMessage(
            'error',
            'Failed to set session window size',
            origin,
            error
          );
          emitSessionMetrics('error', error);
        }

        emitSessionMetrics('connect');
      });

      // `settings.initialWindowSize` applies asynchronously, so `localSettings`
      // still reports the Node default at `connect` time.
      session.on('localSettings', () => {
        const {
          localInitialWindowSize,
          localWindowSize,
          maxSessionMemoryMb,
          remoteMaxConcurrentStreams,
        } = createSessionMetrics(origin, session, transportConfig, 'connect');

        NodeHttp2gRPCTransport.logMessage(
          'debug',
          `session connected ${origin} localInitialWindowSize=${localInitialWindowSize} localWindowSize=${localWindowSize} maxSessionMemoryMb=${maxSessionMemoryMb} remoteMaxConcurrentStreams=${remoteMaxConcurrentStreams}`
        );
      });

      session.on('remoteSettings', () => {
        emitSessionMetrics('remoteSettings');
      });

      session.on('error', err => {
        NodeHttp2gRPCTransport.logMessage('error', 'Session error', err);
        emitSessionMetrics('error', err);
      });

      session.on('close', () => {
        NodeHttp2gRPCTransport.logMessage('debug', 'Session closed');
        sessionMap.delete(origin);
        emitSessionMetrics('close');
      });

      return session;
    }

    return {
      /**
       * Create a new transport instance.
       * @param options - options for creating the transport
       * @return a transport instance to use for gRPC communication
       */
      create: (options: GrpcTransportOptions): GrpcTransport => {
        const { origin } = new URL(options.url);
        const transportConfig = resolveConfig(origin);

        let session = sessionMap.get(origin);

        if (session == null) {
          session = createSession(origin, transportConfig);
          sessionMap.set(origin, session);
          // `dispose` clears the registry, but a factory can outlive it.
          NodeHttp2gRPCTransport.sessionMaps.add(sessionMap);
        }

        return new NodeHttp2gRPCTransport(options, session, transportConfig);
      },

      /**
       * Return true to signal that created transports may have {@link GrpcTransport.sendMessage}
       * called on it more than once before {@link GrpcTransport.finishSend} should
       * be called.
       * @return true to signal that the implementation can stream multiple messages,
       *         false otherwise indicating that Open/Next gRPC calls should be used
       */
      get supportsClientStreaming(): boolean {
        return true;
      },
    };
  }

  /**
   * Factory for creating new NodeHttp2gRPCTransport instances.
   * @deprecated Use {@link NodeHttp2gRPCTransport.createFactory} instead, which
   * supports configuration and diagnostics.
   */
  static readonly factory: GrpcTransportFactory =
    NodeHttp2gRPCTransport.createFactory();

  /**
   * Register a log message handler.
   * @param handleLogMessage function to handle log messages
   * @returns function to unregister the handler
   */
  static onLogMessage = (
    handleLogMessage: (logLevel: LogLevel, ...args: unknown[]) => void
  ): (() => void) => {
    NodeHttp2gRPCTransport.logMessageHandlers.add(handleLogMessage);
    return () => {
      NodeHttp2gRPCTransport.logMessageHandlers.delete(handleLogMessage);
    };
  };

  /**
   * Private constructor to limit instantiation to the static factory method.
   * @param options Transport options.
   * @param session node:http2 session to use for data transport.
   * @param config Resolved config for the session's origin.
   */
  private constructor(
    options: GrpcTransportOptions,
    session: http2.ClientHttp2Session,
    config: NodeHttp2TransportConfig = {}
  ) {
    this.options = options;
    this.session = session;
    this.config = config;
  }

  private readonly options: GrpcTransportOptions;

  private readonly session: http2.ClientHttp2Session;

  private readonly config: NodeHttp2TransportConfig;

  private request: http2.ClientHttp2Stream | null = null;

  /**
   * Create an http2 client stream that can send requests to the server and pass
   * responses to callbacks defined on the transport options.
   * @param headers Request headers
   * @returns The created http2 client stream
   */
  createRequest = (
    headers: Record<string, string> | null
  ): http2.ClientHttp2Stream => {
    const url = new URL(this.options.url);

    NodeHttp2gRPCTransport.logMessage('debug', 'createRequest', url.pathname);

    const req = this.session.request({
      ...headers,
      ':method': 'POST',
      ':path': url.pathname,
    });

    req.on('response', (responseHeaders, _flags) => {
      const headersRecord: Record<string, string | string[]> = {};

      // strip any undefined headers or keys that start with `:`
      Object.keys(responseHeaders).forEach(name => {
        if (responseHeaders[name] != null && !name.startsWith(':')) {
          headersRecord[name] = responseHeaders[name];
        }
      });

      this.options.onHeaders(headersRecord, Number(responseHeaders[':status']));
    });

    const { onStreamMetrics, metricsIntervalMs } = this.config;

    if (onStreamMetrics == null) {
      // Accounting is skipped entirely when unobserved. `onChunk` can run tens
      // of thousands of times on a single stream, so instrumenting it
      // unconditionally would slow down the path being measured.

      // Note that `chunk` is technically a `Buffer`, but the `Buffer` type defined
      // in @types/pouchdb-core is outdated and incompatible with latest `Uint8Array`
      // types. Since `Buffer` inherits from `Uint8Array`, we can get around this
      // by just declaring it as a `Uint8Array`.
      req.on('data', (chunk: Uint8Array) => {
        this.options.onChunk(chunk);
      });
    } else {
      const tracker: StreamMetricsTracker = {
        startTime: performance.now(),
        firstChunkTime: undefined,
        chunkCount: 0,
        byteCount: 0,
        maxChunkBytes: 0,
        consumerTimeMs: 0,
        intervalId: undefined,
        isEnded: false,
      };

      const emitStreamMetrics = (
        event: NodeHttp2StreamMetrics['event']
      ): void => {
        const durationMs = performance.now() - tracker.startTime;

        onStreamMetrics({
          origin: url.origin,
          path: url.pathname,
          event,
          durationMs,
          timeToFirstChunkMs:
            tracker.firstChunkTime == null
              ? undefined
              : tracker.firstChunkTime - tracker.startTime,
          chunkCount: tracker.chunkCount,
          byteCount: tracker.byteCount,
          maxChunkBytes: tracker.maxChunkBytes,
          bytesPerSecond:
            durationMs > 0 ? (tracker.byteCount * 1000) / durationMs : 0,
          consumerTimeMs: tracker.consumerTimeMs,
        });
      };

      const finishStreamMetrics = (): void => {
        if (tracker.isEnded) {
          return;
        }
        tracker.isEnded = true;

        if (tracker.intervalId != null) {
          clearInterval(tracker.intervalId);
          tracker.intervalId = undefined;
        }

        emitStreamMetrics('end');
      };

      if (metricsIntervalMs != null) {
        tracker.intervalId = setInterval(() => {
          emitStreamMetrics('interval');
        }, metricsIntervalMs);
        // Otherwise the timer holds the event loop open and consumers hang on exit.
        tracker.intervalId.unref?.();
      }

      req.on('data', (chunk: Uint8Array) => {
        const now = performance.now();

        tracker.firstChunkTime ??= now;
        tracker.chunkCount += 1;
        tracker.byteCount += chunk.length;
        tracker.maxChunkBytes = Math.max(tracker.maxChunkBytes, chunk.length);

        try {
          this.options.onChunk(chunk);
        } finally {
          tracker.consumerTimeMs += performance.now() - now;
        }
      });

      req.on('end', finishStreamMetrics);
      req.on('error', finishStreamMetrics);
      // `close` covers streams that are cancelled instead of ending, which would
      // otherwise leak the interval timer.
      req.on('close', finishStreamMetrics);
    }

    req.on('end', () => {
      this.options.onEnd();
    });
    req.on('error', err => {
      this.options.onEnd(err);
    });

    return req;
  };

  /**
   * Starts the stream, sending metadata to the server.
   * @param metadata - the headers to send the server when opening the connection
   */
  start(metadata: { [key: string]: string | Array<string> }): void {
    NodeHttp2gRPCTransport.logMessage('debug', 'start', metadata);

    if (this.request != null) {
      throw new Error('start called more than once');
    }

    const headers: Record<string, string> = {};
    Object.entries(metadata).forEach(([key, value]) => {
      headers[key] = typeof value === 'string' ? value : value.join(', ');
    });

    this.request = this.createRequest(headers);
  }

  /**
   * Sends a message to the server.
   * @param msgBytes - bytes to send to the server
   */
  sendMessage(msgBytes: Uint8Array): void {
    NodeHttp2gRPCTransport.logMessage('debug', 'sendMessage', msgBytes);
    assertNotNull(this.request, 'request is required');

    this.request.write(msgBytes);
  }

  /**
   * "Half close" the stream, signaling to the server that no more messages will
   * be sent, but that the client is still open to receiving messages.
   */
  finishSend(): void {
    NodeHttp2gRPCTransport.logMessage('debug', 'finishSend');
    assertNotNull(this.request, 'request is required');
    this.request.end();
  }

  /**
   * End the stream, both notifying the server that no more messages will be
   * sent nor received, and preventing the client from receiving any more events.
   */
  cancel(): void {
    NodeHttp2gRPCTransport.logMessage('debug', 'cancel');
    assertNotNull(this.request, 'request is required');
    this.request.close();
  }

  /**
   * Cleanup.
   */
  static dispose(): void {
    // eslint-disable-next-line no-restricted-syntax
    for (const sessionMap of NodeHttp2gRPCTransport.sessionMaps) {
      // eslint-disable-next-line no-restricted-syntax
      for (const session of sessionMap.values()) {
        session.close();
      }
      sessionMap.clear();
    }

    NodeHttp2gRPCTransport.logMessageHandlers.clear();
    NodeHttp2gRPCTransport.sessionMaps.clear();
  }
}

export default NodeHttp2gRPCTransport;
