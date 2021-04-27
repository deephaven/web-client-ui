import React from 'react';
import { mount } from 'enzyme';
import CommandHistory from './CommandHistory';

jest.mock('pouchdb-browser');

function makeItems(count = 10) {
  const items = [];

  for (let i = 0; i < count; i += 1) {
    items.push({ id: `${i}`, name: `Command ${i}` });
  }

  return items;
}

const defaultItems = makeItems();

function mountItems(items) {
  const table = { size: items.length, onUpdate: () => {} };
  const wrapper = mount(
    <CommandHistory
      table={table}
      language="test"
      sendToConsole={() => {}}
      sendToNotebook={() => {}}
    />
  );

  wrapper.setState({
    items,
    itemCount: items.length,
    offset: 0,
  });

  return wrapper;
}

function getItem(wrapper, itemIndex) {
  return wrapper.find('div.command-history-item').at(itemIndex);
}

function clickItem(wrapper, itemIndex, mouseEventInit = {}) {
  getItem(wrapper, itemIndex).simulate('mousedown', mouseEventInit);

  getItem(wrapper, itemIndex).simulate('mouseup', mouseEventInit);
}

function dragRange(wrapper, start, end, mouseEventInit = {}) {
  getItem(wrapper, start).simulate('mousedown', mouseEventInit);
  for (let i = start; i <= end; i += 1) {
    getItem(wrapper, i).simulate('mousemove', mouseEventInit);
  }
  getItem(wrapper, end).simulate('mouseup', mouseEventInit);
}

it('renders an empty list without crashing', () => {
  mountItems([]);
});

it('renders a list with items without crashing', () => {
  mountItems(defaultItems);
});

it('handles selecting an item on click', () => {
  const wrapper = mountItems(defaultItems);

  clickItem(wrapper, 0);

  expect(getItem(wrapper, 0).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 1).hasClass('selected')).toBe(false);
});

it('handles selecting and deselecting an item on click', () => {
  const wrapper = mountItems(defaultItems);

  clickItem(wrapper, 0);

  expect(getItem(wrapper, 0).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 1).hasClass('selected')).toBe(false);

  clickItem(wrapper, 0);

  expect(getItem(wrapper, 0).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 1).hasClass('selected')).toBe(false);
});

it('handles changing selection on click', () => {
  const wrapper = mountItems(defaultItems);

  clickItem(wrapper, 0);

  expect(getItem(wrapper, 0).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 1).hasClass('selected')).toBe(false);

  clickItem(wrapper, 1);

  expect(getItem(wrapper, 0).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 1).hasClass('selected')).toBe(true);
});

it('handles selecting a range on shift click', () => {
  const wrapper = mountItems(defaultItems);

  clickItem(wrapper, 3);

  expect(getItem(wrapper, 2).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 3).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 4).hasClass('selected')).toBe(false);

  clickItem(wrapper, 7, { shiftKey: true });
  for (let i = 0; i < 10; i += 1) {
    const isSelected = i >= 3 && i <= 7;
    expect(getItem(wrapper, i).hasClass('selected')).toBe(isSelected);
  }
});

it('handles changing selection to single item within range on click', () => {
  const wrapper = mountItems(defaultItems);

  clickItem(wrapper, 2);
  clickItem(wrapper, 4, { shiftKey: true });

  expect(getItem(wrapper, 1).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 2).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 3).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 4).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 5).hasClass('selected')).toBe(false);

  clickItem(wrapper, 3);

  expect(getItem(wrapper, 1).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 2).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 3).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 4).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 5).hasClass('selected')).toBe(false);
});

it('handles selecting multiple items on modifier click', () => {
  const wrapper = mountItems(defaultItems);

  const selectedItems = [3, 5, 7];
  for (let i = 0; i < selectedItems.length; i += 1) {
    clickItem(wrapper, selectedItems[i], { ctrlKey: i !== 0 });
  }

  for (let i = 0; i < 10; i += 1) {
    const isSelected = selectedItems.indexOf(i) >= 0;
    expect(getItem(wrapper, i).hasClass('selected')).toBe(isSelected);
  }
});

it('handles click and drag', () => {
  const wrapper = mountItems(defaultItems);

  dragRange(wrapper, 3, 7);

  for (let i = 0; i < 10; i += 1) {
    const isSelected = i >= 3 && i <= 7;
    expect(getItem(wrapper, i).hasClass('selected')).toBe(isSelected);
  }
});

it('handles click and drag with multiples moves on same item', () => {
  const wrapper = mountItems(defaultItems);

  getItem(wrapper, 3).simulate('mousedown', {});
  getItem(wrapper, 3).simulate('mousemove', {});
  getItem(wrapper, 4).simulate('mousemove', {});
  getItem(wrapper, 4).simulate('mousemove', {});
  getItem(wrapper, 4).simulate('mousemove', {});
  getItem(wrapper, 5).simulate('mousemove', {});
  getItem(wrapper, 6).simulate('mousemove', {});
  // Drag past the item we want, when we drag back should still be selected
  getItem(wrapper, 7).simulate('mousemove', {});
  getItem(wrapper, 6).simulate('mousemove', {});
  getItem(wrapper, 6).simulate('mouseup', {});

  for (let i = 0; i < 10; i += 1) {
    const isSelected = i >= 3 && i <= 7;
    expect(getItem(wrapper, i).hasClass('selected')).toBe(isSelected);
  }
});

it('handles click and drag, then modifier click to remove item', () => {
  const wrapper = mountItems(defaultItems);

  dragRange(wrapper, 3, 4);

  expect(getItem(wrapper, 2).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 3).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 4).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 5).hasClass('selected')).toBe(false);

  clickItem(wrapper, 3, { ctrlKey: true });

  expect(getItem(wrapper, 2).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 3).hasClass('selected')).toBe(false);
  expect(getItem(wrapper, 4).hasClass('selected')).toBe(true);
  expect(getItem(wrapper, 5).hasClass('selected')).toBe(false);
});
