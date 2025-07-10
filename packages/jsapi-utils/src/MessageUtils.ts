import { isMessage, type PostMessage } from '@deephaven/utils';

export {
  /** @deprecated Use `@deephaven/utils` `getWindowParent` instead. */
  getWindowParent,
  /** @deprecated Use `@deephaven/utils` `isMessage` instead. */
  isMessage,
  /** @deprecated Use `@deephaven/utils` `isResponse` instead. */
  isResponse,
  /** @deprecated Use `@deephaven/utils` `makeMessage` instead. */
  makeMessage,
  /** @deprecated Use `@deephaven/utils` `makeResponse` instead. */
  makeResponse,
  /** @deprecated Use `@deephaven/utils` `requestParentResponse` instead. */
  requestParentResponse,
  /** @deprecated Use `@deephaven/utils` `PostMessage<T>` instead. */
  type PostMessage as Message,
} from '@deephaven/utils';

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

export interface BroadcastLoginMessage extends PostMessage<void> {
  message: typeof BROADCAST_LOGIN_MESSAGE;
}

export interface BroadcastLogoutMessage extends PostMessage<void> {
  message: typeof BROADCAST_LOGOUT_MESSAGE;
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
