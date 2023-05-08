import React from 'react';
import { render } from '@testing-library/react';
import { CommandHistoryStorage } from '@deephaven/console';
import type { Container } from '@deephaven/golden-layout';
import type { IdeConnection, IdeSession } from '@deephaven/jsapi-types';
import { SessionConfig, SessionWrapper } from '@deephaven/jsapi-utils';
import { ConsolePanel } from './ConsolePanel';

const mockConsole = jest.fn(() => null);
jest.mock('@deephaven/console', () => ({
  ...(jest.requireActual('@deephaven/console') as Record<string, unknown>),
  Console: props => mockConsole(props),
  default: props => mockConsole(props),
}));

function makeSession(language = 'TEST_LANG'): IdeSession {
  return (new dh.IdeSession(language) as unknown) as IdeSession;
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
