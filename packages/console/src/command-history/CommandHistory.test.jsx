import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandHistory from './CommandHistory';

jest.mock('pouchdb-browser');

function makeItems(count = 10) {
  const items = [];

  for (let i = 0; i < count; i += 1) {
    items.push({ id: `${i}`, name: `Command ${i}` });
  }

  return items;
}

let updateFunction;

jest.mock('./CommandHistoryViewportUpdater', () =>
  jest.fn(({ onUpdate }) => {
    updateFunction = onUpdate;
    return null;
  })
);

function makeCommandHistoryTable(itemLength) {
  return {
    onUpdate: jest.fn(),
    setSearch: jest.fn(),
    setReversed: jest.fn(),
    setViewport: jest.fn(),
    getSnapshot: jest.fn(),
    size: itemLength,
  };
}

function mountItems(itemLength = 10) {
  const table = makeCommandHistoryTable(itemLength);
  const wrapper = render(
    <CommandHistory
      table={table}
      language="test"
      sendToConsole={() => {}}
      sendToNotebook={() => {}}
      commandHistoryStorage={{ addItem() {}, updateItem() {}, getTable() {} }}
    />
  );
  const items = makeItems(itemLength);
  updateFunction({ items, offset: 0 });

  return wrapper;
}

function getCommandText(index) {
  return `Command ${index}`;
}

function getCommandItem(index) {
  return screen.getByText(getCommandText(index));
}
function clickItem(itemIndex, mouseEventInit = {}) {
  const item = screen.getByText(getCommandItem(itemIndex));
  fireEvent.mouseDown(item, mouseEventInit);
  fireEvent.mouseUp(item, mouseEventInit);
}

function dragRange(start, end) {
  const startItem = screen.getByText(getCommandItem(start));
  fireEvent.mouseDown(startItem);
  for (let i = start; i <= end; i += 1) {
    const item = screen.getByText(getCommandItem(i));
    fireEvent.mouseMove(item);
  }
  const endItem = screen.getByText(getCommandItem(end));
  fireEvent.mouseUp(endItem);
}

it('renders an empty list without crashing', () => {
  mountItems(0);
});

it('renders a list with items without crashing', () => {
  mountItems();
});

function expectSelected(index) {
  expect(screen.getByText(getCommandItem(index)).parentNode).toHaveClass(
    'active'
  );
}
function expectNotSelected(index) {
  expect(screen.getByText(getCommandItem(index)).parentNode).not.toHaveClass(
    'active'
  );
}

it('handles selecting an item on click', () => {
  mountItems();

  clickItem(0);
  expectSelected(0);
});

it('handles selecting and deselecting an item on click', () => {
  mountItems(10);

  userEvent.click(screen.getByText(getCommandItem(0)));

  expectSelected(0);
  expectNotSelected(1);

  userEvent.click(screen.getByText(getCommandItem(0)));

  expectNotSelected(0);
  expectNotSelected(1);
});

it('handles changing selection on click', () => {
  mountItems(10);

  clickItem(0);

  expectSelected(0);
  expectNotSelected(1);

  clickItem(1);

  expectSelected(1);
  expectNotSelected(0);
});

it('handles selecting a range on shift click', () => {
  mountItems();

  clickItem(3);
  expectNotSelected(2);
  expectSelected(3);
  expectNotSelected(4);
  clickItem(7, { shiftKey: true });
  for (let i = 0; i < 10; i += 1) {
    if (i >= 3 && i <= 7) {
      expectSelected(i);
    } else {
      expectNotSelected(i);
    }
  }
});

it('handles changing selection to single item within range on click', () => {
  mountItems();

  clickItem(2);
  clickItem(4, { shiftKey: true });

  expectNotSelected(1);
  expectSelected(2);
  expectSelected(3);
  expectSelected(4);
  expectNotSelected(5);

  clickItem(3);

  expectNotSelected(1);
  expectNotSelected(2);
  expectSelected(3);
  expectNotSelected(4);
  expectNotSelected(5);
});

it('handles selecting multiple items on modifier click', () => {
  mountItems(10);

  const selectedItems = [3, 5, 7];
  for (let i = 0; i < selectedItems.length; i += 1) {
    clickItem(selectedItems[i], { ctrlKey: i !== 0 });
  }

  for (let i = 0; i < 10; i += 1) {
    const isSelected = selectedItems.indexOf(i) >= 0;
    if (isSelected) {
      expectSelected(i);
    } else {
      expectNotSelected(i);
    }
  }
});

it('handles click and drag', () => {
  mountItems(10);

  dragRange(3, 7);

  for (let i = 0; i < 10; i += 1) {
    const isSelected = i >= 3 && i <= 7;
    if (isSelected) {
      expectSelected(i);
    } else {
      expectNotSelected(i);
    }
  }
});

it('handles click and drag with multiples moves on same item', () => {
  mountItems();

  fireEvent.mouseDown(screen.getByText(getCommandItem(3)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(3)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(4)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(4)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(4)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(5)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(6)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(7)));
  fireEvent.mouseMove(screen.getByText(getCommandItem(6)));
  fireEvent.mouseUp(screen.getByText(getCommandItem(6)));

  for (let i = 0; i < 10; i += 1) {
    const isSelected = i >= 3 && i <= 7;
    if (isSelected) {
      expectSelected(i);
    } else {
      expectNotSelected(i);
    }
  }
});

it('handles click and drag, then modifier click to remove item', () => {
  mountItems(10);

  dragRange(3, 4);

  expectNotSelected(2);
  expectSelected(3);
  expectSelected(4);
  expectNotSelected(5);

  clickItem(3, { ctrlKey: true });

  expectNotSelected(2);
  expectNotSelected(3);
  expectSelected(4);
  expectNotSelected(5);
});
