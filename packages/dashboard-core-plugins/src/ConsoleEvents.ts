import { makeEventFunctions } from '@deephaven/golden-layout';
import { type dh } from '@deephaven/jsapi-types';
import { ConsoleEvent } from './events';

/**
 * Represents a Core (Community) console session. Mirrors the
 * `CommonConsoleSession` interface used in Enterprise (without the
 * Enterprise-only `QueryInfo` field).
 */
export interface CoreConsoleSession {
  language: string;
  session: dh.IdeSession;
  sessionId: string;
  /** Function closing the console session and client connection */
  close: () => void;
}

const sessionOpenedFns = makeEventFunctions<[session: CoreConsoleSession]>(
  ConsoleEvent.SESSION_OPENED
);

/**
 * Listen for session opened events
 * @param eventEmitter The event emitter to listen on
 * @param session The session that was opened
 */
export const listenForSessionOpened = sessionOpenedFns.listen;

/**
 * Emit a session opened event
 * @param eventEmitter The event emitter to emit the event on
 * @param session The session that was opened
 */
export const emitSessionOpened = sessionOpenedFns.emit;

/**
 * Use a session opened event listener
 * @param eventEmitter The event emitter to listen on
 * @param session The session that was opened
 */
export const useSessionOpenedListener = sessionOpenedFns.useListener;

const sessionClosedFns = makeEventFunctions<[session: dh.IdeSession]>(
  ConsoleEvent.SESSION_CLOSED
);

/**
 * Listen for session closed events
 * @param eventEmitter The event emitter to listen on
 * @param session The session that was closed
 */
export const listenForSessionClosed = sessionClosedFns.listen;

/**
 * Emit a session closed event
 * @param eventEmitter The event emitter to emit the event on
 * @param session The session that was closed
 */
export const emitSessionClosed = sessionClosedFns.emit;

/**
 * Use a session closed event listener
 * @param eventEmitter The event emitter to listen on
 * @param session The session that was closed
 */
export const useSessionClosedListener = sessionClosedFns.useListener;
