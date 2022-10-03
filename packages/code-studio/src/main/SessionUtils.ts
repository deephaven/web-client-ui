import { SessionWrapper } from '@deephaven/dashboard-core-plugins';
import dh, { CoreClient, IdeConnection } from '@deephaven/jsapi-shim';
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
  connection: IdeConnection
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

  return { session, config, connection };
}

export function createCoreClient(): CoreClient {
  const websocketUrl = getWebsocketUrl();

  log.info('createCoreClient', websocketUrl);

  return new dh.CoreClient(websocketUrl);
}

export default { createSessionWrapper };
