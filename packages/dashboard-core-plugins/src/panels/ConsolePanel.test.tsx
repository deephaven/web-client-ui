import React from 'react';
import { render } from '@testing-library/react';
import { CommandHistoryStorage } from '@deephaven/console';
import { Container } from '@deephaven/golden-layout';
import { ConsolePanel } from './ConsolePanel';
import { SessionWrapper } from '../redux';

jest.mock('@deephaven/console', () => ({
  ...(jest.requireActual('@deephaven/console') as Record<string, unknown>),
  Console: jest.fn(() => null),
  default: jest.fn(() => null),
}));

jest.mock('./Panel', () => jest.fn(() => null));

function makeSession() {
  return {
    addEventListener: jest.fn(),
    subscribeToFieldUpdates: jest.fn(() => () => null),
    removeEventListener: jest.fn(),
    getTable: jest.fn(),
    getObject: jest.fn(),
    runCode: jest.fn(),
  };
}

it('renders without crashing', () => {
  const eventHub = {
    emit: () => undefined,
    on: () => undefined,
    off: () => undefined,
    trigger: () => undefined,
    unbind: () => undefined,
  };
  const container: Partial<Container> = {
    emit: () => undefined,
    on: () => undefined,
    off: () => undefined,
  };
  const session = makeSession();
  render(
    <ConsolePanel
      glEventHub={eventHub}
      glContainer={container as Container}
      commandHistoryStorage={{} as CommandHistoryStorage}
      timeZone="MockTimeZone"
      sessionWrapper={({ session, config: {} } as unknown) as SessionWrapper}
    />
  );
});
