import React from 'react';
import { Range, TestUtils, ClickOptions } from '@deephaven/utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemList from './ItemList';

function makeItems(count = 20) {
  const items: { value: number; displayValue: string }[] = [];

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
  async function clickItem(
    user: ReturnType<typeof userEvent.setup>,
    itemIndex: number,
    options: ClickOptions = {}
  ) {
    const item = screen.getByText(`${itemIndex}`);
    await TestUtils.click(user, item, options);
  }

  async function doubleClickItem(
    user: ReturnType<typeof userEvent.setup>,
    itemIndex: number
  ) {
    const item = screen.getByText(`${itemIndex}`);
    await user.dblClick(item);
  }

  async function rightClickItem(
    user: ReturnType<typeof userEvent.setup>,
    itemIndex: number,
    options: ClickOptions = {}
  ) {
    const item = screen.getByText(`${itemIndex}`);
    await TestUtils.click(user, item, { ...options, rightClick: true });
  }

  it('sends onSelect when an item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    makeItemList({ onSelect });

    await clickItem(user, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
  });

  it('sends onSelect only when double clicked if isDoubleClickSelect is true', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    makeItemList({ onSelect, isDoubleClickSelect: true });

    await clickItem(user, 3);

    expect(onSelect).not.toHaveBeenCalled();

    await doubleClickItem(user, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
  });

  it('extends the selection when shift clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onSelectionChange = jest.fn();
    makeItemList({
      isMultiSelect: true,
      onSelect,
      onSelectionChange,
    });

    await clickItem(user, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    onSelectionChange.mockClear();
    onSelect.mockClear();

    await clickItem(user, 6, { shiftKey: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 6]]);
  });

  it('selects multiple items with Ctrl+Click', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onSelectionChange = jest.fn();
    makeItemList({
      isMultiSelect: true,
      onSelect,
      onSelectionChange,
    });

    await clickItem(user, 3);

    expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
    expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

    onSelectionChange.mockClear();
    onSelect.mockClear();

    await clickItem(user, 6, { ctrlKey: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([
      [3, 3],
      [6, 6],
    ]);
  });

  describe('context menu', () => {
    async function testContextMenu(
      user: ReturnType<typeof userEvent.setup>,
      firstIndex: number,
      secondIndex: number,
      expectedSelectionChange: Range[] | null = [[secondIndex, secondIndex]],
      mouseOptions: ClickOptions = {}
    ) {
      const onSelect = jest.fn();
      const onSelectionChange = jest.fn();
      const itemList = makeItemList({
        isMultiSelect: true,
        onSelect,
        onSelectionChange,
      });

      await clickItem(user, firstIndex);

      expect(onSelect).toHaveBeenCalledWith(firstIndex, expect.anything());
      expect(onSelectionChange).toHaveBeenCalledWith([
        [firstIndex, firstIndex],
      ]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      await rightClickItem(user, secondIndex, mouseOptions);

      expect(onSelect).not.toHaveBeenCalled();
      if (expectedSelectionChange != null) {
        expect(onSelectionChange).toHaveBeenCalledWith(expectedSelectionChange);
      } else {
        expect(onSelectionChange).not.toHaveBeenCalled();
      }

      itemList.unmount();
    }

    it('keeps selection when right-click in current selection', async () => {
      const user = userEvent.setup();
      await testContextMenu(user, 3, 3, null);
    });

    it('updates selection when right-click outside current selection', async () => {
      const user = userEvent.setup();
      await testContextMenu(user, 3, 6);
    });

    it('adds selection when ctrl+right-click outside current selection', async () => {
      const user = userEvent.setup();
      await testContextMenu(
        user,
        3,
        6,
        [
          [3, 3],
          [6, 6],
        ],
        { ctrlKey: true }
      );
    });

    it('extends selection when shift+right-click outside current selection', async () => {
      const user = userEvent.setup();
      await testContextMenu(user, 3, 6, [[3, 6]], { shiftKey: true });
    });

    it('maintains selection if right-clicked item is selected', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      const onSelectionChange = jest.fn();
      makeItemList({
        isMultiSelect: true,
        onSelect,
        onSelectionChange,
      });

      await clickItem(user, 3);

      expect(onSelect).toHaveBeenCalledWith(3, expect.anything());
      expect(onSelectionChange).toHaveBeenCalledWith([[3, 3]]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      await clickItem(user, 5, { ctrlKey: true });

      expect(onSelect).not.toHaveBeenCalled();
      expect(onSelectionChange).toHaveBeenCalledWith([
        [3, 3],
        [5, 5],
      ]);

      onSelectionChange.mockClear();
      onSelect.mockClear();

      await rightClickItem(user, 5);

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
it('handles keyboard up and down properly', async () => {
  const user = userEvent.setup();
  const { container } = makeItemList();

  const correctList = container.querySelector(
    '.item-list-inner-element'
  ) as HTMLElement;
  const items = screen.getAllByRole('presentation').splice(1);

  checkFocus(items, -1);

  correctList.focus();
  await user.keyboard('[ArrowDown]');

  checkFocus(items, 0);

  await user.keyboard('[ArrowDown]');
  await user.keyboard('[ArrowDown]');
  await user.keyboard('[ArrowDown]');

  checkFocus(items, 3);

  await user.keyboard('[ArrowUp]');
  await user.keyboard('[ArrowUp]');

  checkFocus(items, 1);
});
