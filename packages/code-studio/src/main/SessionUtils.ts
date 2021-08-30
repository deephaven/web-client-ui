import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import shortid from 'shortid';

const log = Log.module('SessionUtils');

export type VariableDefinition = {
  id: string;
  type: string;
  title?: string;
  description?: string;
};

export type DhSession = {
  getObject: (definition: VariableDefinition) => Promise<unknown>;
};

export type ListenerRemover = () => void;

export type DhIdeConnection = {
  addEventListener: (
    name: string,
    callback: (event: CustomEvent) => undefined
  ) => ListenerRemover;
};

export type SessionConfig = {
  id: string;
  type: string;
};

export type SessionWrapper = {
  session: DhSession;
  config: SessionConfig;
  connection: DhIdeConnection;
};

/**
 * Create a new session using the default URL
 * @returns {Promise<SessionWrapper>} A session and config that is ready to use
 */
export const createSessionWrapper = async (): Promise<SessionWrapper> => {
  const baseUrl = new URL(
    process.env.REACT_APP_CORE_API_URL ?? '',
    `${window.location}`
  );

  const websocketUrl = `${baseUrl.protocol}//${baseUrl.host}`;

  log.info(`Starting connection to '${websocketUrl}'...`);

  const connection = new dh.IdeConnection(websocketUrl);

  log.info('Getting console types...');

  const types = await connection.getConsoleTypes();

  log.info('Available types:', types);

  if (types.length === 0) {
    throw new Error('No console types available');
  }

  const type = types[0];

  log.info('Starting session with type', type);

  const session = await connection.startSession(type);

  const config = { type, id: shortid.generate() };

  log.info('Console session established', config);

  return { session, config, connection };
};

export default { createSessionWrapper };
