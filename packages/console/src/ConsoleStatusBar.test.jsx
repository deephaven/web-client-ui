import React from 'react';
import { mount } from 'enzyme';
import dh from '@deephaven/jsapi-shim';
import ConsoleStatusBar from './ConsoleStatusBar';

function makeConsoleStatusBarWrapper() {
  const session = new dh.IdeSession('test');
  const wrapper = mount(
    <ConsoleStatusBar
      session={session}
      language="test"
      createNotebook={() => {}}
      openObject={() => {}}
      objects={[]}
      overflowActions={[]}
    />
  );

  return wrapper;
}

it('renders without crashing', () => {
  makeConsoleStatusBarWrapper();
});
