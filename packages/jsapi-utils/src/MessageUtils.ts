import { isMessage, type PostMessage } from '@deephaven/utils';

export const LOGIN_OPTIONS_REQUEST =
  'io.deephaven.message.LoginOptions.request';

export const SESSION_DETAILS_REQUEST =
  'io.deephaven.message.SessionDetails.request';

export const PARENT_THEME_REQUEST = 'io.deephaven.message.ParentTheme.request';

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
