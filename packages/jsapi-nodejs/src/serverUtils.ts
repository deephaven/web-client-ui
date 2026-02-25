import * as http from 'node:http';
import * as https from 'node:https';
import { hasErrorCode, HttpError, isAggregateError } from './errorUtils.js';

export const SERVER_STATUS_CHECK_TIMEOUT = 3000;

/**
 * Require a JS module from a URL. Loads the module in memory and returns its exports
 * Copy / modified from https://github.com/deephaven/deephaven.io/blob/main/tools/run-examples/includeAPI.mjs
 *
 * @param url The URL with protocol to require from. Supports http or https
 * @param retries The number of retries on failure
 * @param retryDelay The delay between retries in milliseconds
 * @param logger An optional logger object. Defaults to `console`
 * @returns Promise which resolves to the module's exports
 */
export async function downloadFromURL(
  url: URL,
  retries = 10,
  retryDelay = 1000,
  logger: { error: (...args: unknown[]) => void } = console
): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    let transporter: typeof http | typeof https;
    if (urlObj.protocol === 'http:') {
      transporter = http;
    } else if (urlObj.protocol === 'https:') {
      transporter = https;
    } else {
      reject(
        new Error(
          `Only http: and https: protocols are supported. Received ${urlObj.protocol}`
        )
      );
      return;
    }

    transporter
      .get(url, { timeout: 5000 }, res => {
        let file = '';
        res.on('data', d => {
          file += d;
        });

        res.on('end', async () => {
          if (res.statusCode === 404) {
            reject(new HttpError(404, `File not found: "${url}"`));
            return;
          }

          resolve(file);
        });
      })
      .on('timeout', () => {
        logger.error('Failed download of url:', url);
        reject();
      })
      .on('error', e => {
        if (retries > 0) {
          logger.error('Retrying url:', url);
          setTimeout(
            () =>
              downloadFromURL(url, retries - 1, retryDelay, logger).then(
                resolve,
                reject
              ),
            retryDelay
          );
        } else {
          logger.error(
            `Hit retry limit. Stopping attempted include from ${url} with error`
          );
          logger.error(e);
          reject(e);
        }
      });
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
