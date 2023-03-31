import Log from '@deephaven/log';
import { TimeoutError } from '@deephaven/utils';

const log = Log.module('MessageUtils');

export const LOGIN_OPTIONS_REQUEST = 'io.deephaven.loginOptions.request';
export const LOGIN_OPTIONS_RESPONSE = 'io.deephaven.loginOptions.response';

export const SESSION_DETAILS_REQUEST = 'io.deephaven.sessionDetails.request';
export const SESSION_DETAILS_RESPONSE = 'io.deephaven.sessionDetails.response';

export interface Message<T> {
  message: string;
  payload?: T;
  id?: string;
}

export function makeMessage<T>(message: string, payload?: T): Message<T> {
  return { message, payload };
}

/**
 * Request data from the parent window and wait for response
 * @param request Request message to send to the parent window
 * @param response Response message to wait for
 * @param timeout Timeout in ms
 * @returns Payload of the given type, or undefined
 */
export async function requestParentResponse<T>(
  request: string,
  response: string,
  timeout = 30000
): Promise<T | undefined> {
  if (window.opener == null) {
    throw new Error('window.opener is null, unable to send request.');
  }
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    const listener = (event: MessageEvent<Message<T>>) => {
      const { data } = event;
      log.debug('Received message', data);
      if (data?.message !== response) {
        log.debug('Ignore received message', data);
        return;
      }
      clearTimeout(timeoutId);
      window.removeEventListener('message', listener);
      resolve(data.payload);
    };
    window.addEventListener('message', listener);
    timeoutId = setTimeout(() => {
      window.removeEventListener('message', listener);
      reject(new TimeoutError('Request timed out'));
    }, timeout);
    window.opener.postMessage(makeMessage(request), '*');
  });
}
