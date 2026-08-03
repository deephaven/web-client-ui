import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { act, render } from '@testing-library/react';
import { ConsoleInput } from './ConsoleInput';
import { type CommandHistoryStorage } from './command-history';

/**
 * Mock MonacoTheme so LINE_HEIGHT resolves to a real number.
 * scss files are mocked as identity-obj-proxy by moduleNameMapper, which
 * returns the property key as the value, making parseInt return NaN.
 */
jest.mock('./monaco', () => ({
  ...jest.requireActual('./monaco'),
  MonacoTheme: {
    'line-height': '19px',
  },
}));

function makeMockCommandHistoryStorage(): CommandHistoryStorage {
  return {
    addItem: jest.fn(),
    getTable: jest.fn(),
    updateItem: jest.fn(),
    listenItem: jest.fn(),
  };
}

function makeSession(): dh.IdeSession {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test') as dh.IdeSession;
  jest.spyOn(session, 'openDocument');
  jest.spyOn(session, 'closeDocument');
  jest.spyOn(session, 'changeDocument');
  return session;
}

function renderConsoleInput(
  session: dh.IdeSession,
  ref: React.RefObject<ConsoleInput>
) {
  return render(
    <ConsoleInput
      ref={ref}
      session={session}
      language="test"
      commandHistoryStorage={makeMockCommandHistoryStorage()}
      onSubmit={jest.fn()}
    />
  );
}

describe('ConsoleInput session transition', () => {
  it('notifies the initial session when the document is opened', () => {
    const session = makeSession();
    const ref = React.createRef<ConsoleInput>();
    renderConsoleInput(session, ref);

    expect(session.openDocument).toHaveBeenCalledTimes(1);
  });

  it('calls closeDocument on the old session and openDocument on the new session on session prop change', () => {
    const session1 = makeSession();
    const session2 = makeSession();
    const ref = React.createRef<ConsoleInput>();

    const { rerender } = renderConsoleInput(session1, ref);

    rerender(
      <ConsoleInput
        ref={ref}
        session={session2}
        language="test"
        commandHistoryStorage={makeMockCommandHistoryStorage()}
        onSubmit={jest.fn()}
      />
    );

    expect(session1.closeDocument).toHaveBeenCalledTimes(1);
    expect(session2.openDocument).toHaveBeenCalledTimes(1);
  });

  it('routes model edits only to the current session after a session replacement', () => {
    const session1 = makeSession();
    const session2 = makeSession();
    const ref = React.createRef<ConsoleInput>();

    const { rerender } = renderConsoleInput(session1, ref);

    rerender(
      <ConsoleInput
        ref={ref}
        session={session2}
        language="test"
        commandHistoryStorage={makeMockCommandHistoryStorage()}
        onSubmit={jest.fn()}
      />
    );

    act(() => {
      ref.current!.commandEditor!.getModel()!.setValue('hello');
    });

    expect(session2.changeDocument).toHaveBeenCalled();
    expect(session1.changeDocument).not.toHaveBeenCalled();
  });

  it('calls closeDocument on the last active session when the component unmounts', () => {
    const session1 = makeSession();
    const session2 = makeSession();
    const ref = React.createRef<ConsoleInput>();

    const { unmount, rerender } = renderConsoleInput(session1, ref);

    rerender(
      <ConsoleInput
        ref={ref}
        session={session2}
        language="test"
        commandHistoryStorage={makeMockCommandHistoryStorage()}
        onSubmit={jest.fn()}
      />
    );

    unmount();

    // session1 was closed during the session transition
    expect(session1.closeDocument).toHaveBeenCalledTimes(1);
    // session2 is the last active session and is closed only at unmount
    expect(session2.closeDocument).toHaveBeenCalledTimes(1);
  });
});
