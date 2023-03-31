import shortid from 'shortid';
import Log from '@deephaven/log';
import { TimeoutError } from '@deephaven/utils';

const log = Log.module('MessageUtils');

export const LOGIN_OPTIONS_REQUEST = 'requestLoginOptionsFromParent';
export const LOGIN_OPTIONS_RESPONSE = 'loginOptions';

export const SESSION_DETAILS_REQUEST = 'requestSessionDetailsFromParent';
export const SESSION_DETAILS_RESPONSE = 'sessionDetails';

export interface Message<T> {
  message: string;
  payload?: T;
  id?: string;
}

export function makeMessage<T>(
  message: string,
  id?: string,
  payload?: T
): Message<T> {
  return { id, message, payload };
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
    const id = shortid();
    const listener = (event: MessageEvent<Message<T>>) => {
      const { data } = event;
      log.debug('Received message', data);
      // TODO: checking just the id should be enough, can probably drop the response message check?
      if (data?.id !== id || data?.message !== response) {
        log.debug('Ignore received message', data);
        return;
      }
      clearTimeout(timeoutId);
      window.removeEventListener('message', listener);
      resolve(data.payload);
    };
    window.addEventListener('message', listener);
    window.opener.postMessage(makeMessage(request, id), '*');
    timeoutId = setTimeout(() => {
      window.removeEventListener('message', listener);
      reject(new TimeoutError('Request timed out'));
    }, timeout);
  });
}
