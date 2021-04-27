import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { shallow } from 'enzyme';
import { Console } from './Console';
import PouchCommandHistoryStorage from './command-history/PouchCommandHistoryStorage';

function makeConsoleWrapper() {
  const session = new dh.IdeSession('test');
  const commandHistoryStorage = new PouchCommandHistoryStorage('groovy');
  const wrapper = shallow(
    <Console
      commandHistoryStorage={commandHistoryStorage}
      closeSession={() => {}}
      restartSession={() => {}}
      focusCommandHistory={() => {}}
      openObject={() => {}}
      closeObject={() => {}}
      session={session}
      language="test"
    />
  );

  wrapper.instance().commandHistory = {
    scrollToBottom: jest.fn(),
  };

  return wrapper;
}

it('renders without crashing', () => {
  makeConsoleWrapper();
});
