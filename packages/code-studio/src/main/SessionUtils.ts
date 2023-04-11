import {
  SessionDetails,
  SessionWrapper,
} from '@deephaven/dashboard-core-plugins';
import dh, { CoreClient, IdeConnection } from '@deephaven/jsapi-shim';
import {
  requestParentResponse,
  SESSION_DETAILS_REQUEST,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import shortid from 'shortid';
import NoConsolesError from './NoConsolesError';

const log = Log.module('SessionUtils');

export function getBaseUrl(): URL {
  return new URL(import.meta.env.VITE_CORE_API_URL ?? '', `${window.location}`);
}

export function getWebsocketUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl.protocol}//${baseUrl.host}`;
}

export function getAuthType(): AUTH_TYPE {
  const searchParams = new URLSearchParams(window.location.search);
  switch (searchParams.get('authProvider')) {
    case 'parent':
      return AUTH_TYPE.PARENT;
    default:
      return AUTH_TYPE.PLUGIN;
  }
}

/**
 * @returns New connection to the server
 */
export function createConnection(): IdeConnection {
  const websocketUrl = getWebsocketUrl();

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

export function createCoreClient(): CoreClient {
  const websocketUrl = getWebsocketUrl();

  log.info('createCoreClient', websocketUrl);

  return new dh.CoreClient(websocketUrl);
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

export default { createSessionWrapper };
