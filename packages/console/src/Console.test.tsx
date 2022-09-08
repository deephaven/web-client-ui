import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { render } from '@testing-library/react';
import { Console } from './Console';
import { CommandHistoryStorage } from './command-history';

function makeMockCommandHistoryStorage(): CommandHistoryStorage {
  return {
    addItem: jest.fn(),
    getTable: jest.fn(),
    updateItem: jest.fn(),
    listenItem: jest.fn(),
  };
}

jest.mock('./ConsoleInput', () => {
  const { forwardRef } = jest.requireActual('react');
  return forwardRef(() => null);
});
jest.mock('./Console', () => ({
  ...(jest.requireActual('./Console') as Record<string, unknown>),
  commandHistory: jest.fn(),
}));

function makeConsoleWrapper() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test');
  const commandHistoryStorage = makeMockCommandHistoryStorage();
  return render(
    <Console
      commandHistoryStorage={commandHistoryStorage}
      focusCommandHistory={() => undefined}
      openObject={() => undefined}
      closeObject={() => undefined}
      session={session}
      language="test"
    />
  );
}

it('renders without crashing', () => {
  makeConsoleWrapper();
});
