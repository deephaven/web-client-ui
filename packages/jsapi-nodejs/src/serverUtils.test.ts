import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import {
  DownloadTimeoutError,
  HttpError,
  UntrustedUrlError,
} from './errorUtils';
import { downloadFromURL, urlToDirectoryName } from './serverUtils';

type TestServer = {
  url: URL;
  requests: http.IncomingMessage[];
  sockets: Socket[];
  close: () => Promise<void>;
};

const servers: TestServer[] = [];

const silentLogger = { error: jest.fn() };

async function startServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<TestServer> {
  const requests: http.IncomingMessage[] = [];
  const sockets: Socket[] = [];
  const server = http.createServer((req, res) => {
    requests.push(req);
    handler(req, res);
  });
  server.on('connection', socket => {
    sockets.push(socket);
  });

  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;
  const testServer: TestServer = {
    url: new URL(`http://127.0.0.1:${port}/`),
    requests,
    sockets,
    close: () =>
      new Promise<void>(resolve => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
  servers.push(testServer);
  return testServer;
}

/** URL of a port that refuses connections. */
async function getRefusedUrl(): Promise<URL> {
  const server = await startServer(() => undefined);
  await server.close();
  return server.url;
}

function waitForClose(socket: Socket): Promise<void> {
  return new Promise(resolve => {
    if (socket.destroyed) {
      resolve();
      return;
    }
    socket.on('close', () => resolve());
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.close()));
});

describe('downloadFromURL', () => {
  it('resolves the body of a 200 response', async () => {
    const server = await startServer((req, res) => {
      res.end('content');
    });

    await expect(downloadFromURL(server.url)).resolves.toEqual('content');
  });

  it.each([401, 500])('rejects a %s response with HttpError', async status => {
    const server = await startServer((req, res) => {
      res.statusCode = status;
      res.end('error body');
    });

    const result = downloadFromURL(server.url, { logger: silentLogger });

    await expect(result).rejects.toBeInstanceOf(HttpError);
    await expect(result).rejects.toMatchObject({ statusCode: status });
    expect(server.requests).toHaveLength(1);
  });

  it('rejects a 404 with a file not found message', async () => {
    const server = await startServer((req, res) => {
      res.statusCode = 404;
      res.end();
    });

    await expect(downloadFromURL(server.url)).rejects.toMatchObject({
      statusCode: 404,
      message: `File not found: "${server.url}"`,
    });
  });

  describe('redirects', () => {
    async function startRedirectServer(hops: number): Promise<TestServer> {
      return startServer((req, res) => {
        const n = Number(req.url?.slice(1) ?? 0);
        if (n < hops) {
          res.statusCode = 302;
          res.setHeader('Location', `/${n + 1}`);
          res.end('redirect body');
          return;
        }
        res.end(`final ${n}`);
      });
    }

    it('follows redirects up to maxRedirects', async () => {
      const server = await startRedirectServer(1);

      await expect(
        downloadFromURL(server.url, { maxRedirects: 1 })
      ).resolves.toEqual('final 1');
    });

    it('follows redirects by default', async () => {
      const server = await startRedirectServer(3);

      await expect(downloadFromURL(server.url)).resolves.toEqual('final 3');
    });

    it('rejects when redirects exceed maxRedirects', async () => {
      const server = await startRedirectServer(3);

      await expect(
        downloadFromURL(server.url, { maxRedirects: 2 })
      ).rejects.toMatchObject({ name: 'HttpError', statusCode: 302 });
      expect(server.requests).toHaveLength(3);
    });

    it('rejects a redirect when maxRedirects is 0', async () => {
      const server = await startRedirectServer(1);

      await expect(
        downloadFromURL(server.url, { maxRedirects: 0 })
      ).rejects.toMatchObject({ name: 'HttpError', statusCode: 302 });
    });

    it('rejects a redirect with an invalid Location header', async () => {
      const server = await startServer((req, res) => {
        res.statusCode = 302;
        res.setHeader('Location', 'http://[bad');
        res.end();
      });

      await expect(downloadFromURL(server.url)).rejects.toMatchObject({
        name: 'HttpError',
        statusCode: 302,
        message: `Invalid redirect location "http://[bad" from "${server.url}"`,
      });
      expect(server.requests).toHaveLength(1);
    });

    it('never requests an untrusted redirect target', async () => {
      const target = await startServer((req, res) => {
        res.end('untrusted');
      });
      const source = await startServer((req, res) => {
        res.statusCode = 302;
        res.setHeader('Location', target.url.href);
        res.end();
      });

      const result = downloadFromURL(source.url, {
        isTrustedUrl: url => url.origin === source.url.origin,
      });

      await expect(result).rejects.toBeInstanceOf(UntrustedUrlError);
      await expect(result).rejects.toMatchObject({ url: target.url.href });
      expect(source.requests).toHaveLength(1);
      expect(target.requests).toHaveLength(0);
    });
  });

  it('never requests an untrusted initial url', async () => {
    const server = await startServer((req, res) => {
      res.end();
    });

    await expect(
      downloadFromURL(server.url, { isTrustedUrl: () => false })
    ).rejects.toBeInstanceOf(UntrustedUrlError);
    expect(server.requests).toHaveLength(0);
  });

  it('rejects a timeout with DownloadTimeoutError and closes the socket', async () => {
    const server = await startServer(() => {
      // Never respond
    });

    const result = downloadFromURL(server.url, {
      timeoutMs: 50,
      retryDelayMs: 10,
      logger: silentLogger,
    });

    await expect(result).rejects.toBeInstanceOf(DownloadTimeoutError);
    await expect(result).rejects.toMatchObject({ timeoutMs: 50 });
    await waitForClose(server.sockets[0]);
    expect(server.requests).toHaveLength(1);
  });

  describe('abort', () => {
    it('rejects without a request if already aborted', async () => {
      const server = await startServer((req, res) => {
        res.end();
      });
      const controller = new AbortController();
      controller.abort(new Error('stop'));

      await expect(
        downloadFromURL(server.url, { signal: controller.signal })
      ).rejects.toThrow('stop');
      expect(server.requests).toHaveLength(0);
    });

    it('aborts an in-flight request', async () => {
      const controller = new AbortController();
      const server = await startServer(() => {
        controller.abort(new Error('stop'));
      });

      await expect(
        downloadFromURL(server.url, {
          signal: controller.signal,
          logger: silentLogger,
        })
      ).rejects.toThrow('stop');
      await waitForClose(server.sockets[0]);
    });

    it('cancels a pending retry', async () => {
      // Aborting rejects immediately whether or not the retry timer is
      // cleared, so the rejection alone doesn't prove cancellation. Instead,
      // abort after the first failure has scheduled its retry, then assert
      // that this timer was passed to clearTimeout.
      const url = await getRefusedUrl();
      const controller = new AbortController();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const logger = {
        error: jest.fn((msg: unknown) => {
          if (msg === 'Retrying url:') {
            // Abort once the retry delay has been scheduled.
            queueMicrotask(() => controller.abort(new Error('stop')));
          }
        }),
      };

      await expect(
        downloadFromURL(url, {
          retries: 5,
          retryDelayMs: 60_000,
          signal: controller.signal,
          logger,
        })
      ).rejects.toThrow('stop');

      const retryTimerIndex = setTimeoutSpy.mock.calls.findIndex(
        ([, delay]) => delay === 60_000
      );
      expect(retryTimerIndex).not.toBe(-1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(
        setTimeoutSpy.mock.results[retryTimerIndex].value
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });

  it('retries network errors with the configured count and delay', async () => {
    const url = await getRefusedUrl();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await expect(
      downloadFromURL(url, {
        retries: 2,
        retryDelayMs: 10,
        logger: silentLogger,
      })
    ).rejects.toMatchObject({ code: 'ECONNREFUSED' });
    expect(
      setTimeoutSpy.mock.calls.filter(([, delay]) => delay === 10)
    ).toHaveLength(2);
    expect(
      silentLogger.error.mock.calls.filter(([msg]) => msg === 'Retrying url:')
    ).toHaveLength(2);
    setTimeoutSpy.mockRestore();
  });

  it('logs to the given logger instead of console', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const url = await getRefusedUrl();

    await expect(
      downloadFromURL(url, {
        retries: 1,
        retryDelayMs: 10,
        logger: silentLogger,
      })
    ).rejects.toBeDefined();
    expect(silentLogger.error).toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('supports legacy positional arguments', async () => {
    const url = await getRefusedUrl();

    await expect(
      downloadFromURL(url, 0, 10, silentLogger)
    ).rejects.toMatchObject({ code: 'ECONNREFUSED' });
    expect(silentLogger.error).toHaveBeenCalled();
  });
});

describe('urlToDirectoryName', () => {
  it.each([
    ['http://localhost:10000', 'localhost_10000'],
    ['https://my.host.com', 'my_host_com'],
    ['https://my.host.com:8443', 'my_host_com_8443'],
    ['http://localhost:10000/jsapi/dh-core.js', 'localhost_10000'],
  ])('converts %s to %s', (url, expected) => {
    expect(urlToDirectoryName(url)).toEqual(expected);
    expect(urlToDirectoryName(new URL(url))).toEqual(expected);
  });
});
