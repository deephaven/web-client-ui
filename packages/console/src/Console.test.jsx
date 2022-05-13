import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { render } from '@testing-library/react';
import { Console } from './Console';

function makeMockCommandHistoryStorage() {
  return {
    addItem: jest.fn(),
    getTable: jest.fn(),
    updateItem: jest.fn(),
  };
}

jest.mock('./ConsoleInput', () => () => null);
jest.mock('./Console.jsx', () => ({
  ...jest.requireActual('./Console.jsx'),
  commandHistory: jest.fn(),
}));

function makeConsoleWrapper() {
  const session = new dh.IdeSession('test');
  const commandHistoryStorage = makeMockCommandHistoryStorage();
  return render(
    <Console
      commandHistoryStorage={commandHistoryStorage}
      focusCommandHistory={() => {}}
      openObject={() => {}}
      closeObject={() => {}}
      session={session}
      language="test"
    />
  );
}

it('renders without crashing', () => {
  makeConsoleWrapper();
});
