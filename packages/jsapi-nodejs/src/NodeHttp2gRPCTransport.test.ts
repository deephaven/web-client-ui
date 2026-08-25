import http2 from 'node:http2';
import type { AddressInfo } from 'node:net';
import type { dh as DhcType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  NodeHttp2gRPCTransport,
  type NodeHttp2SessionInfo,
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
  it('should throw when sessionWindowSize is below initialWindowSize', () => {
    expect(() =>
      NodeHttp2gRPCTransport.createFactory({
        initialWindowSize: 4 * 1024 * 1024,
        sessionWindowSize: 1024 * 1024,
      })
    ).toThrow('is below initialWindowSize');
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

  it('should apply one config to every origin it connects to', async () => {
    const originA = await startServer();
    const originB = await startServer();
    const factory = NodeHttp2gRPCTransport.createFactory({
      initialWindowSize: 1024 * 1024,
    });

    const sessionA = getSession(
      await createConnectedTransport(factory, originA)
    );
    const sessionB = getSession(
      await createConnectedTransport(factory, originB)
    );

    expect(sessionB).not.toBe(sessionA);
    expect(sessionA.localSettings.initialWindowSize).toEqual(1024 * 1024);
    expect(sessionB.localSettings.initialWindowSize).toEqual(1024 * 1024);
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

describe('requests', () => {
  it('should pass response chunks through to onChunk', async () => {
    const origin = await startServer();
    const onChunk = jest.fn();

    await runRequest(NodeHttp2gRPCTransport.createFactory(), origin, onChunk);

    const byteCount = onChunk.mock.calls.reduce(
      (total, [chunk]: [Uint8Array]) => total + chunk.length,
      0
    );
    expect(byteCount).toEqual(RESPONSE_CHUNK.length * 2);
  });
});

describe('session logging', () => {
  /**
   * Session state is logged as the second arg of each session log message, so
   * that is how a consumer observes it.
   */
  function trackSessionInfo(): {
    infoByEvent: (
      event: NodeHttp2SessionInfo['event']
    ) => NodeHttp2SessionInfo | undefined;
    unsubscribe: () => void;
  } {
    const infos: NodeHttp2SessionInfo[] = [];

    const unsubscribe = NodeHttp2gRPCTransport.onLogMessage(
      (_level, ...args) => {
        const [, info] = args as [string, NodeHttp2SessionInfo?];
        if (info != null && typeof info === 'object' && 'event' in info) {
          infos.push(info);
        }
      }
    );

    return {
      infoByEvent: event => infos.find(info => info.event === event),
      unsubscribe,
    };
  }

  it('should log the configured window only from localSettings onward', async () => {
    const origin = await startServer();
    const { infoByEvent, unsubscribe } = trackSessionInfo();

    try {
      await createConnectedTransport(
        NodeHttp2gRPCTransport.createFactory({
          initialWindowSize: 1024 * 1024,
        }),
        origin
      );

      // Settings have not been applied yet at `connect`
      expect(infoByEvent('connect')?.localInitialWindowSize).toEqual(
        NODE_DEFAULT_WINDOW_SIZE
      );
      expect(infoByEvent('localSettings')?.localInitialWindowSize).toEqual(
        1024 * 1024
      );
    } finally {
      unsubscribe();
    }
  });

  it('should log session state on connect and close', async () => {
    const origin = await startServer();
    const { infoByEvent, unsubscribe } = trackSessionInfo();

    try {
      const transport = await createConnectedTransport(
        NodeHttp2gRPCTransport.createFactory({
          sessionWindowSize: 2 * 1024 * 1024,
        }),
        origin
      );
      const session = getSession(transport);

      expect(infoByEvent('connect')?.origin).toEqual(origin);
      expect(infoByEvent('connect')?.localWindowSize).toEqual(2 * 1024 * 1024);

      const closed = new Promise<void>(resolve => {
        session.once('close', () => resolve());
      });
      session.close();
      await closed;

      expect(infoByEvent('close')).toBeDefined();
    } finally {
      unsubscribe();
    }
  });
});
