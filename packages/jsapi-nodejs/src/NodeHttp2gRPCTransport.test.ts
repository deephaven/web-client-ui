import http2 from 'node:http2';
import type { AddressInfo } from 'node:net';
import { performance } from 'node:perf_hooks';
import type { dh as DhcType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  NodeHttp2gRPCTransport,
  type NodeHttp2SessionMetrics,
  type NodeHttp2StreamMetrics,
  type NodeHttp2TransportConfig,
} from './NodeHttp2gRPCTransport';

Log.setLogLevel(-1);

const NODE_DEFAULT_WINDOW_SIZE = 65535;

const RESPONSE_CHUNK = Buffer.alloc(1024, 1);

const servers: http2.Http2Server[] = [];

function respondWithChunks(stream: http2.ServerHttp2Stream): void {
  stream.respond({ ':status': 200, 'content-type': 'application/grpc' });
  stream.write(RESPONSE_CHUNK);
  stream.end(RESPONSE_CHUNK);
}

async function startServer(
  handleStream: (stream: http2.ServerHttp2Stream) => void = respondWithChunks
): Promise<string> {
  const server = http2.createServer();
  servers.push(server);

  server.on('stream', handleStream);

  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function createTransportOptions(
  origin: string,
  overrides: Partial<DhcType.grpc.GrpcTransportOptions> = {}
): DhcType.grpc.GrpcTransportOptions {
  return {
    url: new URL(`${origin}/test.Service/method`),
    debug: false,
    onHeaders: jest.fn(),
    onChunk: jest.fn(),
    onEnd: jest.fn(),
    ...overrides,
  };
}

/** The session is private to the transport, but is what these tests assert on. */
function getSession(
  transport: DhcType.grpc.GrpcTransport
): http2.ClientHttp2Session {
  return (transport as unknown as { session: http2.ClientHttp2Session })
    .session;
}

/**
 * Settings are applied asynchronously, so `localSettings` is the first point
 * where the negotiated values can be read.
 */
async function waitForLocalSettings(
  session: http2.ClientHttp2Session
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      session.off('localSettings', handleLocalSettings);
      reject(new Error('Timed out waiting for localSettings'));
    }, 5000);

    function handleLocalSettings(): void {
      clearTimeout(timeoutId);
      session.off('localSettings', handleLocalSettings);
      resolve();
    }

    session.on('localSettings', handleLocalSettings);
  });
}

/**
 * Create a transport against `origin` and wait until its session has applied
 * its settings.
 */
async function createConnectedTransport(
  factory: DhcType.grpc.GrpcTransportFactory,
  origin: string
): Promise<DhcType.grpc.GrpcTransport> {
  const transport = factory.create(createTransportOptions(origin));
  await waitForLocalSettings(getSession(transport));
  return transport;
}

/** Run a full request / response cycle and resolve once the stream ends. */
async function runRequest(
  factory: DhcType.grpc.GrpcTransportFactory,
  origin: string,
  onChunk: (chunk: Uint8Array) => void = jest.fn()
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transport = factory.create(
      createTransportOptions(origin, {
        onChunk,
        onEnd: (error?: Error | null) => {
          if (error != null) {
            reject(error);
          } else {
            resolve();
          }
        },
      })
    );

    transport.start({});
    transport.finishSend();
  });
}

/** Collect `error` level log messages emitted while `run` executes. */
async function captureErrors(run: () => Promise<unknown>): Promise<string[]> {
  const onLogMessage = jest.fn();
  const removeHandler = NodeHttp2gRPCTransport.onLogMessage(onLogMessage);

  try {
    await run();
  } finally {
    removeHandler();
  }

  return onLogMessage.mock.calls
    .filter(([level]) => level === 'error')
    .map(([, message]) => String(message));
}

afterEach(async () => {
  NodeHttp2gRPCTransport.dispose();

  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => {
          server.close(() => resolve());
        })
    )
  );
});

describe('window sizes', () => {
  it('should leave both windows at Node defaults when unconfigured', async () => {
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory(),
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(
      NODE_DEFAULT_WINDOW_SIZE
    );
    expect(session.state.localWindowSize).toEqual(NODE_DEFAULT_WINDOW_SIZE);
  });

  it('should leave both windows at Node defaults through the deprecated `factory`', async () => {
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.factory,
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(
      NODE_DEFAULT_WINDOW_SIZE
    );
    expect(session.state.localWindowSize).toEqual(NODE_DEFAULT_WINDOW_SIZE);
  });

  it('should derive the session window from initialWindowSize when unset', async () => {
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({ initialWindowSize: 1024 * 1024 }),
      origin
    );
    const session = getSession(transport);

    // A connection window left at 64KB would cap every stream, making the
    // configured stream window unreachable.
    expect(session.localSettings.initialWindowSize).toEqual(1024 * 1024);
    expect(session.state.localWindowSize).toEqual(1024 * 1024);
  });

  it('should not derive the stream window from sessionWindowSize', async () => {
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        sessionWindowSize: 2 * 1024 * 1024,
      }),
      origin
    );
    const session = getSession(transport);

    // A large connection window over a small stream window is a valid way to
    // share a session between many streams, so it is left alone.
    expect(session.localSettings.initialWindowSize).toEqual(
      NODE_DEFAULT_WINDOW_SIZE
    );
    expect(session.state.localWindowSize).toEqual(2 * 1024 * 1024);
  });

  it('should apply configured window sizes', async () => {
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        initialWindowSize: 1024 * 1024,
        sessionWindowSize: 2 * 1024 * 1024,
      }),
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(1024 * 1024);
    expect(session.state.localWindowSize).toEqual(2 * 1024 * 1024);
  });

  it('should give `initialWindowSize` precedence over `sessionOptions.settings` while preserving other settings', async () => {
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        initialWindowSize: 1024 * 1024,
        sessionOptions: {
          settings: {
            initialWindowSize: NODE_DEFAULT_WINDOW_SIZE,
            headerTableSize: 8192,
          },
        },
      }),
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(1024 * 1024);
    expect(session.localSettings.headerTableSize).toEqual(8192);
  });
});

describe('config validation', () => {
  it('should log an error when sessionWindowSize is below initialWindowSize', async () => {
    const origin = await startServer();
    const factory = NodeHttp2gRPCTransport.createFactory({
      initialWindowSize: 4 * 1024 * 1024,
      sessionWindowSize: 1024 * 1024,
    });

    const errors = await captureErrors(() =>
      createConnectedTransport(factory, origin)
    );

    expect(
      errors.some(message => message.includes('is below initialWindowSize'))
    ).toBe(true);
  });

  it('should validate once per origin, not per create()', async () => {
    const origin = await startServer();
    const factory = NodeHttp2gRPCTransport.createFactory({
      initialWindowSize: 4 * 1024 * 1024,
      sessionWindowSize: 1024 * 1024,
    });

    const errors = await captureErrors(async () => {
      factory.create(createTransportOptions(origin));
      factory.create(createTransportOptions(origin));
    });

    expect(errors).toHaveLength(1);
  });
});

describe('session sharing', () => {
  it('should reuse a single session per origin within a factory', async () => {
    const origin = await startServer();
    const factory = NodeHttp2gRPCTransport.createFactory();

    const transportA = factory.create(createTransportOptions(origin));
    const transportB = factory.create(createTransportOptions(origin));

    expect(getSession(transportB)).toBe(getSession(transportA));
  });

  it('should not share sessions across factories', async () => {
    const origin = await startServer();

    const transportA = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({ initialWindowSize: 1024 * 1024 }),
      origin
    );
    const transportB = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        initialWindowSize: 2 * 1024 * 1024,
      }),
      origin
    );

    const sessionA = getSession(transportA);
    const sessionB = getSession(transportB);

    expect(sessionB).not.toBe(sessionA);
    expect(sessionA.localSettings.initialWindowSize).toEqual(1024 * 1024);
    expect(sessionB.localSettings.initialWindowSize).toEqual(2 * 1024 * 1024);
  });

  it('should call a config resolver once per origin, not per create()', async () => {
    const originA = await startServer();
    const originB = await startServer();

    const resolver = jest.fn<NodeHttp2TransportConfig, [string]>(() => ({}));
    const factory = NodeHttp2gRPCTransport.createFactory(resolver);

    factory.create(createTransportOptions(originA));
    factory.create(createTransportOptions(originA));
    factory.create(createTransportOptions(originB));
    factory.create(createTransportOptions(originB));

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(resolver).toHaveBeenCalledWith(new URL(originA).origin);
    expect(resolver).toHaveBeenCalledWith(new URL(originB).origin);
  });
});

describe('dispose', () => {
  it('should close sessions belonging to every factory', async () => {
    const origin = await startServer();

    const transportA = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory(),
      origin
    );
    const transportB = await createConnectedTransport(
      NodeHttp2gRPCTransport.factory,
      origin
    );

    const sessionA = getSession(transportA);
    const sessionB = getSession(transportB);

    const closed = Promise.all([
      new Promise<void>(resolve => {
        sessionA.once('close', () => resolve());
      }),
      new Promise<void>(resolve => {
        sessionB.once('close', () => resolve());
      }),
    ]);

    NodeHttp2gRPCTransport.dispose();

    await closed;

    expect(sessionA.closed).toBe(true);
    expect(sessionB.closed).toBe(true);
  });
});

describe('metrics', () => {
  it('should not do any timing work without a metricsConfig', async () => {
    const origin = await startServer();
    const factory = NodeHttp2gRPCTransport.createFactory();

    // Establish the session before spying so only request handling is measured
    await createConnectedTransport(factory, origin);

    const nowSpy = jest.spyOn(performance, 'now');

    try {
      const onChunk = jest.fn();
      await runRequest(factory, origin, onChunk);

      expect(onChunk).toHaveBeenCalled();
      expect(nowSpy).not.toHaveBeenCalled();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('should emit stream metrics on stream end', async () => {
    const origin = await startServer();
    const onStreamMetrics = jest.fn<void, [NodeHttp2StreamMetrics]>();
    const factory = NodeHttp2gRPCTransport.createFactory({
      metricsConfig: { onStreamMetrics, onSessionMetrics: jest.fn() },
    });

    await runRequest(factory, origin);

    expect(onStreamMetrics).toHaveBeenCalled();

    const metrics = onStreamMetrics.mock.calls[0][0];
    expect(metrics.event).toEqual('end');
    expect(metrics.origin).toEqual(origin);
    expect(metrics.path).toEqual('/test.Service/method');
    expect(metrics.byteCount).toEqual(RESPONSE_CHUNK.length * 2);
    expect(metrics.chunkCount).toBeGreaterThan(0);
    expect(metrics.maxChunkBytes).toBeGreaterThan(0);
    expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
    expect(metrics.consumerTimeMs).toBeGreaterThanOrEqual(0);
    expect(metrics.timeToFirstChunkMs).toBeGreaterThanOrEqual(0);
  });

  it('should emit stream metrics when the stream is reset', async () => {
    const origin = await startServer(stream => {
      // The reset surfaces on both ends; only the client side is under test
      stream.on('error', () => undefined);
      stream.close(http2.constants.NGHTTP2_INTERNAL_ERROR);
    });
    const onStreamMetrics = jest.fn<void, [NodeHttp2StreamMetrics]>();
    const factory = NodeHttp2gRPCTransport.createFactory({
      metricsConfig: { onStreamMetrics, onSessionMetrics: jest.fn() },
    });

    await expect(runRequest(factory, origin)).rejects.toBeDefined();

    expect(onStreamMetrics).toHaveBeenCalledTimes(1);
    expect(onStreamMetrics.mock.calls[0][0].event).toEqual('end');
  });

  it('should emit session metrics for connect and close', async () => {
    const origin = await startServer();
    const onSessionMetrics = jest.fn<void, [NodeHttp2SessionMetrics]>();

    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        sessionWindowSize: 2 * 1024 * 1024,
        sessionOptions: { maxSessionMemory: 32 },
        metricsConfig: { onSessionMetrics, onStreamMetrics: jest.fn() },
      }),
      origin
    );
    const session = getSession(transport);

    const connectMetrics = onSessionMetrics.mock.calls
      .map(([metrics]) => metrics)
      .find(metrics => metrics.event === 'connect');

    expect(connectMetrics).toBeDefined();
    expect(connectMetrics?.origin).toEqual(origin);
    expect(connectMetrics?.localWindowSize).toEqual(2 * 1024 * 1024);
    expect(connectMetrics?.maxSessionMemoryMb).toEqual(32);

    const closed = new Promise<void>(resolve => {
      session.once('close', () => resolve());
    });
    session.close();
    await closed;

    expect(
      onSessionMetrics.mock.calls.some(([metrics]) => metrics.event === 'close')
    ).toBe(true);
  });
});
