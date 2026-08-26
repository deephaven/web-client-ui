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

const RESPONSE_WRITE_CHUNK = Buffer.alloc(1024, 1);
const RESPONSE_END_CHUNK = Buffer.alloc(1024, 2);

const servers: http2.Http2Server[] = [];

function respondWithChunks(stream: http2.ServerHttp2Stream): void {
  stream.respond({ ':status': 200, 'content-type': 'application/grpc' });
  stream.write(RESPONSE_WRITE_CHUNK);
  stream.end(RESPONSE_END_CHUNK);
}

async function startServer(
  handleStream: (stream: http2.ServerHttp2Stream) => void = respondWithChunks,
  serverSettings?: http2.Settings
): Promise<string> {
  const server = http2.createServer({ settings: serverSettings });
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
    expect(session.state.effectiveLocalWindowSize).toEqual(
      NODE_DEFAULT_WINDOW_SIZE
    );
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
    expect(session.state.effectiveLocalWindowSize).toEqual(
      NODE_DEFAULT_WINDOW_SIZE
    );
  });

  it('should derive the session window from settings.initialWindowSize when unset', async () => {
    const initialWindowSize = 1024 * 1024;

    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        sessionOptions: { settings: { initialWindowSize } },
      }),
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(initialWindowSize);
    expect(session.state.effectiveLocalWindowSize).toEqual(initialWindowSize);
  });

  it('should not derive the stream window from sessionLocalWindowSize', async () => {
    const sessionLocalWindowSize = 2 * 1024 * 1024;
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        sessionLocalWindowSize,
      }),
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(
      NODE_DEFAULT_WINDOW_SIZE
    );
    expect(session.state.effectiveLocalWindowSize).toEqual(
      sessionLocalWindowSize
    );
  });

  it('should apply configured window sizes', async () => {
    const initialWindowSize = 1024 * 1024;
    const sessionLocalWindowSize = 2 * 1024 * 1024;
    const origin = await startServer();
    const transport = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        sessionLocalWindowSize,
        sessionOptions: { settings: { initialWindowSize } },
      }),
      origin
    );
    const session = getSession(transport);

    expect(session.localSettings.initialWindowSize).toEqual(initialWindowSize);
    expect(session.state.effectiveLocalWindowSize).toEqual(
      sessionLocalWindowSize
    );
  });
});

describe('config validation', () => {
  it('should throw when sessionLocalWindowSize is below the stream window', () => {
    expect(() =>
      NodeHttp2gRPCTransport.createFactory({
        sessionLocalWindowSize: 1024 * 1024,
        sessionOptions: { settings: { initialWindowSize: 4 * 1024 * 1024 } },
      })
    ).toThrow('is below sessionOptions.settings.initialWindowSize');
  });

  it.each([2 ** 31, -1, 1.5])(
    'should throw when sessionLocalWindowSize is %p',
    windowSize => {
      // Rejected up front rather than at connect, where the session would
      // silently run at Node's default
      expect(() =>
        NodeHttp2gRPCTransport.createFactory({
          sessionLocalWindowSize: windowSize,
        })
      ).toThrow('must be an integer between 0 and 2147483647');
    }
  );
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
      NodeHttp2gRPCTransport.createFactory({
        sessionOptions: { settings: { initialWindowSize: 1024 * 1024 } },
      }),
      origin
    );
    const transportB = await createConnectedTransport(
      NodeHttp2gRPCTransport.createFactory({
        sessionOptions: { settings: { initialWindowSize: 2 * 1024 * 1024 } },
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
      sessionOptions: { settings: { initialWindowSize: 1024 * 1024 } },
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

describe('deprecated `factory`', () => {
  it('should memoize the lazily created factory', () => {
    expect(NodeHttp2gRPCTransport.factory).toBe(NodeHttp2gRPCTransport.factory);
  });

  it('should share one session across the transports it creates', async () => {
    const origin = await startServer();

    // Would regress to a session per access if the getter stopped memoizing
    const transportA = NodeHttp2gRPCTransport.factory.create(
      createTransportOptions(origin)
    );
    const transportB = NodeHttp2gRPCTransport.factory.create(
      createTransportOptions(origin)
    );

    expect(getSession(transportB)).toBe(getSession(transportA));
  });
});

describe('client streaming', () => {
  it('should signal that multiple messages can be sent per stream', () => {
    expect(NodeHttp2gRPCTransport.createFactory().supportsClientStreaming).toBe(
      true
    );
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

  it('should keep a replacement session tracked once the disposed one closes', async () => {
    const origin = await startServer();
    const factory = NodeHttp2gRPCTransport.createFactory();

    const sessionA = getSession(factory.create(createTransportOptions(origin)));

    // Clears the session map and starts closing A, which has not closed yet
    NodeHttp2gRPCTransport.dispose();

    const sessionB = getSession(factory.create(createTransportOptions(origin)));
    expect(sessionB).not.toBe(sessionA);

    await new Promise<void>(resolve => {
      sessionA.once('close', () => resolve());
    });

    // A's close must not untrack B, or B leaks and every create duplicates it
    expect(getSession(factory.create(createTransportOptions(origin)))).toBe(
      sessionB
    );
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
    expect(byteCount).toEqual(
      RESPONSE_WRITE_CHUNK.length + RESPONSE_END_CHUNK.length
    );
  });
});

describe('session logging', () => {
  /** Session events are logged as a bare {@link NodeHttp2SessionInfo}. */
  function trackSessionInfo(): {
    infoByEvent: (
      event: NodeHttp2SessionInfo['event']
    ) => NodeHttp2SessionInfo | undefined;
    levelByEvent: (event: NodeHttp2SessionInfo['event']) => string | undefined;
    unsubscribe: () => void;
  } {
    const logged: { level: string; info: NodeHttp2SessionInfo }[] = [];

    const unsubscribe = NodeHttp2gRPCTransport.onLogMessage(
      (level, ...args) => {
        const [info] = args as [NodeHttp2SessionInfo?];
        if (info != null && typeof info === 'object' && 'event' in info) {
          logged.push({ level, info });
        }
      }
    );

    const find = (event: NodeHttp2SessionInfo['event']) =>
      logged.find(entry => entry.info.event === event);

    return {
      infoByEvent: event => find(event)?.info,
      levelByEvent: event => find(event)?.level,
      unsubscribe,
    };
  }

  it('should log at a level derived from the event', async () => {
    const origin = await startServer();
    const { levelByEvent, unsubscribe } = trackSessionInfo();

    try {
      await createConnectedTransport(
        NodeHttp2gRPCTransport.createFactory(),
        origin
      );

      expect(levelByEvent('connect')).toEqual('debug');
      expect(levelByEvent('localSettings')).toEqual('debug');
    } finally {
      unsubscribe();
    }
  });

  it('should log a session error at error level', async () => {
    const { infoByEvent, levelByEvent, unsubscribe } = trackSessionInfo();

    try {
      // Nothing is listening, so the session errors instead of connecting
      const factory = NodeHttp2gRPCTransport.createFactory();
      factory.create(createTransportOptions('http://127.0.0.1:1'));

      await new Promise<void>(resolve => {
        const intervalId = setInterval(() => {
          if (infoByEvent('error') != null) {
            clearInterval(intervalId);
            resolve();
          }
        }, 10);
      });

      expect(levelByEvent('error')).toEqual('error');
      expect(infoByEvent('error')?.error).toBeDefined();
    } finally {
      unsubscribe();
    }
  });

  it('should log the stream window only once it has been applied', async () => {
    const origin = await startServer();
    const { infoByEvent, unsubscribe } = trackSessionInfo();

    try {
      await createConnectedTransport(
        NodeHttp2gRPCTransport.createFactory({
          sessionOptions: { settings: { initialWindowSize: 1024 * 1024 } },
        }),
        origin
      );

      // Omitted at `connect`, where it would still report Node's default
      expect(infoByEvent('connect')).toBeDefined();
      expect(infoByEvent('connect')?.localInitialWindowSize).toBeUndefined();
      expect(infoByEvent('localSettings')?.localInitialWindowSize).toEqual(
        1024 * 1024
      );
    } finally {
      unsubscribe();
    }
  });

  it('should log the peer settings once the peer has advertised them', async () => {
    const origin = await startServer(respondWithChunks, {
      initialWindowSize: 3 * 1024 * 1024,
      maxConcurrentStreams: 77,
    });
    const { infoByEvent, unsubscribe } = trackSessionInfo();

    try {
      // The peer's SETTINGS arrive ahead of the ack of our own
      await createConnectedTransport(
        NodeHttp2gRPCTransport.createFactory(),
        origin
      );

      expect(infoByEvent('remoteSettings')?.remoteInitialWindowSize).toEqual(
        3 * 1024 * 1024
      );
      expect(infoByEvent('remoteSettings')?.remoteMaxConcurrentStreams).toEqual(
        77
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
          sessionLocalWindowSize: 2 * 1024 * 1024,
        }),
        origin
      );
      const session = getSession(transport);

      expect(infoByEvent('connect')?.origin).toEqual(origin);
      expect(infoByEvent('connect')?.effectiveLocalWindowSize).toEqual(
        2 * 1024 * 1024
      );

      // Omitted at `connect`, where Node would report an assumption of its own
      // rather than anything the peer advertised
      expect(
        infoByEvent('connect')?.remoteMaxConcurrentStreams
      ).toBeUndefined();
      expect(infoByEvent('connect')?.remoteInitialWindowSize).toBeUndefined();

      // Nothing is readable off a destroyed session, so `close` reports none of it
      expect(infoByEvent('close')?.effectiveLocalWindowSize).toBeUndefined();

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
