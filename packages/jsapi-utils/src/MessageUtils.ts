import shortid from 'shortid';
import Log from '@deephaven/log';
import { TimeoutError } from '@deephaven/utils';

const log = Log.module('MessageUtils');

export const LOGIN_OPTIONS_REQUEST =
  'io.deephaven.message.LoginOptions.request';

export const SESSION_DETAILS_REQUEST =
  'io.deephaven.message.SessionDetails.request';

/**
 * Use a BroadcastChannel for sending messages between tabs, such as when the user logs out.
 */
export const BROADCAST_CHANNEL_NAME = 'io.deephaven.broadcast';

/**
 * Event emitted when the user has logged in successfully
 */
export const BROADCAST_LOGIN_MESSAGE = 'io.deephaven.broadcast.Login';

/**
 * Event emitted when the user has logged out
 */
export const BROADCAST_LOGOUT_MESSAGE = 'io.deephaven.broadcast.Logout';

export interface Message<T = unknown> {
  id: string;
  message: string;
  payload?: T;
}

export interface BroadcastLoginMessage extends Message<void> {
  message: typeof BROADCAST_LOGIN_MESSAGE;
}

export interface BroadcastLogoutMessage extends Message<void> {
  message: typeof BROADCAST_LOGOUT_MESSAGE;
}

export interface Response<T = unknown> {
  id: string;
  payload: T;
}

export function isMessage(obj: unknown): obj is Message {
  const message = obj as Message;
  return (
    message != null &&
    typeof message.id === 'string' &&
    typeof message.message === 'string'
  );
}

export function isBroadcastLoginMessage(
  obj: unknown
): obj is BroadcastLoginMessage {
  return isMessage(obj) && obj.message === BROADCAST_LOGIN_MESSAGE;
}

export function isBroadcastLogoutMessage(
  obj: unknown
): obj is BroadcastLogoutMessage {
  return isMessage(obj) && obj.message === BROADCAST_LOGOUT_MESSAGE;
}

export function isResponse(obj: unknown): obj is Response {
  const response = obj as Response;
  return response != null && typeof response.id === 'string';
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

export function getWindowParent(): Window | null {
  if (window.opener != null) {
    return window.opener;
  }
  if (window.parent != null && window.parent !== window) {
    return window.parent;
  }
  return null;
}

/**
 * Request data from the parent window and wait for response
 * @param request Request message to send to the parent window
 * @param timeout Timeout in ms
 * @returns Payload of the given type, or undefined
 */
export async function requestParentResponse(
  request: string,
  timeout = 30000
): Promise<unknown> {
  const parent = getWindowParent();
  if (parent == null) {
    throw new Error('window parent is null, unable to send request.');
  }
  return new Promise((resolve, reject) => {
    let timeoutId: number;
    const id = shortid();
    const listener = (event: MessageEvent) => {
      const { data } = event;
      if (!isResponse(data)) {
        log.debug('Ignoring non-deephaven response', data);
        return;
      }
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
    parent.postMessage(makeMessage(request, id), '*');
  });
}
