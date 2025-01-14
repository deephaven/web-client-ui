import http2 from 'node:http2';
import type { dh as DhcType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';

const logger = Log.module('@deephaven/jsapi-nodejs.NodeHttp2gRPCTransport');

type GrpcTransport = DhcType.grpc.GrpcTransport;
type GrpcTransportFactory = DhcType.grpc.GrpcTransportFactory;
type GrpcTransportOptions = DhcType.grpc.GrpcTransportOptions;

/**
 * A gRPC transport implementation using Node.js's built-in HTTP/2 client. This
 * can be passed to the CoreClient constructor to adapt the underlying transport
 * to use http2. This addresses a limitation of nodejs `fetch` implementation
 * which currently uses http1.
 *
 * e.g.
 * const client = new dhc.CoreClient(dhServerUrl, {
 *   transportFactory: NodeHttp2gRPCTransport.factory,
 * })
 */
export class NodeHttp2gRPCTransport implements GrpcTransport {
  private static sessionMap: Map<string, http2.ClientHttp2Session> = new Map();

  /**
   * Factory for creating new NodeHttp2gRPCTransport instances.
   */
  static readonly factory: GrpcTransportFactory = {
    /**
     * Create a new transport instance.
     * @param options - options for creating the transport
     * @return a transport instance to use for gRPC communication
     */
    create: (options: GrpcTransportOptions): GrpcTransport => {
      const { origin } = new URL(options.url);

      if (!NodeHttp2gRPCTransport.sessionMap.has(origin)) {
        const session = http2.connect(origin);
        session.on('error', err => {
          logger.error('Session error', err);
        });
        NodeHttp2gRPCTransport.sessionMap.set(origin, session);
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const session = NodeHttp2gRPCTransport.sessionMap.get(origin)!;

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
      return false;
    },
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

    logger.debug('createRequest', url.pathname);

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
    logger.debug('start', metadata.headersMap);

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
    logger.debug('sendMessage', msgBytes);
    assertNotNull(this.request, 'request is required');

    this.request.write(msgBytes);
  }

  /**
   * "Half close" the stream, signaling to the server that no more messages will
   * be sent, but that the client is still open to receiving messages.
   */
  finishSend(): void {
    logger.debug('finishSend');
    assertNotNull(this.request, 'request is required');
    this.request.end();
  }

  /**
   * End the stream, both notifying the server that no more messages will be
   * sent nor received, and preventing the client from receiving any more events.
   */
  cancel(): void {
    logger.debug('cancel');
    assertNotNull(this.request, 'request is required');
    this.request.close();
  }

  /**
   * Cleanup.
   */
  static dispose(): void {
    // eslint-disable-next-line no-restricted-syntax
    for (const session of NodeHttp2gRPCTransport.sessionMap.values()) {
      session.close();
    }
    NodeHttp2gRPCTransport.sessionMap.clear();
  }
}

export default NodeHttp2gRPCTransport;
