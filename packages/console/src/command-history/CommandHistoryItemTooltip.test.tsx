import React from 'react';
import { render, screen } from '@testing-library/react';
import { CommandHistoryItemTooltip } from './CommandHistoryItemTooltip';
import { CommandHistoryStorageItem } from './CommandHistoryStorage';

jest.mock('../common/Code', () => () => 'Code');

function makeCommandHistoryStorage() {
  return {
    addItem: jest.fn(),
    getTable: jest.fn(),
    listenItem: jest.fn(),
    updateItem: jest.fn(),
  };
}

function makeItem(
  id = 'TestId',
  name = 'Test command'
): CommandHistoryStorageItem {
  return {
    id,
    name,
    data: { command: name, startTime: `${Date.now()}` },
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
  return render(
    <CommandHistoryItemTooltip
      language="test"
      item={item}
      commandHistoryStorage={commandHistoryStorage}
    />
  );
}

it('mounts and unmounts without crashing', () => {
  shallowTooltip();
});

describe('different command results', () => {
  let callback = null;
  let cleanup = null;
  let commandHistoryStorage = null;
  let unmount = null;

  beforeEach(() => {
    jest.useFakeTimers();
    cleanup = jest.fn();
    commandHistoryStorage = makeCommandHistoryStorage();
    commandHistoryStorage.listenItem = jest.fn((language, id, cb) => {
      callback = data => cb({ data });
      return cleanup;
    });
    ({ unmount } = shallowTooltip(makeItem(), commandHistoryStorage));

    // Run the pending timers so that it tries to load the data
    jest.runOnlyPendingTimers();
  });

  it('shows loading spinner while waiting for updates', () => {
    expect(commandHistoryStorage.listenItem).toHaveBeenCalled();
    expect(screen.getAllByRole('img', { hidden: true }).length).toBe(2);

    unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('renders <1s elapsed time for a command that was just started', () => {
    callback(makeCommandStarted());
    expect(screen.getByText('<1s')).toBeTruthy();
  });

  it('renders correct time for completed command', () => {
    callback(makeCommandCompletedSuccess());
    expect(screen.getByText('5s')).toBeTruthy();
  });

  it('shows error message', () => {
    const commandCompletedError = makeCommandCompletedError();
    callback(commandCompletedError);

    expect(screen.getByText(commandCompletedError.result.error)).toBeTruthy();
  });
});
