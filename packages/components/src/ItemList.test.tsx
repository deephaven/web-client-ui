import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import ItemList from './ItemList';

function makeItems(count = 20) {
  const items = [];

  for (let i = 0; i < count; i += 1) {
    items.push({ value: i, displayValue: `${i}` });
  }

  return items;
}

function makeItemList({
  isDoubleClickSelect = false,
  isMultiSelect = false,
  itemCount = 100,
  rowHeight = 20,
  offset = 0,
  items = makeItems(),
  onSelect = jest.fn(),
  onSelectionChange = jest.fn(),
  onViewportChange = jest.fn(),
} = {}) {
  return mount(
    <ItemList
      isDoubleClickSelect={isDoubleClickSelect}
      isMultiSelect={isMultiSelect}
      itemCount={itemCount}
      rowHeight={rowHeight}
      offset={offset}
      items={items}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      onViewportChange={onViewportChange}
    />
  );
}

it('mounts and unmounts properly', () => {
  const itemList = makeItemList();
  itemList.unmount();
});

describe('mouse', () => {
  function clickItem(
    itemList: ReactWrapper,
    itemIndex: number,
    options = {}
  ): void {
    itemList
      .find('.item-list-item')
      .at(itemIndex)
      .simulate('mousedown', options);

    itemList.find('.item-list-item').at(itemIndex).simulate('mouseup', options);
  }

  function doubleClickItem(
    itemList: ReactWrapper,
    itemIndex: number,
    options = {}
  ): void {
    itemList
      .find('.item-list-item')
      .at(itemIndex)
      .simulate('dblclick', options);
  }

  it('sends onSelect when an item is clicked', () => {
    const onSelect = jest.fn();
    const itemList = makeItemList({ onSelect });

    clickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3);

    itemList.unmount();
  });

  it('sends onSelect only when double clicked if isDoubleClickSelect is true', () => {
    const onSelect = jest.fn();
    const itemList = makeItemList({ onSelect, isDoubleClickSelect: true });

    clickItem(itemList, 3);

    expect(onSelect).not.toHaveBeenCalled();

    doubleClickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3);

    itemList.unmount();
  });

  it('extends the selection when shift clicked', () => {
    const onSelect = jest.fn();
    const onSelectionChange = jest.fn();
    const itemList = makeItemList({
      isMultiSelect: true,
      onSelect,
      onSelectionChange,
    });

    clickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3);
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    clickItem(itemList, 6, { shiftKey: true });

    expect(onSelect).toHaveBeenCalledWith(6);
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 6]]);

    itemList.unmount();
  });
});

it('handles keyboard up and down properly', () => {
  const itemList = makeItemList();

  expect(itemList.state('focusIndex')).toBe(null);

  itemList.simulate('keydown', { key: 'ArrowDown' });

  expect(itemList.state('focusIndex')).toBe(0);

  itemList.simulate('keydown', { key: 'ArrowDown' });
  itemList.simulate('keydown', { key: 'ArrowDown' });
  itemList.simulate('keydown', { key: 'ArrowDown' });

  expect(itemList.state('focusIndex')).toBe(3);

  itemList.simulate('keydown', { key: 'ArrowUp' });
  itemList.simulate('keydown', { key: 'ArrowUp' });

  expect(itemList.state('focusIndex')).toBe(1);

  itemList.unmount();
});
