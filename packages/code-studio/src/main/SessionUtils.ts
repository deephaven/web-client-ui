import { SessionWrapper } from '@deephaven/dashboard-core-plugins';
import dh, { IdeConnection } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import shortid from 'shortid';
import NoConsolesError from './NoConsolesError';

const log = Log.module('SessionUtils');

/**
 * @returns New connection to the server
 */
export function createConnection(): IdeConnection {
  const baseUrl = new URL(
    process.env.REACT_APP_CORE_API_URL ?? '',
    `${window.location}`
  );

  const websocketUrl = `${baseUrl.protocol}//${baseUrl.host}`;

  log.info(`Starting connection to '${websocketUrl}'...`);

  return new dh.IdeConnection(websocketUrl);
}

/**
 * Create a new session using the default URL
 * @returns A session and config that is ready to use
 */
export async function createSessionWrapper(connection: IdeConnection): Promise<SessionWrapper> {
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
};

export default { createSessionWrapper };
