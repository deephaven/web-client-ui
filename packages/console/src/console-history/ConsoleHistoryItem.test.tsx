import React from 'react';
import ReactDOM from 'react-dom';
import ConsoleHistoryItem from './ConsoleHistoryItem';

const DEFAULT_ITEM = {
  message: 'Test item',
  cancelResult: () => undefined,
  disabledObjects: [],
};

it('renders default item without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <ConsoleHistoryItem
      item={DEFAULT_ITEM}
      language="python"
      openObject={jest.fn()}
    />,
    div
  );
  expect('ok').toBe('ok');
});
