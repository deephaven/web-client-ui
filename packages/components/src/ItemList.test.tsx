import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Range } from '@deephaven/utils';
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

  function rightClickItem(
    itemList: ReactWrapper,
    itemIndex: number,
    options = {}
  ): void {
    itemList
      .find('.item-list-item')
      .at(itemIndex)
      .simulate('contextmenu', options);
  }

  it('sends onSelect when an item is clicked', () => {
    const onSelect = jest.fn();
    const itemList = makeItemList({ onSelect });

    clickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());

    itemList.unmount();
  });

  it('sends onSelect only when double clicked if isDoubleClickSelect is true', () => {
    const onSelect = jest.fn();
    const itemList = makeItemList({ onSelect, isDoubleClickSelect: true });

    clickItem(itemList, 3);

    expect(onSelect).not.toHaveBeenCalled();

    doubleClickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());

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

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    onSelectionChange.mockClear();
    onSelect.mockClear();

    clickItem(itemList, 6, { shiftKey: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 6]]);

    itemList.unmount();
  });

  it('selects multiple items with Ctrl+Click', () => {
    const onSelect = jest.fn();
    const onSelectionChange = jest.fn();
    const itemList = makeItemList({
      isMultiSelect: true,
      onSelect,
      onSelectionChange,
    });

    clickItem(itemList, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    onSelectionChange.mockClear();
    onSelect.mockClear();

    clickItem(itemList, 6, { ctrlKey: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([
      [3, 3],
      [6, 6],
    ]);

    itemList.unmount();
  });

  describe('context menu', () => {
    function testContextMenu(
      firstIndex: number,
      secondIndex: number,
      expectedSelectionChange: Range[] | null = [[secondIndex, secondIndex]],
      mouseOptions = {}
    ) {
      const onSelect = jest.fn();
      const onSelectionChange = jest.fn();
      const itemList = makeItemList({
        isMultiSelect: true,
        onSelect,
        onSelectionChange,
      });

      clickItem(itemList, firstIndex);

      expect(onSelect).toHaveBeenCalledWith(firstIndex, expect.anything());
      expect(onSelectionChange).toHaveBeenCalledWith([
        [firstIndex, firstIndex],
      ]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      rightClickItem(itemList, secondIndex, mouseOptions);

      expect(onSelect).not.toHaveBeenCalled();
      if (expectedSelectionChange != null) {
        expect(onSelectionChange).toHaveBeenCalledWith(expectedSelectionChange);
      } else {
        expect(onSelectionChange).not.toHaveBeenCalled();
      }

      itemList.unmount();
    }

    it('keeps selection when right-click in current selection', () => {
      testContextMenu(3, 3, null);
    });

    it('updates selection when right-click outside current selection', () => {
      testContextMenu(3, 6);
    });

    it('adds selection when ctrl+right-click outside current selection', () => {
      testContextMenu(
        3,
        6,
        [
          [3, 3],
          [6, 6],
        ],
        { ctrlKey: true }
      );
    });

    it('extends selection when shift+right-click outside current selection', () => {
      testContextMenu(3, 6, [[3, 6]], { shiftKey: true });
    });

    it('maintains selection if right-clicked item is selected', () => {
      const onSelect = jest.fn();
      const onSelectionChange = jest.fn();
      const itemList = makeItemList({
        isMultiSelect: true,
        onSelect,
        onSelectionChange,
      });

      clickItem(itemList, 3);

      expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
      expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      clickItem(itemList, 5, { ctrlKey: true });

      expect(onSelect).not.toHaveBeenCalled();
      expect(onSelectionChange).toHaveBeenCalledWith([
        [3, 3],
        [5, 5],
      ]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      rightClickItem(itemList, 5);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();

      itemList.unmount();
    });
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
