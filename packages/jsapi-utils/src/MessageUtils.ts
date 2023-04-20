import shortid from 'shortid';
import Log from '@deephaven/log';
import { TimeoutError } from '@deephaven/utils';

const log = Log.module('MessageUtils');

export const LOGIN_OPTIONS_REQUEST =
  'io.deephaven.message.LoginOptions.request';

export const SESSION_DETAILS_REQUEST =
  'io.deephaven.message.SessionDetails.request';

export interface Message<T> {
  message: string;
  payload?: T;
  id: string;
}

export interface Response<T> {
  id: string;
  payload: T;
}

/**
 * Make message object with optional payload
 * @param message Message string
 * @param id Unique message id
 * @param payload Payload to send
 * @returns Message
 */
export function makeMessage<T>(
  message: string,
  id = shortid(),
  payload?: T
): Message<T> {
  return { message, id, payload };
}

/**
 * Make response object for given message id
 * @param messageId Id of the request message to respond to
 * @param payload Payload to respond with
 * @returns Response
 */
export function makeResponse<T>(messageId: string, payload: T): Response<T> {
  return { id: messageId, payload };
}

/**
 * Request data from the parent window and wait for response
 * @param request Request message to send to the parent window
 * @param timeout Timeout in ms
 * @returns Payload of the given type, or undefined
 */
export async function requestParentResponse<T>(
  request: string,
  timeout = 30000
): Promise<T> {
  if (window.opener == null) {
    throw new Error('window.opener is null, unable to send request.');
  }
  return new Promise((resolve, reject) => {
    let timeoutId: number;
    const id = shortid();
    const listener = (event: MessageEvent<Response<T>>) => {
      const { data } = event;
      log.debug('Received message', data);
      if (data?.id !== id) {
        log.debug("Ignore message, id doesn't match", data);
        return;
      }
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', listener);
      resolve(data.payload);
    };
    window.addEventListener('message', listener);
    timeoutId = window.setTimeout(() => {
      window.removeEventListener('message', listener);
      reject(new TimeoutError('Request timed out'));
    }, timeout);
    window.opener.postMessage(makeMessage(request, id), '*');
  });
}
