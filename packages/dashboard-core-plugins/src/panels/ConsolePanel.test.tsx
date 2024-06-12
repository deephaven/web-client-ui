import React from 'react';
import { render } from '@testing-library/react';
import { CommandHistoryStorage } from '@deephaven/console';
import type { Container, EventEmitter } from '@deephaven/golden-layout';
import type { IdeConnection, IdeSession } from '@deephaven/jsapi-types';
import { dh } from '@deephaven/jsapi-shim';
import { SessionConfig, SessionWrapper } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import { ConsolePanel } from './ConsolePanel';

type IdeSessionConstructor = new (language: string) => IdeSession;

const mockConsole = jest.fn((_props: unknown) => null);
jest.mock('@deephaven/console', () => ({
  ...(jest.requireActual('@deephaven/console') as Record<string, unknown>),
  Console: props => mockConsole(props),
  default: props => mockConsole(props),
}));

function makeSession(language = 'TEST_LANG'): IdeSession {
  return new (dh.IdeSession as unknown as IdeSessionConstructor)(language);
}

function makeConnection({
  addEventListener = jest.fn(),
  removeEventListener = jest.fn(),
}: {
  addEventListener?: (eventName: string, callback: () => void) => void;
  removeEventListener?: (eventName: string, callback: () => void) => void;
} = {}): IdeConnection {
  return {
    addEventListener,
    removeEventListener,
  } as unknown as IdeConnection;
}

function makeSessionConfig(): SessionConfig {
  return { type: 'test_type', id: 'test_id' };
}

function makeSessionWrapper({
  config = makeSessionConfig(),
  connection = makeConnection(),
  session = makeSession(),
} = {}): SessionWrapper {
  return { session, connection, config, dh };
}

function makeCommandHistoryStorage(): CommandHistoryStorage {
  return {} as CommandHistoryStorage;
}

function renderConsolePanel({
  eventHub = TestUtils.createMockProxy<EventEmitter>(),
  container = TestUtils.createMockProxy<Container>({
    tab: undefined,
  }),
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
      localDashboardId="mock-localDashboardId"
      plugins={new Map()}
    />
  );
}

beforeEach(() => {
  // Mocking the Console component causes it to be treated as a functional
  // component which causes React to log an error about passing refs. Disable
  // logging to supress this
  TestUtils.disableConsoleOutput('error');

  mockConsole.mockClear();
});

it('renders without crashing', () => {
  const { unmount } = renderConsolePanel();
  unmount();
  expect('ok').toBe('ok');
});
