import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/**
 * Need to mock out the MonacoTheme as module.scss are not loaded in tests.
 * scss files are mocked as defined by our `moduleNameMapper` setting in `jest.config.base.cjs
 */

jest.mock('./monaco', () => ({
  ...jest.requireActual('./monaco'),
  MonacoTheme: {
    'line-height': '19px',
  },
}));

jest.mock('./Console', () => ({
  ...(jest.requireActual('./Console') as Record<string, unknown>),
  commandHistory: jest.fn(),
}));

function makeConsoleWrapper(consoleRef = React.createRef<Console>()) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test');
  const commandHistoryStorage = makeMockCommandHistoryStorage();
  return render(
    <Console
      dh={dh}
      ref={consoleRef}
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

it('Handles arrow to prev item and back to blank', async () => {
  const user = userEvent.setup();
  const consoleRef = React.createRef<Console>();
  makeConsoleWrapper(consoleRef);

  const consoleInput = consoleRef.current?.consoleInput.current;
  consoleInput!.history = ['A']; // monaco splits the text into separate tags if this is multiple characters

  consoleInput?.focus();
  await user.keyboard('[ArrowUp]');
  expect(screen.queryByText('A')).toBeInTheDocument();

  await user.keyboard('[ArrowDown]');
  expect(screen.queryByText('A')).not.toBeInTheDocument();
});
