import React from 'react';
import dh from '@deephaven/jsapi-shim';
import { shallow } from 'enzyme';
import { Console } from './Console';

function makeMockCommandHistoryStorage() {
  return {
    addItem: jest.fn(),
    updateItem: jest.fn(),
  };
}

function makeConsoleWrapper() {
  const session = new dh.IdeSession('test');
  const commandHistoryStorage = makeMockCommandHistoryStorage();
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
