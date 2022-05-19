import React from 'react';
import { render } from '@testing-library/react';
import { ConsolePanel } from './ConsolePanel';

jest.mock('@deephaven/console', () => ({
  ...jest.requireActual('@deephaven/console'),
  Console: jest.fn(() => null),
  default: jest.fn(() => null),
}));

jest.mock('./Panel', () => jest.fn(() => null));

function makeSession() {
  return {
    addEventListener: jest.fn(),
    connection: {
      subscribeToFieldUpdates: jest.fn(() => () => null),
    },
    removeEventListener: jest.fn(),
    getTable: jest.fn(),
    getObject: jest.fn(),
    runCode: jest.fn(),
  };
}

it('renders without crashing', () => {
  const eventHub = { emit: () => {}, on: () => {}, off: () => {} };
  const container = { emit: () => {}, on: () => {}, off: () => {} };
  const session = makeSession();
  render(
    <ConsolePanel
      glEventHub={eventHub}
      glContainer={container}
      commandHistoryStorage={{}}
      timeZone="MockTimeZone"
      sessionWrapper={{ session, config: {} }}
    />
  );
});
