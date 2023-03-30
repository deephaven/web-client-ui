import Log from '@deephaven/log';

const log = Log.module('MessageUtils');

export const LOGIN_OPTIONS_REQUEST = 'requestLoginOptionsFromParent';
export const LOGIN_OPTIONS_RESPONSE = 'loginOptions';

export const SESSION_DETAILS_REQUEST = 'requestSessionDetailsFromParent';
export const SESSION_DETAILS_RESPONSE = 'sessionDetails';

export interface Message<T> {
  message: string;
  payload?: T;
}

export function makeMessage<T>(message: string, payload?: T): Message<T> {
  return { message, payload };
}

/**
 * Request data from the parent window and wait for response
 * @param request Request message to send to the parent window
 * @param response Response message to wait for
 * @returns Payload of the given type, or undefined
 */
export async function requestParentResponse<T>(
  request: string,
  response: string
): Promise<T | undefined> {
  if (window.opener == null) {
    throw new Error('window.opener is null, unable to send request.');
  }
  return new Promise(resolve => {
    const listener = (event: MessageEvent<Message<T>>) => {
      const { data } = event;
      log.debug('Received message', data);
      if (data?.message !== response) {
        log.debug('Ignore received message', data);
        return;
      }
      window.removeEventListener('message', listener);
      resolve(data.payload);
    };
    window.addEventListener('message', listener);
    window.opener.postMessage(request, '*');
  });
}
