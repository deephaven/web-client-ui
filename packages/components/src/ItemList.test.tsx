import React from 'react';
import { mount } from 'enzyme';
import ItemList from './ItemList';

function makeItems(count = 20) {
  const items = [];

  for (let i = 0; i < count; i += 1) {
    items.push({ value: i, displayValue: `${i}` });
  }

  return items;
}

function makeItemList({
  itemCount = 100,
  rowHeight = 20,
  offset = 0,
  items = makeItems(),
  onSelect = () => undefined,
  onViewportChange = () => undefined,
} = {}) {
  return mount(
    <ItemList
      itemCount={itemCount}
      rowHeight={rowHeight}
      offset={offset}
      items={items}
      onSelect={onSelect}
      onViewportChange={onViewportChange}
    />
  );
}

it('mounts and unmounts properly', () => {
  const itemList = makeItemList();
  itemList.unmount();
});

it('Sends the proper signal when an item is clicked', () => {
  const onSelect = jest.fn();
  const itemList = makeItemList({ onSelect });

  itemList.find('.item-list-item').at(3).simulate('mousedown', {});

  itemList.find('.item-list-item').at(3).simulate('mouseup', {});

  expect(onSelect).toHaveBeenCalledWith(3);

  itemList.unmount();
});

it('handles keyboard up and down properly', () => {
  const itemList = makeItemList();

  expect(itemList.state('keyboardIndex')).toBe(null);

  itemList.simulate('keydown', { key: 'ArrowDown' });

  expect(itemList.state('keyboardIndex')).toBe(0);

  itemList.simulate('keydown', { key: 'ArrowDown' });
  itemList.simulate('keydown', { key: 'ArrowDown' });
  itemList.simulate('keydown', { key: 'ArrowDown' });

  expect(itemList.state('keyboardIndex')).toBe(3);

  itemList.simulate('keydown', { key: 'ArrowUp' });
  itemList.simulate('keydown', { key: 'ArrowUp' });

  expect(itemList.state('keyboardIndex')).toBe(1);

  itemList.unmount();
});
