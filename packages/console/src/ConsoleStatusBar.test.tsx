import React from 'react';
import { render } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import ConsoleStatusBar from './ConsoleStatusBar';

function makeConsoleStatusBarWrapper() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test');
  const wrapper = render(
    <ConsoleStatusBar
      session={session}
      openObject={() => undefined}
      objects={[]}
      overflowActions={[]}
    />
  );

  return wrapper;
}

it('renders without crashing', () => {
  makeConsoleStatusBarWrapper();
});
