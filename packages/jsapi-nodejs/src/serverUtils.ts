import * as http from 'node:http';
import { STATUS_CODES } from 'node:http';
import * as https from 'node:https';
import {
  DownloadTimeoutError,
  hasErrorCode,
  HttpError,
  isAggregateError,
  UntrustedUrlError,
} from './errorUtils.js';

export const SERVER_STATUS_CHECK_TIMEOUT = 3000;

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export type DownloadLogger = { error: (...args: unknown[]) => void };

export type DownloadOptions = {
  /**
   * Called for the initial URL and every redirect target before it is
   * requested. Returning `false` rejects with `UntrustedUrlError`. Defaults to
   * trusting every URL.
   */
  isTrustedUrl?: (url: URL) => boolean;
  /** Maximum number of redirects to follow. Defaults to 20. */
  maxRedirects?: number;
  /** Number of retries on network errors. Defaults to 10. */
  retries?: number;
  /** Delay between retries in milliseconds. Defaults to 1000. */
  retryDelayMs?: number;
  /**
   * Socket idle timeout in milliseconds for each request (redirects and retries
   * are each considered distinct requests). The timeout resets whenever data
   * arrives. For an overall deadline, pass `signal: AbortSignal.timeout(ms)`.
   * Defaults to 5000.
   */
  timeoutMs?: number;
  /** Aborts the in-flight request and any pending retry. */
  signal?: AbortSignal;
  /** Defaults to `console`. */
  logger?: DownloadLogger;
};

/**
 * Download the text content of a URL using `node:http` / `node:https`. These
 * are used instead of `fetch` so that proxy and certificate handling patched
 * into the Node agents (e.g. by VS Code) still applies.
 *
 * Rejects with `HttpError` for any non-200 response that isn't a followed
 * redirect, `UntrustedUrlError` if `isTrustedUrl` rejects a URL,
 * `DownloadTimeoutError` if the socket times out, and `signal.reason` if
 * aborted. Only network errors are retried.
 *
 * @param url The URL with protocol to download from. Supports http or https
 * @param options Download options
 * @returns Promise which resolves to the downloaded content
 */
export async function downloadFromURL(
  url: URL,
  options?: DownloadOptions
): Promise<string>;
/**
 * @deprecated Pass a `DownloadOptions` object instead of positional args.
 * @param url The URL with protocol to download from. Supports http or https
 * @param retries The number of retries on failure
 * @param retryDelay The delay between retries in milliseconds
 * @param logger An optional logger object. Defaults to `console`
 */
export async function downloadFromURL(
  url: URL,
  retries?: number,
  retryDelay?: number,
  logger?: DownloadLogger
): Promise<string>;
export async function downloadFromURL(
  url: URL,
  optionsOrRetries?: DownloadOptions | number,
  retryDelay?: number,
  logger?: DownloadLogger
): Promise<string> {
  const options: DownloadOptions =
    typeof optionsOrRetries === 'number' ||
    retryDelay !== undefined ||
    logger !== undefined
      ? {
          retries: optionsOrRetries as number | undefined,
          retryDelayMs: retryDelay,
          logger,
        }
      : optionsOrRetries ?? {};

  return downloadWithOptions(new URL(url), options);
}

function downloadWithOptions(
  url: URL,
  {
    isTrustedUrl = () => true,
    maxRedirects = 20,
    retries = 10,
    retryDelayMs = 1000,
    timeoutMs = 5000,
    signal,
    logger = console,
  }: DownloadOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(signal.reason);
      return;
    }

    // Timeouts, aborts and `req.destroy()` can each emit further events after
    // the Promise has settled. Only the first outcome counts, and nothing is
    // retried after it.
    let settled = false;
    let activeRequest: http.ClientRequest | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    function onAbort(): void {
      fail(signal?.reason);
      activeRequest?.destroy();
    }

    function settle(callback: () => void): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(retryTimer);
      signal?.removeEventListener('abort', onAbort);
      callback();
    }

    function fail(reason: unknown): void {
      settle(() => reject(reason));
    }

    // Rejects the download if `startRequest` throws, e.g. if the caller's
    // `isTrustedUrl` throws instead of returning a boolean. Redirects and
    // retries run in a response callback or timer, where a throw would
    // otherwise go uncaught.
    function attempt(
      currentUrl: URL,
      retriesLeft: number,
      redirectCount: number
    ): void {
      try {
        startRequest(currentUrl, retriesLeft, redirectCount);
      } catch (e) {
        fail(e);
      }
    }

    function startRequest(
      currentUrl: URL,
      retriesLeft: number,
      redirectCount: number
    ): void {
      let transporter: typeof http | typeof https;
      if (currentUrl.protocol === 'http:') {
        transporter = http;
      } else if (currentUrl.protocol === 'https:') {
        transporter = https;
      } else {
        fail(
          new Error(
            `Only http: and https: protocols are supported. Received ${currentUrl.protocol}`
          )
        );
        return;
      }

      if (!isTrustedUrl(currentUrl)) {
        fail(new UntrustedUrlError(currentUrl));
        return;
      }

      const req = transporter.get(currentUrl, { timeout: timeoutMs }, res => {
        const statusCode = res.statusCode ?? 0;

        if (statusCode === 200) {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          res.on('end', () => {
            settle(() => resolve(Buffer.concat(chunks).toString('utf8')));
          });
          res.on('error', fail);
          return;
        }

        // Discard the body so the socket can be reused. If the body stalls, the
        // request's timeout handler closes it.
        res.resume();

        const { location } = res.headers;
        if (!REDIRECT_STATUS_CODES.has(statusCode) || location == null) {
          fail(
            new HttpError(
              statusCode,
              statusCode === 404
                ? `File not found: "${currentUrl}"`
                : `HTTP ${statusCode} ${
                    STATUS_CODES[statusCode] ?? ''
                  }: "${currentUrl}"`
            )
          );
          return;
        }

        if (redirectCount >= maxRedirects) {
          fail(
            new HttpError(
              statusCode,
              `Too many redirects (max ${maxRedirects}): "${currentUrl}"`
            )
          );
          return;
        }

        // A throw here would escape the response callback as an uncaught
        // exception instead of rejecting the download.
        let nextUrl: URL;
        try {
          nextUrl = new URL(location, currentUrl);
        } catch {
          fail(
            new HttpError(
              statusCode,
              `Invalid redirect location "${location}" from "${currentUrl}"`
            )
          );
          return;
        }

        if (!settled) {
          attempt(nextUrl, retriesLeft, redirectCount + 1);
        }
      });

      activeRequest = req;

      req
        .on('timeout', () => {
          // Only the current request can fail the download. A request that
          // was superseded by a redirect, or whose download already settled,
          // is just closed.
          if (!settled && req === activeRequest) {
            logger.error('Failed download of url:', currentUrl);
            fail(new DownloadTimeoutError(currentUrl, timeoutMs));
          }
          req.destroy();
        })
        .on('error', e => {
          // Destroying a request that has no response yet, on abort or timeout,
          // emits 'error' after the download has settled. That must not start
          // a retry. Once a response arrives, socket errors go to the response,
          // so a request superseded by a redirect never reaches this handler.
          if (settled) {
            return;
          }

          if (retriesLeft > 0) {
            logger.error('Retrying url:', url);
            retryTimer = setTimeout(
              () => attempt(url, retriesLeft - 1, 0),
              retryDelayMs
            );
            return;
          }

          logger.error(
            `Hit retry limit. Stopping attempted include from ${currentUrl} with error`
          );
          logger.error(e);
          fail(e);
        });
    }

    signal?.addEventListener('abort', onAbort, { once: true });
    attempt(url, retries, 0);
  });
}

/**
 * Check if a given url returns an expected status code.
 * @param url The URL to check
 * @param statusCodes The expected status codes
 * @param logger An optional logger object. Defaults to `console`
 * @returns Promise which resolves to true if the status code matches, false otherwise
 */
export async function hasStatusCode(
  url: URL,
  statusCodes: number[],
  logger: {
    debug: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  } = console
): Promise<boolean> {
  return new Promise(resolve => {
    const transporter = url.protocol === 'http:' ? http : https;

    const request = transporter
      .request(
        url,
        // Using OPTIONS method to avoid downloading the entire file. Could also
        // use HEAD, but the response seems slightly smaller for OPTIONS.
        { method: 'OPTIONS', timeout: SERVER_STATUS_CHECK_TIMEOUT },
        res => {
          const includesStatusCode = statusCodes.includes(
            res.statusCode as number
          );

          if (!includesStatusCode) {
            logger.debug(
              `Received status code ${
                res.statusCode
              } from ${url}, expected one of ${statusCodes.join(', ')}`
            );
          }

          removeListenersAndResolve(includesStatusCode);
        }
      )
      .on('timeout', () => {
        removeListenersAndResolve(false);
      })
      .on('error', err => {
        // Expected errors for non-existing / stopped servers.
        const isServerStoppedError = isAggregateError(err, 'ECONNREFUSED');
        const isServerNotFoundError = hasErrorCode(err, 'ENOTFOUND');

        if (!isServerStoppedError && !isServerNotFoundError) {
          logger.error('Error when checking:', url.toString(), err);
        }

        removeListenersAndResolve(false);
      })
      .end();

    /**
     * Any time we resolve the Promise, remove listeners to avoid handling
     * additional events and destroy the request stream to avoid any additional
     * processing.
     */
    function removeListenersAndResolve(value: boolean): void {
      request.removeAllListeners();
      request.destroy();

      resolve(value);
    }
  });
}

/**
 * Converts url to `${hostname}_${port}` replacing `.` with `_`
 * @param url The URL to convert
 */
export function urlToDirectoryName(url: string | URL): string {
  if (typeof url === 'string') {
    // eslint-disable-next-line no-param-reassign
    url = new URL(url);
  }

  return url.host.replace(/[:.]/g, '_');
}
