import React from 'react';
import { render } from '@testing-library/react';
import { CommandHistoryStorage } from '@deephaven/console';
import type { Container } from '@deephaven/golden-layout';
import { IdeConnection, IdeSession } from '@deephaven/jsapi-types';
import { ConsolePanel } from './ConsolePanel';
import { SessionConfig, SessionWrapper } from '../redux';

const mockConsole = jest.fn(() => null);
jest.mock('@deephaven/console', () => ({
  ...(jest.requireActual('@deephaven/console') as Record<string, unknown>),
  Console: props => mockConsole(props),
  default: props => mockConsole(props),
}));

function makeSession(): IdeSession {
  return ({
    addEventListener: jest.fn(),
    subscribeToFieldUpdates: jest.fn(() => () => null),
    removeEventListener: jest.fn(),
    getTable: jest.fn(),
    getObject: jest.fn(),
    runCode: jest.fn(),
  } as unknown) as IdeSession;
}

function makeConnection({
  addEventListener = jest.fn(),
  removeEventListener = jest.fn(),
}: {
  addEventListener?: (eventName: string, callback: () => void) => void;
  removeEventListener?: (eventName: string, callback: () => void) => void;
} = {}): IdeConnection {
  return ({
    addEventListener,
    removeEventListener,
  } as unknown) as IdeConnection;
}

function makeSessionConfig(): SessionConfig {
  return { type: 'test_type', id: 'test_id' };
}

function makeSessionWrapper({
  config = makeSessionConfig(),
  connection = makeConnection(),
  session = makeSession(),
} = {}): SessionWrapper {
  return { session, connection, config };
}

function makeEventHub() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
    unbind: jest.fn(),
  };
}

function makeGlContainer(): Container {
  return ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  } as unknown) as Container;
}

function makeCommandHistoryStorage(): CommandHistoryStorage {
  return {} as CommandHistoryStorage;
}

function renderConsolePanel({
  eventHub = makeEventHub(),
  container = makeGlContainer(),
  commandHistoryStorage = makeCommandHistoryStorage(),
  timeZone = 'MockTimeZone',
  sessionWrapper = makeSessionWrapper(),
} = {}) {
  return render(
    <ConsolePanel
      glEventHub={eventHub}
      glContainer={container}
      commandHistoryStorage={commandHistoryStorage}
      timeZone={timeZone}
      sessionWrapper={sessionWrapper}
    />
  );
}

beforeEach(() => {
  mockConsole.mockClear();
});

it('renders without crashing', () => {
  const { unmount } = renderConsolePanel();
  unmount();
});

it('handles disconnect correctly', () => {
  let disconnectListener: () => void = jest.fn();
  let reconnectListener: () => void = jest.fn();
  const connection = makeConnection({
    addEventListener: (event, callback) => {
      switch (event) {
        case dh.IdeConnection.EVENT_DISCONNECT:
          disconnectListener = callback;
          break;
        case dh.IdeConnection.EVENT_RECONNECT:
          reconnectListener = callback;
          break;
      }
    },
  });
  const sessionWrapper = makeSessionWrapper({ connection });
  const { unmount } = renderConsolePanel({ sessionWrapper });

  expect(mockConsole).toHaveBeenCalledWith(
    expect.objectContaining({ disabled: false })
  );
  mockConsole.mockClear();

  disconnectListener();
  expect(mockConsole).toHaveBeenCalledWith(
    expect.objectContaining({ disabled: true })
  );
  mockConsole.mockClear();

  reconnectListener();
  expect(mockConsole).toHaveBeenCalledWith(
    expect.objectContaining({ disabled: false })
  );
  mockConsole.mockClear();

  unmount();
});
