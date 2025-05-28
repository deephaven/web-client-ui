import { nanoid } from 'nanoid';
import Log from '@deephaven/log';
import TimeoutError from './TimeoutError';
import { assertNotNull } from './Asserts';

const log = Log.module('MessageUtils');

export interface PostMessage<T = unknown> {
  id: string;
  message: string;
  payload?: T;
}

export interface PostMessageResponse<T = unknown> {
  id: string;
  payload: T;
}

/**
 * Make response object for given message id
 * @param messageId Id of the request message to respond to
 * @param payload Payload to respond with
 * @returns Response
 */
export function makeResponse<T>(
  messageId: string,
  payload: T
): PostMessageResponse<T> {
  return { id: messageId, payload };
}

/**
 * Get the parent window of the current window.
 */
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
 * Check if the given object is a valid PostMessage object.
 * @param obj Object to check
 * @returns True if the object is a valid PostMessage, false otherwise
 */
export function isMessage(obj: unknown): obj is PostMessage {
  const message = obj as PostMessage;
  return (
    message != null &&
    typeof message.id === 'string' &&
    typeof message.message === 'string'
  );
}

/**
 * Check if the given object is a valid PostMessageResponse object.
 * @param obj Object to check
 * @returns True if the object is a valid PostMessageResponse, false otherwise
 */
export function isResponse(obj: unknown): obj is PostMessageResponse {
  const response = obj as PostMessageResponse;
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
  id = nanoid(),
  payload?: T
): PostMessage<T> {
  return { message, id, payload };
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
    const id = nanoid();
    const listener = (event: MessageEvent): void => {
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

/**
 * Send a message to the parent window.
 * @param message The message string to send.
 * @param id Optional unique message id. If not provided, a random id will be
 * generated.
 * @param payload Optional payload to send with the message.
 */
export function sendMessageToParent<TPayload>(
  message: string,
  id?: string,
  payload?: TPayload
): void {
  const parent = getWindowParent();
  assertNotNull(parent, 'Parent window is null');
  parent.postMessage(makeMessage(message, id, payload), '*');
}
