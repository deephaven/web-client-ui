import React from 'react';
import { mount } from 'enzyme';
import { CommandHistoryItemTooltip } from './CommandHistoryItemTooltip';

jest.mock('../common/Code', () => () => 'Code');

function makeCommandHistoryStorage() {
  return {
    addItem: jest.fn(),
    getTable: jest.fn(),
    listenItem: jest.fn(),
    updateItem: jest.fn(),
  };
}

function makeItem(id = 'TestId', name = 'Test command') {
  return {
    id,
    name,
  };
}

function makeCommandStarted() {
  return {
    command: 'started',
    result: null,
    startTime: Date.now(),
  };
}

function makeCommandCompletedSuccess() {
  return {
    command: 'success',
    result: {},
    startTime: Date.now(),
    endTime: Date.now() + 5000,
  };
}

function makeCommandCompletedError() {
  return {
    command: 'error',
    result: {
      error: 'error',
    },
    startTime: Date.now(),
    endTime: Date.now() + 5000,
  };
}

function shallowTooltip(
  item = makeItem(),
  commandHistoryStorage = makeCommandHistoryStorage()
) {
  return mount(
    <CommandHistoryItemTooltip
      language="test"
      item={item}
      commandHistoryStorage={commandHistoryStorage}
    />
  );
}

it('mounts and unmounts without crashing', () => {
  const wrapper = shallowTooltip();
  wrapper.unmount();
});

describe('different command results', () => {
  let callback = null;
  let cleanup = null;
  let commandHistoryStorage = null;
  let wrapper = null;

  beforeEach(() => {
    jest.useFakeTimers();
    cleanup = jest.fn();
    commandHistoryStorage = makeCommandHistoryStorage();
    commandHistoryStorage.listenItem = jest.fn((language, id, cb) => {
      callback = data => cb({ data });
      return cleanup;
    });
    wrapper = shallowTooltip(makeItem(), commandHistoryStorage);

    // Run the pending timers so that it tries to load the data
    jest.runOnlyPendingTimers();
  });

  it('shows loading spinner while waiting for updates', () => {
    expect(commandHistoryStorage.listenItem).toHaveBeenCalled();
    expect(wrapper.find('.loading-spinner').length).toBe(1);

    wrapper.unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('renders <1s elapsed time for a command that was just started', () => {
    callback(makeCommandStarted());
    wrapper.update();
    expect(wrapper.find('.time-string').text()).toBe('<1s');
  });

  it('renders correct time for completed command', () => {
    callback(makeCommandCompletedSuccess());
    wrapper.update();
    expect(wrapper.find('.time-string').text()).toBe('5s');
  });

  it('shows error message', () => {
    const commandCompletedError = makeCommandCompletedError();
    callback(commandCompletedError);
    wrapper.update();
    expect(wrapper.find('.error-message').length).toBe(1);
    expect(wrapper.find('.error-message').text()).toBe(
      commandCompletedError.result.error
    );
  });
});
