import React from 'react';
import { type Range } from '@deephaven/utils';
import { type ClickOptions, TestUtils } from '@deephaven/test-utils';
import { act, render, screen } from '@testing-library/react';
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

it('does not send an empty viewport when the panel collapses to 0 height', () => {
  // Reproduces DH-22991: closing panels causes AutoSizer to briefly report a
  // height of 0. Sending that through as a viewport collapses top===bottom,
  // which clears the loaded items and blanks the command history.
  const ref =
    React.createRef<ItemList<{ value: number; displayValue: string }>>();
  const onViewportChange = jest.fn();
  render(
    <ItemList
      ref={ref}
      itemCount={100}
      rowHeight={20}
      offset={0}
      items={makeItems()}
      onSelect={jest.fn()}
      onSelectionChange={jest.fn()}
      onViewportChange={onViewportChange}
    />
  );

  // Establish a scrolled, sized viewport (as after normal use)
  act(() => {
    ref.current?.handleResize({ height: 400, width: 500 });
    ref.current?.handleScroll({
      scrollOffset: 200,
      scrollUpdateWasRequested: false,
    });
  });

  const lastGoodViewport =
    onViewportChange.mock.calls[onViewportChange.mock.calls.length - 1];
  onViewportChange.mockClear();

  // Panel collapses to 0 height during a layout change
  act(() => {
    ref.current?.handleResize({ height: 0, width: 500 });
  });

  // Must not emit a collapsed (empty) viewport for the 0-height event
  onViewportChange.mock.calls.forEach(([top, bottom]) => {
    expect(bottom).toBeGreaterThan(top);
  });
  // The last known good viewport must still be valid
  expect(lastGoodViewport[1]).toBeGreaterThan(lastGoodViewport[0]);
});

it('keeps scroll and sticky-bottom state when backgrounded to 0 height', () => {
  // When the panel is backgrounded (Golden Layout display:none) AutoSizer
  // reports height 0. That transient value must not reset the scroll offset
  // or drop the sticky-bottom flag, otherwise the list unpins from the bottom
  // and jumps to the top when the panel is shown again.
  const ref =
    React.createRef<ItemList<{ value: number; displayValue: string }>>();
  render(
    <ItemList
      ref={ref}
      isStickyBottom
      itemCount={100}
      rowHeight={20}
      offset={0}
      items={makeItems()}
      onSelect={jest.fn()}
      onSelectionChange={jest.fn()}
      onViewportChange={jest.fn()}
    />
  );

  // Size the list and scroll to the bottom
  act(() => {
    ref.current?.handleResize({ height: 400, width: 500 });
    ref.current?.handleScroll({
      scrollOffset: 100 * 20 - 400,
      scrollUpdateWasRequested: false,
    });
  });

  const scrollOffsetBefore = ref.current?.state.scrollOffset;
  expect(ref.current?.state.isStuckToBottom).toBe(true);

  // Panel is backgrounded -> AutoSizer reports 0
  act(() => {
    ref.current?.handleResize({ height: 0, width: 500 });
  });

  expect(ref.current?.state.scrollOffset).toBe(scrollOffsetBefore);
  expect(ref.current?.state.isStuckToBottom).toBe(true);
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
