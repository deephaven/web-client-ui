import dh, {
  ConnectOptions,
  CoreClient,
  IdeConnection,
  IdeSession,
} from '@deephaven/jsapi-shim';
import {
  requestParentResponse,
  SESSION_DETAILS_REQUEST,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import shortid from 'shortid';
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
  session: IdeSession;
  connection: IdeConnection;
  config: SessionConfig;
  details?: SessionDetails;
}

/**
 * Get the base URL of the API
 * @param coreApiUrl Configured Core API URL
 * @returns URL for the base of the API
 */
export function getBaseUrl(coreApiUrl: string): URL {
  return new URL(coreApiUrl, `${window.location}`);
}

/**
 * Get the websocket URL for the API
 * @param baseURL URL for the base of the API
 * @returns Websocket URL for the API
 */
export function getWebsocketUrl(baseURL: URL): string {
  return `${baseURL.protocol}//${baseURL.host}`;
}

/**
 * Get the Envoy prefix header value
 * @returns Envoy prefix header value
 */
export function getEnvoyPrefix(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('envoyPrefix');
}

export function getClientOptions(): ConnectOptions {
  const envoyPrefix = getEnvoyPrefix();
  return envoyPrefix != null
    ? { headers: { 'envoy-prefix': envoyPrefix } }
    : {};
}

/**
 * @returns New connection to the server
 */
export function createConnection(websocketUrl: string): IdeConnection {
  log.info(`Starting connection to '${websocketUrl}'...`);

  return new dh.IdeConnection(websocketUrl);
}

/**
 * Create a new session using the default URL
 * @returns A session and config that is ready to use
 */
export async function createSessionWrapper(
  connection: IdeConnection,
  details: SessionDetails
): Promise<SessionWrapper> {
  log.info('Getting console types...');

  const types = await connection.getConsoleTypes();

  log.info('Available types:', types);

  if (types.length === 0) {
    throw new NoConsolesError('No console types available');
  }

  const type = types[0];

  log.info('Starting session with type', type);

  const session = await connection.startSession(type);

  const config = { type, id: shortid.generate() };

  log.info('Console session established', config);

  return {
    session,
    config,
    connection,
    details,
  };
}

export function createCoreClient(
  websocketUrl: string,
  options?: ConnectOptions
): CoreClient {
  log.info('createCoreClient', websocketUrl);

  return new dh.CoreClient(websocketUrl, options);
}

async function requestParentSessionDetails(): Promise<SessionDetails> {
  return requestParentResponse<SessionDetails>(SESSION_DETAILS_REQUEST);
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
  connection: IdeConnection,
  sessionDetails: SessionDetails
): Promise<SessionWrapper | undefined> {
  let sessionWrapper: SessionWrapper | undefined;
  try {
    sessionWrapper = await createSessionWrapper(connection, sessionDetails);
  } catch (e) {
    // Consoles may be disabled on the server, but we should still be able to start up and open existing objects
    if (!isNoConsolesError(e)) {
      throw e;
    }
  }
  return sessionWrapper;
}
