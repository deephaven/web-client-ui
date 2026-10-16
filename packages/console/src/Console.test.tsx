import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Console } from './Console';
import { type CommandHistoryStorage } from './command-history';

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

async function makeConsoleWrapper(consoleRef = React.createRef<Console>()) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test');
  jest.spyOn(session, 'openDocument');
  const commandHistoryStorage = makeMockCommandHistoryStorage();
  const result = render(
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
  // The editor, and its document, open once Monaco has loaded
  await waitFor(() => expect(session.openDocument).toHaveBeenCalled());
  return result;
}

it('renders without crashing', async () => {
  await makeConsoleWrapper();
});

it('Handles arrow to prev item and back to blank', async () => {
  const user = userEvent.setup();
  const consoleRef = React.createRef<Console>();
  await makeConsoleWrapper(consoleRef);

  const consoleInput = consoleRef.current?.consoleInput.current;
  consoleInput!.history = ['A']; // monaco splits the text into separate tags if this is multiple characters

  act(() => consoleInput?.focus());
  await user.keyboard('[ArrowUp]');
  expect(screen.queryByText('A')).toBeInTheDocument();

  await user.keyboard('[ArrowDown]');
  expect(screen.queryByText('A')).not.toBeInTheDocument();
});
