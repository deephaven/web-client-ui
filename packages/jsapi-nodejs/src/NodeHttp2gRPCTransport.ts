import http2 from 'node:http2';
import type { dh as DhcType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';

const logger = Log.module('@deephaven/jsapi-nodejs.NodeHttp2gRPCTransport');

/** Largest window `session.setLocalWindowSize` accepts. */
const MAX_WINDOW_SIZE = 2 ** 31 - 1;

type LogLevel = 'debug' | 'error';
type GrpcTransport = DhcType.grpc.GrpcTransport;
type GrpcTransportFactory = DhcType.grpc.GrpcTransportFactory;
type GrpcTransportOptions = DhcType.grpc.GrpcTransportOptions;

/**
 * Configuration for a {@link NodeHttp2gRPCTransport} factory.
 */
export interface NodeHttp2TransportConfig {
  /**
   * Connection-level receive window, applied via `session.setLocalWindowSize()`.
   * Per RFC 9113 6.9.2 the connection window cannot be changed via SETTINGS, so
   * unlike the per-stream window this is not an `http2.connect` option.
   *
   * Must be >= `sessionOptions.settings.initialWindowSize`. Can be increased
   * above it to account for multiple streams sharing a session.
   */
  sessionLocalWindowSize?: number;
  /**
   * Passed through to `http2.connect`.
   *
   * Note that `sessionOptions.settings.initialWindowSize` is the per-stream
   * receive window. Node defaults to 64KB and, unlike browsers, never grows it.
   * Only one window of data can be in flight before the sender waits for the
   * receiver to acknowledge it, so a single stream is capped at roughly
   * `window / RTT` (round-trip time) regardless of bandwidth — ~819KB/s at 80ms.
   * Sizing is left to the consumer, since a larger window costs buffer memory
   * and weakens backpressure.
   */
  sessionOptions?: http2.SecureClientSessionOptions;
}

/**
 * Session state logged via {@link NodeHttp2gRPCTransport.logMessage} on each
 * session lifecycle event, as the second argument to the log message.
 *
 * Each event carries only what it updated, so a field is absent rather than
 * stale on events that say nothing about it.
 */
export interface NodeHttp2SessionInfo {
  origin: string;
  event: 'connect' | 'localSettings' | 'remoteSettings' | 'close' | 'error';
  effectiveLocalWindowSize?: number;
  localInitialWindowSize?: number;
  remoteInitialWindowSize?: number;
  remoteMaxConcurrentStreams?: number;
  error?: Error;
}

/** Reject config that cannot do what it looks like it does. */
function assertValidConfig({
  sessionLocalWindowSize,
  sessionOptions,
}: NodeHttp2TransportConfig): void {
  const initialWindowSize = sessionOptions?.settings?.initialWindowSize;

  if (sessionLocalWindowSize == null) {
    return;
  }

  // `setLocalWindowSize` rejects these, but not until the session connects,
  // where the failure is only a log and the session runs at Node's default.
  // `sessionOptions.settings` needs no equivalent check, since `http2.connect`
  // validates it synchronously out of `create`.
  if (
    !Number.isInteger(sessionLocalWindowSize) ||
    sessionLocalWindowSize < 0 ||
    sessionLocalWindowSize > MAX_WINDOW_SIZE
  ) {
    throw new Error(
      `sessionLocalWindowSize (${sessionLocalWindowSize}) must be an integer ` +
        `between 0 and ${MAX_WINDOW_SIZE}.`
    );
  }

  if (initialWindowSize == null) {
    return;
  }

  if (sessionLocalWindowSize < initialWindowSize) {
    throw new Error(
      `sessionLocalWindowSize (${sessionLocalWindowSize}) is below ` +
        `sessionOptions.settings.initialWindowSize (${initialWindowSize}). The ` +
        `connection window caps every stream, so the stream window is ` +
        `unreachable and throughput is limited to the smaller value.`
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
   * Log a session lifecycle event and whatever it updated. Each event reads its
   * own values at the call site, so nothing here touches the session.
   * @param origin Origin of the session the event came from.
   * @param event The event that fired.
   * @param updated The values that event updated.
   */
  private static logSession(
    origin: string,
    event: NodeHttp2SessionInfo['event'],
    updated: Omit<NodeHttp2SessionInfo, 'origin' | 'event'> = {}
  ): void {
    const info: NodeHttp2SessionInfo = { origin, event, ...updated };

    NodeHttp2gRPCTransport.logMessage(
      event === 'error' ? 'error' : 'debug',
      info
    );
  }

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
      const { sessionLocalWindowSize, sessionOptions } = config;

      const session = http2.connect(origin, sessionOptions);

      session.on('connect', () => {
        const localWindowSize =
          sessionLocalWindowSize ?? sessionOptions?.settings?.initialWindowSize;

        try {
          if (localWindowSize != null) {
            session.setLocalWindowSize(localWindowSize);
          }
        } catch (err) {
          NodeHttp2gRPCTransport.logSession(origin, 'error', {
            error: new Error('Failed to set session window size', {
              cause: err,
            }),
          });
        }

        NodeHttp2gRPCTransport.logSession(origin, 'connect', {
          effectiveLocalWindowSize: session.state.effectiveLocalWindowSize,
        });
      });

      session.on('localSettings', () => {
        NodeHttp2gRPCTransport.logSession(origin, 'localSettings', {
          localInitialWindowSize: session.localSettings.initialWindowSize,
        });
      });

      session.on('remoteSettings', () => {
        NodeHttp2gRPCTransport.logSession(origin, 'remoteSettings', {
          remoteInitialWindowSize: session.remoteSettings.initialWindowSize,
          remoteMaxConcurrentStreams:
            session.remoteSettings.maxConcurrentStreams,
        });
      });

      session.on('error', err => {
        NodeHttp2gRPCTransport.logSession(origin, 'error', { error: err });
      });

      session.on('close', () => {
        // Delete by identity. A replacement session for this origin can already
        // be mapped by the time this fires, and deleting by origin alone would
        // untrack it, leaking it past `dispose` and duplicating it on `create`.
        if (sessionMap.get(origin) === session) {
          sessionMap.delete(origin);
        }

        if (sessionMap.size === 0) {
          NodeHttp2gRPCTransport.sessionMaps.delete(sessionMap);
        }

        NodeHttp2gRPCTransport.logSession(origin, 'close');
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

        return new NodeHttp2gRPCTransport(options, session);
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

  private static defaultFactory: GrpcTransportFactory | null = null;

  /**
   * Factory for creating new NodeHttp2gRPCTransport instances.
   * @deprecated Use {@link NodeHttp2gRPCTransport.createFactory} instead, which
   * supports configuration.
   */
  static get factory(): GrpcTransportFactory {
    NodeHttp2gRPCTransport.defaultFactory ??=
      NodeHttp2gRPCTransport.createFactory();

    return NodeHttp2gRPCTransport.defaultFactory;
  }

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
   */
  private constructor(
    options: GrpcTransportOptions,
    session: http2.ClientHttp2Session
  ) {
    this.options = options;
    this.session = session;
  }

  private readonly options: GrpcTransportOptions;

  private readonly session: http2.ClientHttp2Session;

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

    // Note that `chunk` is technically a `Buffer`, but the `Buffer` type defined
    // in @types/pouchdb-core is outdated and incompatible with latest `Uint8Array`
    // types. Since `Buffer` inherits from `Uint8Array`, we can get around this
    // by just declaring it as a `Uint8Array`.
    req.on('data', (chunk: Uint8Array) => {
      this.options.onChunk(chunk);
    });
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
