import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import SingleClickItemList from './SingleClickItemList';

function makeItems(count = 20) {
  const items = [];

  for (let i = 0; i < count; i += 1) {
    items.push({ itemName: `${i}` });
  }

  return items;
}

function makeItemList({
  itemCount = 100,
  rowHeight = 20,
  offset = 0,
  items = makeItems(),
  onSelect = jest.fn(),
  onSelectionChange = jest.fn(),
  onViewportChange = jest.fn(),
  isMultiSelect = true,
} = {}) {
  return mount(
    <SingleClickItemList
      itemCount={itemCount}
      rowHeight={rowHeight}
      offset={offset}
      items={items}
      isMultiSelect={isMultiSelect}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      onViewportChange={onViewportChange}
    />
  );
}

function clickItem(itemList: ReactWrapper, index: number, options = {}) {
  itemList.find('.item-list-item').at(index).simulate('click', options);
}

it('mounts and unmounts properly', () => {
  const itemList = makeItemList();
  itemList.unmount();
});

describe('mouse', () => {
  it('Sends the proper signal when an item is clicked', () => {
    const onSelect = jest.fn();
    const itemList = makeItemList({ onSelect });

    clickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3);

    itemList.unmount();
  });

  it('handles shift+click properly', () => {
    const onSelectionChange = jest.fn();
    const itemList = makeItemList({ onSelectionChange });

    clickItem(itemList, 3);

    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]], 3);
    onSelectionChange.mockClear();

    clickItem(itemList, 6, { shiftKey: true });

    expect(onSelectionChange).toHaveBeenCalledWith([[3, 6]], 3);
  });
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
