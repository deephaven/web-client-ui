import http2 from 'node:http2';
import type { dh as DhcType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import {
  StreamMetricsTracker,
  type NodeHttp2StreamMetrics,
} from './StreamMetricsTracker.js';

const logger = Log.module('@deephaven/jsapi-nodejs.NodeHttp2gRPCTransport');

type LogLevel = 'debug' | 'error';
type GrpcTransport = DhcType.grpc.GrpcTransport;
type GrpcTransportFactory = DhcType.grpc.GrpcTransportFactory;
type GrpcTransportOptions = DhcType.grpc.GrpcTransportOptions;

export type { NodeHttp2StreamMetrics };

/**
 * Configuration for a {@link NodeHttp2gRPCTransport} factory.
 */
export interface NodeHttp2TransportConfig {
  /**
   * Per-stream receive window, sent as `settings.initialWindowSize` on
   * `http2.connect`. Node defaults to 64KB and, unlike browsers, never grows
   * it. Only one window of data can be in flight before the sender waits for the
   * receiver to acknowledge it, so a single stream is capped at roughly
   * `window / RTT` (round-trip time) regardless of bandwidth — ~819KB/s at 80ms.
   * Sizing is left to the consumer, since a larger window costs buffer memory
   * and weakens backpressure.
   * @default undefined (Node's 65535)
   */
  initialWindowSize?: number;
  /**
   * Connection-level receive window, applied via `session.setLocalWindowSize()`.
   * Per RFC 9113 6.9.2 the connection window cannot be changed via SETTINGS, so
   * this is not an `http2.connect` option.
   *
   * Must be >= {@link NodeHttp2TransportConfig.initialWindowSize}. Can be
   * increased to account for multiple streams sharing a session.
   * @default `initialWindowSize` when that is set, otherwise undefined
   */
  sessionWindowSize?: number;
  /** Merged into the `http2.connect` options. */
  sessionOptions?: http2.SecureClientSessionOptions;
  /**
   * Opt-in diagnostics. Supplying this enables both session and stream metrics;
   * pass a no-op to ignore either one.
   */
  metricsConfig?: NodeHttp2MetricsConfig;
}

/**
 * Diagnostics configuration.
 */
export interface NodeHttp2MetricsConfig {
  onSessionMetrics: (metrics: NodeHttp2SessionMetrics) => void;
  onStreamMetrics: (metrics: NodeHttp2StreamMetrics) => void;
  /**
   * Also emit an `'interval'` stream-metrics event this often while a stream is
   * open. Required to observe long-lived streams that never end, such as a
   * table subscription.
   * @default undefined (end-of-stream events only)
   */
  intervalMs?: number;
}

export interface NodeHttp2SessionMetrics {
  origin: string;
  event: 'connect' | 'localSettings' | 'remoteSettings' | 'close' | 'error';
  /**
   * Per-stream window we advertise. Settings apply asynchronously, so this is
   * still Node's default on `'connect'`, and only reflects
   * {@link NodeHttp2TransportConfig.initialWindowSize} from `'localSettings'`
   * onward.
   */
  localInitialWindowSize?: number;
  /** Connection-level window. */
  localWindowSize?: number;
  remoteInitialWindowSize?: number;
  /** Echo of `sessionOptions.maxSessionMemory`; not readable from the session. */
  maxSessionMemoryMb?: number;
  /**
   * What the peer advertised, as opposed to `peerMaxConcurrentStreams`, which is
   * the local assumption used until the peer says otherwise.
   */
  remoteMaxConcurrentStreams?: number;
  error?: Error;
}

/** The {@link NodeHttp2SessionMetrics} fields that are read off the session. */
type SessionState = Pick<
  NodeHttp2SessionMetrics,
  | 'localInitialWindowSize'
  | 'localWindowSize'
  | 'remoteInitialWindowSize'
  | 'remoteMaxConcurrentStreams'
>;

/**
 * The `close` / `error` handlers report state after the session is destroyed,
 * where Node does not guarantee these getters stay readable. They all read
 * through the same session handle, so they succeed or fail as a group.
 */
function readSessionState(session: http2.ClientHttp2Session): SessionState {
  try {
    return {
      localInitialWindowSize: session.localSettings.initialWindowSize,
      localWindowSize: session.state.localWindowSize,
      remoteInitialWindowSize: session.remoteSettings.initialWindowSize,
      remoteMaxConcurrentStreams: session.remoteSettings.maxConcurrentStreams,
    };
  } catch {
    return {};
  }
}

/** Reject config that cannot do what it looks like it does. */
function assertValidConfig({
  initialWindowSize,
  sessionWindowSize,
}: NodeHttp2TransportConfig): void {
  if (
    sessionWindowSize != null &&
    initialWindowSize != null &&
    sessionWindowSize < initialWindowSize
  ) {
    throw new Error(
      `sessionWindowSize (${sessionWindowSize}) is below initialWindowSize ` +
        `(${initialWindowSize}). The connection window caps every stream, so ` +
        `the stream window is unreachable and throughput is limited to the ` +
        `smaller value.`
    );
  }
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

  /** Every factory's session map, so {@link dispose} can close all of them. */
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
   * factory owns its sessions, memoized by origin, and applies one config to all
   * of them. Use a factory per config when origins need to differ.
   * @param config Optional config applied to every origin this factory connects
   * to.
   * @returns A gRPC transport factory
   * @throws If the config is internally contradictory.
   */
  static createFactory(
    config: NodeHttp2TransportConfig = {}
  ): GrpcTransportFactory {
    const sessionMap = new Map<string, http2.ClientHttp2Session>();

    assertValidConfig(config);

    function createSession(origin: string): http2.ClientHttp2Session {
      const {
        initialWindowSize,
        sessionWindowSize,
        sessionOptions,
        metricsConfig,
      } = config;

      // Only override `settings` when configured, so an unconfigured factory
      // behaves exactly as a bare `http2.connect(origin)` would.
      const session = http2.connect(origin, {
        ...sessionOptions,
        ...(initialWindowSize == null
          ? {}
          : { settings: { ...sessionOptions?.settings, initialWindowSize } }),
      });

      /** Log the session's current state and report it to `onSessionMetrics`. */
      const reportSession = (
        event: NodeHttp2SessionMetrics['event'],
        logLevel: LogLevel,
        message: string,
        error?: Error
      ): void => {
        const metrics: NodeHttp2SessionMetrics = {
          origin,
          event,
          ...readSessionState(session),
          maxSessionMemoryMb: sessionOptions?.maxSessionMemory,
          ...(error == null ? {} : { error }),
        };

        NodeHttp2gRPCTransport.logMessage(logLevel, message, metrics);
        metricsConfig?.onSessionMetrics(metrics);
      };

      session.on('connect', () => {
        const localWindowSize = sessionWindowSize ?? initialWindowSize;

        try {
          if (localWindowSize != null) {
            session.setLocalWindowSize(localWindowSize);
          }
        } catch (err) {
          reportSession(
            'error',
            'error',
            'Failed to set session window size',
            err instanceof Error ? err : new Error(String(err))
          );
        }

        reportSession('connect', 'debug', 'Session connected');
      });

      // Settings apply asynchronously, so this is the first point where the
      // negotiated local values can be read.
      session.on('localSettings', () => {
        reportSession('localSettings', 'debug', 'Session settings applied');
      });

      session.on('remoteSettings', () => {
        reportSession('remoteSettings', 'debug', 'Remote settings received');
      });

      session.on('error', err => {
        reportSession('error', 'error', 'Session error', err);
      });

      session.on('close', () => {
        sessionMap.delete(origin);
        reportSession('close', 'debug', 'Session closed');
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

        let session = sessionMap.get(origin);

        if (session == null) {
          session = createSession(origin);
          sessionMap.set(origin, session);
          // Re-registered on every session, since a factory can outlive the
          // `dispose` that cleared the registry.
          NodeHttp2gRPCTransport.sessionMaps.add(sessionMap);
        }

        return new NodeHttp2gRPCTransport(options, session, config);
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
    config: NodeHttp2TransportConfig
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

    const { metricsConfig } = this.config;

    if (metricsConfig == null) {
      // `onChunk` can run tens of thousands of times on a single stream, so
      // accounting is skipped entirely when unobserved.

      // Note that `chunk` is technically a `Buffer`, but the `Buffer` type defined
      // in @types/pouchdb-core is outdated and incompatible with latest `Uint8Array`
      // types. Since `Buffer` inherits from `Uint8Array`, we can get around this
      // by just declaring it as a `Uint8Array`.
      req.on('data', (chunk: Uint8Array) => {
        this.options.onChunk(chunk);
      });
    } else {
      const tracker = new StreamMetricsTracker({
        origin: url.origin,
        path: url.pathname,
        onChunk: chunk => this.options.onChunk(chunk),
        onMetrics: metricsConfig.onStreamMetrics,
        intervalMs: metricsConfig.intervalMs,
      });

      req.on('data', (chunk: Uint8Array) => {
        tracker.recordChunk(chunk);
      });

      req.on('end', () => tracker.finish());
      req.on('error', () => tracker.finish());
      // Cancelled streams neither end nor error, and would leak the interval.
      req.on('close', () => tracker.finish());
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
