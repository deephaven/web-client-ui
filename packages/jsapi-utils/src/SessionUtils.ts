import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { nanoid } from 'nanoid';
import { requestParentResponse, SESSION_DETAILS_REQUEST } from './MessageUtils';
import NoConsolesError, { isNoConsolesError } from './NoConsolesError';

const log = Log.module('SessionUtils');

export interface SessionConfig {
  type: string;
  id: string;
}

export interface SessionDetails {
  workerName?: string;
  processInfoId?: string;
}

export interface SessionWrapper {
  session: DhType.IdeSession;
  connection: DhType.IdeConnection;
  config: SessionConfig;
  details?: SessionDetails;
  dh: typeof DhType;
}

/**
 * @returns New connection to the server
 */
export function createConnection(
  dh: typeof DhType,
  websocketUrl: string
): DhType.IdeConnection {
  log.info(`Starting connection to '${websocketUrl}'...`);

  return new dh.IdeConnection(websocketUrl);
}

/**
 * Create a new session using the default URL
 * @returns A session and config that is ready to use
 */
export async function createSessionWrapper(
  dh: typeof DhType,
  connection: DhType.IdeConnection,
  details: SessionDetails
): Promise<SessionWrapper> {
  log.info('Getting console types...');

  const types = await connection.getConsoleTypes();

  if (types.length === 0) {
    throw new NoConsolesError('No console types available');
  }

  log.info('Available types:', types);

  const type = types[0];

  log.info('Starting session with type', type);

  const session = await connection.startSession(type);

  const config = { type, id: nanoid() };

  log.info('Console session established', config);

  return {
    session,
    config,
    connection,
    details,
    dh,
  };
}

export function createCoreClient(
  dh: typeof DhType,
  websocketUrl: string,
  options?: DhType.ConnectOptions
): DhType.CoreClient {
  log.info('createCoreClient', websocketUrl);

  return new dh.CoreClient(websocketUrl, options);
}

function isSessionDetails(obj: unknown): obj is SessionDetails {
  return obj != null && typeof obj === 'object';
}

async function requestParentSessionDetails(): Promise<SessionDetails> {
  const response = await requestParentResponse(SESSION_DETAILS_REQUEST);
  if (!isSessionDetails(response)) {
    throw new Error(`Unexpected session details response: ${response}`);
  }
  return response;
}

export async function getSessionDetails(): Promise<SessionDetails> {
  const searchParams = new URLSearchParams(window.location.search);
  switch (searchParams.get('authProvider')) {
    case 'parent':
      return requestParentSessionDetails();
  }
  return {};
}

export async function loadSessionWrapper(
  dh: typeof DhType,
  connection: DhType.IdeConnection,
  sessionDetails: SessionDetails
): Promise<SessionWrapper | undefined> {
  let sessionWrapper: SessionWrapper | undefined;
  try {
    sessionWrapper = await createSessionWrapper(dh, connection, sessionDetails);
  } catch (e) {
    // Consoles may be disabled on the server, but we should still be able to start up and open existing objects
    if (!isNoConsolesError(e)) {
      throw e;
    }
  }
  return sessionWrapper;
}
