import React from 'react';
import { Range } from '@deephaven/utils';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  return render(
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
  makeItemList();
});

describe('mouse', () => {
  function clickItem(itemIndex: number, options = {}): void {
    const item = screen.getByText(`${itemIndex}`);
    userEvent.click(item, options);
  }

  function doubleClickItem(itemIndex: number, options = {}): void {
    const item = screen.getByText(`${itemIndex}`);
    userEvent.dblClick(item, options);
  }

  function rightClickItem(itemIndex: number, options = {}): void {
    const item = screen.getByText(`${itemIndex}`);
    fireEvent.contextMenu(item, options);
  }

  it('sends onSelect when an item is clicked', () => {
    const onSelect = jest.fn();
    makeItemList({ onSelect });

    clickItem(3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
  });

  it('sends onSelect only when double clicked if isDoubleClickSelect is true', () => {
    const onSelect = jest.fn();
    makeItemList({ onSelect, isDoubleClickSelect: true });

    clickItem(3);

    expect(onSelect).not.toHaveBeenCalled();

    doubleClickItem(3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
  });

  it('extends the selection when shift clicked', () => {
    const onSelect = jest.fn();
    const onSelectionChange = jest.fn();
    makeItemList({
      isMultiSelect: true,
      onSelect,
      onSelectionChange,
    });

    clickItem(3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    onSelectionChange.mockClear();
    onSelect.mockClear();

    clickItem(6, { shiftKey: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 6]]);
  });

  it('selects multiple items with Ctrl+Click', () => {
    const onSelect = jest.fn();
    const onSelectionChange = jest.fn();
    makeItemList({
      isMultiSelect: true,
      onSelect,
      onSelectionChange,
    });

    clickItem(3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    onSelectionChange.mockClear();
    onSelect.mockClear();

    clickItem(6, { ctrlKey: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([
      [3, 3],
      [6, 6],
    ]);
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

      clickItem(firstIndex);

      expect(onSelect).toHaveBeenCalledWith(firstIndex, expect.anything());
      expect(onSelectionChange).toHaveBeenCalledWith([
        [firstIndex, firstIndex],
      ]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      rightClickItem(secondIndex, mouseOptions);

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
      makeItemList({
        isMultiSelect: true,
        onSelect,
        onSelectionChange,
      });

      clickItem(3);

      expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
      expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      clickItem(5, { ctrlKey: true });

      expect(onSelect).not.toHaveBeenCalled();
      expect(onSelectionChange).toHaveBeenCalledWith([
        [3, 3],
        [5, 5],
      ]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      rightClickItem(5);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });
});

function checkFocus(elementList, index) {
  for (let i = 0; i < elementList.length; i += 1) {
    if (i === index) {
      expect(elementList[i]).toHaveFocus();
    } else {
      expect(elementList[i]).not.toHaveFocus();
    }
  }
}
it('handles keyboard up and down properly', () => {
  const { container } = makeItemList();

  const correctList = container.querySelector(
    '.item-list-inner-element'
  ) as HTMLElement;
  const items = screen.getAllByRole('presentation').splice(1);

  checkFocus(items, -1);

  fireEvent.keyDown(correctList, {
    key: 'ArrowDown',
  });

  checkFocus(items, 0);

  fireEvent.keyDown(correctList, { key: 'ArrowDown' });
  fireEvent.keyDown(correctList, { key: 'ArrowDown' });
  fireEvent.keyDown(correctList, { key: 'ArrowDown' });

  checkFocus(items, 3);

  fireEvent.keyDown(correctList, { key: 'ArrowUp' });
  fireEvent.keyDown(correctList, { key: 'ArrowUp' });

  checkFocus(items, 1);
});
