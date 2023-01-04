import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridUtils } from '@deephaven/grid';
import type { MoveOperation } from '@deephaven/grid';
import type { ColumnGroup } from '@deephaven/jsapi-shim';
import VisibilityOrderingBuilder from './VisibilityOrderingBuilder';
import IrisGridTestUtils from '../../IrisGridTestUtils';
import ColumnHeaderGroup from '../../ColumnHeaderGroup';

jest.useFakeTimers();

const ALL_PREFIX = 'Test';
const COLUMN_PREFIX = 'TestColumn';
const GROUP_PREFIX = 'TestGroup';
const COLUMNS = IrisGridTestUtils.makeColumns(10, COLUMN_PREFIX);
const SELECTED_CLASS = 'isSelected';
const COLUMN_HEADER_GROUPS: ColumnGroup[] = [
  {
    name: `${GROUP_PREFIX}OneAndThree`,
    children: [`${COLUMN_PREFIX}1`, `${COLUMN_PREFIX}3`],
  },
  {
    name: `${GROUP_PREFIX}TwoAndFour`,
    children: [`${COLUMN_PREFIX}2`, `${COLUMN_PREFIX}4`],
    color: '#ffffff',
  },
];

window.HTMLElement.prototype.scroll = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

function Builder({
  model = makeModel(),
  userColumnWidths = new Map(),
  movedColumns = model.initialMovedColumns,
  columnHeaderGroups = model.columnHeaderGroups,
  onColumnHeaderGroupChanged = jest.fn(),
  onColumnVisibilityChanged = jest.fn(),
  onMovedColumnsChanged = jest.fn(),
}: Partial<VisibilityOrderingBuilder['props']> = {}) {
  return (
    <VisibilityOrderingBuilder
      model={model}
      userColumnWidths={userColumnWidths}
      movedColumns={movedColumns}
      columnHeaderGroups={columnHeaderGroups}
      onColumnHeaderGroupChanged={onColumnHeaderGroupChanged}
      onColumnVisibilityChanged={onColumnVisibilityChanged}
      onMovedColumnsChanged={onMovedColumnsChanged}
    />
  );
}

function BuilderWithGroups({
  model = makeModelWithGroups(),
  ...rest
}: Partial<VisibilityOrderingBuilder['props']> = {}) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Builder model={model} {...rest} />;
}

function makeModel() {
  return IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable({ columns: COLUMNS })
  );
}

function makeModelWithGroups(groups = COLUMN_HEADER_GROUPS) {
  return IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable({
      columns: COLUMNS,
      layoutHints: { columnGroups: groups },
    })
  );
}

function controlClick(element: HTMLElement) {
  userEvent.click(element, { ctrlKey: true });
}

function shiftClick(element: HTMLElement) {
  userEvent.click(element, { shiftKey: true });
}

function clickItem(index: number, addToExisting = false) {
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  if (addToExisting) {
    controlClick(elements[index]);
  } else {
    userEvent.click(elements[index]);
  }
}

function selectItems(indexes: number[]) {
  clearSelection();
  for (let i = 0; i < indexes.length; i += 1) {
    clickItem(indexes[i], true);
  }
}

function clearSelection() {
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  clickItem(0);
  if (elements[0].closest(`.${SELECTED_CLASS}`) != null) {
    clickItem(0);
  }
}

function expectSelection(indexes: number[]) {
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  const selection = elements
    .map((element, i) => ({ element, i }))
    .filter(({ element }) => element.closest(`.${SELECTED_CLASS}`) != null)
    .map(({ i }) => i);
  expect(selection).toEqual(indexes);
}

test('Renders all children', () => {
  const { unmount } = render(<Builder />);
  let elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  expect(elements.length).toBe(COLUMNS.length);
  unmount();
  render(<BuilderWithGroups />);
  elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  expect(elements.length).toBe(COLUMNS.length + COLUMN_HEADER_GROUPS.length);
});

test('Renders immovable items', () => {
  const model = IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable({
      columns: COLUMNS,
      layoutHints: {
        frozenColumns: [`${COLUMN_PREFIX}2`, `${COLUMN_PREFIX}4`],
      },
    })
  );
  render(<Builder model={model} />);

  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  expect(elements[0].textContent).toEqual(`${COLUMN_PREFIX}2`);
  expect(elements[0].closest('.immovable')).not.toBeNull();
  expect(elements[1].textContent).toEqual(`${COLUMN_PREFIX}4`);
  expect(elements[1].closest('.immovable')).not.toBeNull();
});

test('Select and deselects items', async () => {
  render(<Builder />);
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  clickItem(0);
  expectSelection([0]);
  clickItem(1);
  expectSelection([1]);

  controlClick(elements[2]);
  expectSelection([1, 2]);

  shiftClick(elements[4]);
  expectSelection([1, 2, 3, 4]);

  controlClick(elements[2]);
  expectSelection([1, 3, 4]);

  clickItem(2);
  expectSelection([2]);
});

test('Select and deselects groups', async () => {
  render(<BuilderWithGroups />);
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  clickItem(1);
  expectSelection([1, 2, 3]);
  clickItem(4);
  expectSelection([4, 5, 6]);

  controlClick(elements[7]);
  expectSelection([4, 5, 6, 7]);

  shiftClick(elements[9]);
  expectSelection([4, 5, 6, 7, 8, 9]);

  controlClick(elements[1]);
  expectSelection([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  clickItem(2);
  expectSelection([2]);
});

test('Moves items up with button', async () => {
  const mockHandler = jest.fn();
  const getUpButton = () => screen.getByLabelText('Move selection up');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([1]);
  // Must get after an item is selected
  // Disabled buttons render in a wrapper and the element changes after selection
  userEvent.click(getUpButton());
  let newMoves = [{ from: 1, to: 0 }];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  // Item is at top, move up should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getUpButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  clearSelection();

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  selectItems([1, 3]);
  userEvent.click(getUpButton());
  newMoves = [
    { from: 1, to: 0 },
    { from: 3, to: 2 },
  ];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getUpButton());
  newMoves = newMoves.concat({ from: 2, to: 1 });
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  // Both at the top now
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getUpButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);
});

test('Moves groups up with button', async () => {
  const mockHandler = jest.fn();
  const getUpButton = () => screen.getByLabelText('Move selection up');
  const model = makeModelWithGroups();
  const { rerender } = render(
    <BuilderWithGroups model={model} onMovedColumnsChanged={mockHandler} />
  );

  selectItems([1]);
  userEvent.click(getUpButton());
  const newMoves: MoveOperation[] = model.initialMovedColumns.concat([
    { from: [1, 2], to: 0 },
  ]);
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  // Item is at top, move up should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getUpButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);
});

it('Moves items down with button', async () => {
  const mockHandler = jest.fn();
  const getDownButton = () => screen.getByLabelText('Move selection down');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  clickItem(1);
  userEvent.click(getDownButton());
  let newMoves = [{ from: 1, to: 2 }];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getDownButton());
  newMoves = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  // Multi-select
  rerender(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([6, 8]);
  userEvent.click(getDownButton());
  newMoves = [
    { from: 8, to: 9 },
    { from: 6, to: 7 },
  ];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getDownButton());
  newMoves = newMoves.concat({ from: 7, to: 8 });
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);

  // Both at bottom
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getDownButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, undefined);
});

it('Moves items to top with button', async () => {
  const mockHandler = jest.fn((_, cb) => cb());
  const getTopButton = () => screen.getByLabelText('Move selection to top');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  userEvent.click(getTopButton());
  let newMoves = [{ from: 1, to: 0 }];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());

  // Scrolls if needed

  // Item is at top, move to top should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getTopButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());

  clearSelection();

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  selectItems([0, 2, 4]);
  userEvent.click(getTopButton());
  newMoves = [
    { from: 2, to: 1 },
    { from: 4, to: 2 },
  ];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getTopButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());
});

it('Moves items to bottom with button', async () => {
  const mockHandler = jest.fn((_, cb) => cb());
  const getBottomButton = () =>
    screen.getByLabelText('Move selection to bottom');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  userEvent.click(getBottomButton());
  let newMoves = [{ from: 1, to: 9 }];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());

  // Item is at bottom, move to bottom should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getBottomButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());

  clearSelection();

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  selectItems([0, 2, 4, 9]);
  userEvent.click(getBottomButton());
  newMoves = [
    { from: 4, to: 8 },
    { from: 2, to: 7 },
    { from: 0, to: 6 },
  ];
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getBottomButton());
  expect(mockHandler).toHaveBeenCalledWith(newMoves, expect.anything());
});

test('Sorts items', async () => {
  const mockHandler = jest.fn();
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);
  const sortDescendingBtn = screen.getByLabelText('Sort descending');

  userEvent.click(sortDescendingBtn);
  let movedColumns = mockHandler.mock.calls[0][0];
  const indexes = Array(COLUMNS.length)
    .fill(0)
    .map((_, i) => i);
  expect(GridUtils.getVisibleIndexes(indexes, movedColumns)).toEqual(
    [...indexes].reverse()
  );

  mockHandler.mockReset();

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={movedColumns} />
  );

  const sortAscendingBtn = screen.getByLabelText('Sort ascending');
  userEvent.click(sortAscendingBtn);
  // No idea why this is a prefer destructuring issue
  // eslint-disable-next-line prefer-destructuring
  movedColumns = mockHandler.mock.calls[0][0];
  expect(GridUtils.getVisibleIndexes(indexes, movedColumns)).toEqual(indexes);
});

test('Creates groups', async () => {
  const model = makeModel();
  const mockGroupHandler = jest.fn() as jest.MockedFunction<
    VisibilityOrderingBuilder['props']['onColumnHeaderGroupChanged']
  >;
  const mockMoveHandler = jest.fn((_, cb) => cb());
  const { rerender } = render(
    <Builder
      model={model}
      onColumnHeaderGroupChanged={mockGroupHandler}
      onMovedColumnsChanged={mockMoveHandler}
    />
  );

  selectItems([1, 3]);

  const createGroupBtn = screen.getByText('Group');
  userEvent.click(createGroupBtn);

  const groupObject = {
    children: [`${COLUMN_PREFIX}1`, `${COLUMN_PREFIX}3`],
    name: expect.stringContaining(`${ColumnHeaderGroup.NEW_GROUP_PREFIX}`),
  };
  expect(mockGroupHandler).toBeCalledWith([
    expect.objectContaining(groupObject),
  ]);

  const movedColumns = [
    { from: 1, to: 0 },
    { from: 3, to: 1 },
  ];
  expect(mockMoveHandler).toBeCalledWith(movedColumns, expect.anything());

  const groups = mockGroupHandler.mock.calls[0][0];
  model.columnHeaderGroups = groups;
  rerender(
    <Builder
      model={model}
      movedColumns={movedColumns}
      onColumnHeaderGroupChanged={mockGroupHandler}
    />
  );

  expect(screen.getByPlaceholderText('Group Name')).toHaveFocus();

  const cancelButton = screen.getByLabelText('Cancel');
  userEvent.click(cancelButton);
  expect(mockGroupHandler).toBeCalledWith([]);
});

test('Search columns', () => {
  render(<BuilderWithGroups />);

  const searchInput = screen.getByPlaceholderText('Search');

  userEvent.type(searchInput, GROUP_PREFIX);
  jest.advanceTimersByTime(500); // Advance past debounce timeout

  // 1 is first group, 2 and 3 are children. 4 is 2nd group, 5 and 6 are children
  expectSelection([1, 2, 3, 4, 5, 6]);

  userEvent.type(searchInput, 'One');
  jest.advanceTimersByTime(500);
  expectSelection([1, 2, 3]);

  userEvent.clear(searchInput);
  jest.advanceTimersByTime(500);
  expectSelection([]);

  userEvent.type(searchInput, 'asdf');
  jest.advanceTimersByTime(500);
  expectSelection([]);
});

test('Edit group name', () => {
  const mockHandler = jest.fn();
  const getEditButton = () => screen.getAllByLabelText('Edit')[0];
  const originalName = COLUMN_HEADER_GROUPS[0].name;
  render(<BuilderWithGroups onColumnHeaderGroupChanged={mockHandler} />);

  userEvent.click(getEditButton());

  let nameInput = screen.getByDisplayValue(originalName);
  expect(nameInput).toHaveFocus();
  userEvent.type(nameInput, 'abc');

  const cancelButton = screen.getByLabelText('Cancel');
  userEvent.click(cancelButton);
  expect(mockHandler).toHaveBeenCalledTimes(0);

  userEvent.click(getEditButton());
  nameInput = screen.getByDisplayValue(originalName);
  userEvent.type(nameInput, 'abc{esc}');
  expect(mockHandler).toHaveBeenCalledTimes(0);

  userEvent.click(getEditButton());

  nameInput = screen.getByDisplayValue(originalName);
  userEvent.type(nameInput, COLUMN_HEADER_GROUPS[1].name);
  expect(screen.queryAllByText('Duplicate name').length).toBe(1);

  userEvent.clear(nameInput);
  expect(screen.queryAllByText('Duplicate name').length).toBe(0);

  userEvent.type(nameInput, 'abc{space}');
  expect(screen.queryAllByText('Invalid name').length).toBe(1);

  userEvent.type(nameInput, '{backspace}');
  expect(screen.queryAllByText('Invalid name').length).toBe(0);

  const confirmButton = screen.getByLabelText('Confirm');
  userEvent.click(confirmButton);
  expect(mockHandler).toHaveBeenCalledWith([
    expect.objectContaining({ ...COLUMN_HEADER_GROUPS[0], name: 'abc' }),
    expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
  ]);

  userEvent.click(getEditButton());
  nameInput = screen.getByDisplayValue('abc');
  userEvent.type(nameInput, 'abcd{enter}');
  expect(mockHandler).toHaveBeenCalledWith([
    expect.objectContaining({ ...COLUMN_HEADER_GROUPS[0], name: 'abcd' }),
    expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
  ]);
});

test('Toggles all visibility', () => {
  const mockHandler = jest.fn();
  const { rerender } = render(
    <Builder onColumnVisibilityChanged={mockHandler} />
  );

  const indexes = Array(COLUMNS.length)
    .fill(0)
    .map((_, i) => i);

  const hideButton = screen.getByText('Hide All');
  userEvent.click(hideButton);
  expect(mockHandler).toBeCalledWith(indexes, false);

  rerender(
    <Builder
      onColumnVisibilityChanged={mockHandler}
      userColumnWidths={new Map(indexes.map(i => [i, 0]))}
    />
  );
  const showButton = screen.getByText('Show All');
  userEvent.click(showButton);
  expect(mockHandler).toBeCalledWith(indexes, true);
});
