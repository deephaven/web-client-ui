import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridUtils } from '@deephaven/grid';
import type { MoveOperation } from '@deephaven/grid';
import { assertNotNull } from '@deephaven/utils';
import type { ColumnGroup } from '@deephaven/jsapi-shim';
import VisibilityOrderingBuilder from './VisibilityOrderingBuilder';
import IrisGridTestUtils from '../../IrisGridTestUtils';
import ColumnHeaderGroup from '../../ColumnHeaderGroup';
import { flattenTree, getTreeItems } from './sortable-tree/utilities';

jest.useFakeTimers();

const ALL_PREFIX = 'Test';
const COLUMN_PREFIX = 'TestColumn';
const GROUP_PREFIX = 'TestGroup';
const COLUMNS = IrisGridTestUtils.makeColumns(10, COLUMN_PREFIX);
const SELECTED_CLASS = 'isSelected';
const COLUMN_HEADER_GROUPS: ColumnGroup[] = [
  {
    name: `${GROUP_PREFIX}OneAndThree`,
    children: [COLUMNS[1].name, COLUMNS[3].name],
  },
  {
    name: `${GROUP_PREFIX}TwoAndFour`,
    children: [COLUMNS[2].name, COLUMNS[4].name],
    color: '#ffffff',
  },
];
const NESTED_COLUMN_HEADER_GROUPS: ColumnGroup[] = [
  {
    name: `${GROUP_PREFIX}OneAndThree`,
    children: [COLUMNS[1].name, COLUMNS[3].name, `${GROUP_PREFIX}TwoAndFour`],
  },
  {
    name: `${GROUP_PREFIX}TwoAndFour`,
    children: [COLUMNS[2].name, COLUMNS[4].name],
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
  builderRef = React.createRef(),
}: Partial<VisibilityOrderingBuilder['props']> & {
  builderRef?: React.RefObject<VisibilityOrderingBuilder>;
} = {}) {
  return (
    <VisibilityOrderingBuilder
      model={model}
      userColumnWidths={userColumnWidths}
      movedColumns={movedColumns}
      columnHeaderGroups={columnHeaderGroups}
      onColumnHeaderGroupChanged={onColumnHeaderGroupChanged}
      onColumnVisibilityChanged={onColumnVisibilityChanged}
      onMovedColumnsChanged={onMovedColumnsChanged}
      ref={builderRef}
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

function BuilderWithNestedGroups({
  model = makeModelWithGroups(NESTED_COLUMN_HEADER_GROUPS),
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
        backColumns: [`${COLUMN_PREFIX}7`],
      },
    })
  );
  render(<Builder model={model} />);

  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  expect(elements[0].textContent).toEqual(`${COLUMN_PREFIX}2`);
  expect(elements[0].closest('.immovable')).not.toBeNull();
  expect(elements[1].textContent).toEqual(`${COLUMN_PREFIX}4`);
  expect(elements[1].closest('.immovable')).not.toBeNull();
  expect(elements[elements.length - 1].textContent).toEqual(
    `${COLUMN_PREFIX}7`
  );
  expect(elements[elements.length - 1].closest('.immovable')).not.toBeNull();
});

test('Renders a grid of only immovable items', () => {
  const model = IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable({
      columns: IrisGridTestUtils.makeColumns(1, COLUMN_PREFIX),
      layoutHints: {
        frozenColumns: [`${COLUMN_PREFIX}0`],
      },
    })
  );
  render(<Builder model={model} />);

  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  expect(elements[0].textContent).toEqual(`${COLUMN_PREFIX}0`);
  expect(elements[0].closest('.immovable')).not.toBeNull();
  expect(elements.length).toBe(1);
});

test('Select and deselects items', () => {
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
  controlClick(elements[3]);
  expectSelection([2, 3]);
  clickItem(3);
  expectSelection([3]);
});

test('Select and deselects groups', () => {
  render(<BuilderWithGroups />);
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });

  clickItem(1); // Select group
  expectSelection([1, 2, 3]);

  clickItem(4); // Select the other group
  expectSelection([4, 5, 6]);

  controlClick(elements[7]); // Add element to selection
  expectSelection([4, 5, 6, 7]);

  shiftClick(elements[9]); // Add 2 more to selection via range select
  expectSelection([4, 5, 6, 7, 8, 9]);

  controlClick(elements[1]); // Add 1st group to selection
  expectSelection([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  controlClick(elements[1]); // Remove 1st group from selection
  expectSelection([4, 5, 6, 7, 8, 9]);

  controlClick(elements[5]); // Remove child of 2nd group from selection
  expectSelection([6, 7, 8, 9]);

  clickItem(2); // Select item in 1st group alone
  expectSelection([2]);
});

test('Moves items up with button', () => {
  const mockHandler = jest.fn();
  const getUpButton = () => screen.getByLabelText('Move selection up');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([1]);
  // Must get after an item is selected
  // Disabled buttons render in a wrapper and the element changes after selection
  userEvent.click(getUpButton());
  let newMoves = [{ from: 1, to: 0 }];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Item is at top, move up should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getUpButton());
  expect(mockHandler).not.toBeCalled();

  clearSelection();

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  selectItems([1, 3]);
  userEvent.click(getUpButton());
  newMoves = [
    { from: 1, to: 0 },
    { from: 3, to: 2 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getUpButton());
  newMoves = newMoves.concat({ from: 2, to: 1 });
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Both at the top now
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getUpButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups up with button', () => {
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
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Item is at top, move up should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getUpButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves items in and out of groups with up button', () => {
  const mockMoveHandler = jest.fn();
  const mockGroupHandler = jest.fn() as jest.MockedFunction<
    VisibilityOrderingBuilder['props']['onColumnHeaderGroupChanged']
  >;
  const getUpButton = () => screen.getByLabelText('Move selection up');
  const model = makeModelWithGroups(NESTED_COLUMN_HEADER_GROUPS);
  const { rerender } = render(
    <BuilderWithGroups
      model={model}
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
    />
  );

  selectItems([2]); // First child in outer group
  userEvent.click(getUpButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[0],
        children: NESTED_COLUMN_HEADER_GROUPS[0].children.filter(
          name => name !== `${COLUMN_PREFIX}1`
        ),
      }),
      expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[1]),
    ])
  );

  mockGroupHandler.mockReset();

  selectItems([7]); // First item after the nested groups, col5
  userEvent.click(getUpButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[0],
        children: NESTED_COLUMN_HEADER_GROUPS[0].children.concat([
          `${COLUMN_PREFIX}5`,
        ]),
      }),
      expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[1]),
    ])
  );

  // Item is last item in the outer group. Moving up again should
  // put it at the bottom of the nested group
  // eslint-disable-next-line prefer-destructuring
  model.columnHeaderGroups = mockGroupHandler.mock.calls[0][0];
  rerender(
    <BuilderWithGroups
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
      columnHeaderGroups={model.columnHeaderGroups}
    />
  );
  mockGroupHandler.mockReset();
  userEvent.click(getUpButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith(
    expect.arrayContaining([
      expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[0]),
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[1],
        children: NESTED_COLUMN_HEADER_GROUPS[1].children.concat([
          `${COLUMN_PREFIX}5`,
        ]),
      }),
    ])
  );
});

test('Moves items down with button', () => {
  const mockHandler = jest.fn();
  const getDownButton = () => screen.getByLabelText('Move selection down');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  clickItem(1);
  userEvent.click(getDownButton());
  let newMoves = [{ from: 1, to: 2 }];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getDownButton());
  newMoves = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Multi-select
  rerender(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([6, 8]);
  userEvent.click(getDownButton());
  newMoves = [
    { from: 8, to: 9 },
    { from: 6, to: 7 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getDownButton());
  newMoves = newMoves.concat({ from: 7, to: 8 });
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  mockHandler.mockReset();
  // Both at bottom
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  userEvent.click(getDownButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups down with button', () => {
  const mockHandler = jest.fn();
  const getDownButton = () => screen.getByLabelText('Move selection down');
  const model = makeModelWithGroups();
  const movedColumns = model.initialMovedColumns.concat([
    { from: [3, 4], to: 7 },
  ]);
  const { rerender } = render(
    <BuilderWithGroups
      model={model}
      onMovedColumnsChanged={mockHandler}
      // Move the 2nd group to 1 above the bottom
      movedColumns={movedColumns}
    />
  );

  selectItems([8]); // 2nd group, 1 item above the bottom
  userEvent.click(getDownButton());
  const newMoves: MoveOperation[] = movedColumns.concat([
    { from: [7, 8], to: 8 },
  ]);
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Item is at bottom, move down should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getDownButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves items in and out of groups with down button', () => {
  const mockMoveHandler = jest.fn();
  const mockGroupHandler = jest.fn() as jest.MockedFunction<
    VisibilityOrderingBuilder['props']['onColumnHeaderGroupChanged']
  >;
  const getDownButton = () => screen.getByLabelText('Move selection down');
  const model = makeModelWithGroups(NESTED_COLUMN_HEADER_GROUPS);
  const { rerender } = render(
    <BuilderWithGroups
      model={model}
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
    />
  );

  selectItems([0]); // First item above groups
  userEvent.click(getDownButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[0],
        children: NESTED_COLUMN_HEADER_GROUPS[0].children.concat([
          `${COLUMN_PREFIX}0`,
        ]),
      }),
      expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[1]),
    ])
  );

  mockGroupHandler.mockReset();

  selectItems([6]); // Last item of the nested groups, col4
  userEvent.click(getDownButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[0],
        children: NESTED_COLUMN_HEADER_GROUPS[0].children.concat([
          `${COLUMN_PREFIX}4`,
        ]),
      }),
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[1],
        children: NESTED_COLUMN_HEADER_GROUPS[1].children.filter(
          name => name !== `${COLUMN_PREFIX}4`
        ),
      }),
    ])
  );

  // Item is last item in the outer group. Moving down again should
  // put it out of the groups
  // eslint-disable-next-line prefer-destructuring
  model.columnHeaderGroups = mockGroupHandler.mock.calls[0][0];
  rerender(
    <BuilderWithGroups
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
      columnHeaderGroups={model.columnHeaderGroups}
    />
  );
  mockGroupHandler.mockReset();
  userEvent.click(getDownButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith(
    expect.arrayContaining([
      expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[0]),
      expect.objectContaining({
        ...NESTED_COLUMN_HEADER_GROUPS[1],
        children: NESTED_COLUMN_HEADER_GROUPS[1].children.filter(
          name => name !== `${COLUMN_PREFIX}4`
        ),
      }),
    ])
  );
});

test('Moves items to top with button', () => {
  const mockHandler = jest.fn((_, cb) => cb());
  const getTopButton = () => screen.getByLabelText('Move selection to top');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  userEvent.click(getTopButton());
  let newMoves = [{ from: 1, to: 0 }];
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  // Item is at top, move to top should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getTopButton());
  expect(mockHandler).not.toBeCalled();

  clearSelection();

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  selectItems([0, 2, 4]);
  userEvent.click(getTopButton());
  newMoves = [
    { from: 2, to: 1 },
    { from: 4, to: 2 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getTopButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups to top with button', () => {
  const mockHandler = jest.fn((_, cb) => cb());
  const getTopButton = () => screen.getByLabelText('Move selection to top');
  const model = makeModelWithGroups();
  const { rerender } = render(
    <BuilderWithGroups model={model} onMovedColumnsChanged={mockHandler} />
  );

  selectItems([1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  userEvent.click(getTopButton());
  const newMoves = model.initialMovedColumns.concat([{ from: [1, 2], to: 0 }]);
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  // Item is at top, move to top should not generate new moves
  rerender(
    <Builder
      model={model}
      onMovedColumnsChanged={mockHandler}
      movedColumns={newMoves}
    />
  );
  mockHandler.mockReset();
  userEvent.click(getTopButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves items to bottom with button', () => {
  const mockHandler = jest.fn((_, cb) => cb());
  const getBottomButton = () =>
    screen.getByLabelText('Move selection to bottom');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  selectItems([1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  userEvent.click(getBottomButton());
  let newMoves = [{ from: 1, to: 9 }];
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  // Item is at bottom, move to bottom should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getBottomButton());
  expect(mockHandler).not.toBeCalled();

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
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  userEvent.click(getBottomButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups to bottom with button', () => {
  const mockHandler = jest.fn((_, cb) => cb());
  const getBottomButton = () =>
    screen.getByLabelText('Move selection to bottom');
  const model = makeModelWithGroups();
  const { rerender } = render(
    <BuilderWithGroups model={model} onMovedColumnsChanged={mockHandler} />
  );

  selectItems([1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  userEvent.click(getBottomButton());
  const newMoves = model.initialMovedColumns.concat([{ from: [1, 2], to: 8 }]);
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  // Item is at top, move to top should not generate new moves
  rerender(
    <Builder
      model={model}
      onMovedColumnsChanged={mockHandler}
      movedColumns={newMoves}
    />
  );
  mockHandler.mockReset();
  userEvent.click(getBottomButton());
  expect(mockHandler).not.toBeCalled();
});

test('Sorts items', () => {
  const mockHandler = jest.fn();
  const { rerender } = render(
    <BuilderWithGroups onMovedColumnsChanged={mockHandler} />
  );
  const sortDescendingBtn = screen.getByLabelText('Sort descending');

  userEvent.click(sortDescendingBtn);
  let movedColumns = mockHandler.mock.calls[0][0];

  // TestGroups at the end after sort
  const modelIndexes = [0, 5, 6, 7, 8, 9, 1, 3, 2, 4];
  const visibleIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  expect(GridUtils.getVisibleIndexes(modelIndexes, movedColumns)).toEqual(
    [...visibleIndexes].reverse()
  );

  mockHandler.mockReset();

  rerender(
    <BuilderWithGroups
      onMovedColumnsChanged={mockHandler}
      movedColumns={movedColumns}
    />
  );

  const sortAscendingBtn = screen.getByLabelText('Sort ascending');
  userEvent.click(sortAscendingBtn);
  // No idea why this is a prefer destructuring issue
  // eslint-disable-next-line prefer-destructuring
  movedColumns = mockHandler.mock.calls[0][0];
  expect(GridUtils.getVisibleIndexes(modelIndexes, movedColumns)).toEqual(
    visibleIndexes
  );
});

test('Creates groups', () => {
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

  mockMoveHandler.mockReset();

  const cancelButton = screen.getByLabelText('Cancel');
  userEvent.click(cancelButton);
  expect(mockGroupHandler).toBeCalledWith([]);
  expect(mockMoveHandler).not.toBeCalled();
});

test('Only allows 1 new group at a time', () => {
  const model = makeModelWithGroups([
    {
      children: [`${COLUMN_PREFIX}0`, `${COLUMN_PREFIX}1`],
      name: `${ColumnHeaderGroup.NEW_GROUP_PREFIX}Test`,
    },
  ]);

  const mockGroupHandler = jest.fn();

  render(
    <Builder
      model={model}
      columnHeaderGroups={model.columnHeaderGroups}
      onColumnHeaderGroupChanged={mockGroupHandler}
    />
  );

  selectItems([2, 3]);
  const groupObject = {
    children: [`${COLUMN_PREFIX}2`, `${COLUMN_PREFIX}3`],
    name: expect.stringContaining(`${ColumnHeaderGroup.NEW_GROUP_PREFIX}`),
  };

  const createGroupBtn = screen.getByText('Group');
  userEvent.click(createGroupBtn);
  expect(mockGroupHandler).toBeCalledWith([
    expect.objectContaining(groupObject),
  ]);
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
  const getEditButton = () => screen.getAllByLabelText('Edit')[1]; // Edit the nested group
  const originalName = NESTED_COLUMN_HEADER_GROUPS[1].name;
  render(<BuilderWithNestedGroups onColumnHeaderGroupChanged={mockHandler} />);

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
  userEvent.type(nameInput, NESTED_COLUMN_HEADER_GROUPS[0].name);
  expect(screen.queryAllByText('Duplicate name').length).toBe(1);

  userEvent.clear(nameInput);
  expect(screen.queryAllByText('Duplicate name').length).toBe(0);

  userEvent.type(nameInput, 'abc{space}');
  expect(screen.queryAllByText('Invalid name').length).toBe(1);

  // Test hitting enter w/ an invalid name
  userEvent.type(nameInput, '{enter}');
  expect(mockHandler).not.toBeCalled();

  userEvent.type(nameInput, '{backspace}');
  expect(screen.queryAllByText('Invalid name').length).toBe(0);

  const confirmButton = screen.getByLabelText('Confirm');
  userEvent.click(confirmButton);
  expect(mockHandler).toBeCalledWith([
    expect.objectContaining({ ...NESTED_COLUMN_HEADER_GROUPS[1], name: 'abc' }),
    expect.objectContaining({
      ...NESTED_COLUMN_HEADER_GROUPS[0],
      children: NESTED_COLUMN_HEADER_GROUPS[0].children
        .slice(0, 2)
        .concat(['abc']),
    }),
  ]);

  mockHandler.mockReset();
  userEvent.click(screen.getAllByLabelText('Edit')[0]);
  nameInput = screen.getByDisplayValue(COLUMN_HEADER_GROUPS[0].name);
  userEvent.type(nameInput, 'abcd{enter}');
  expect(mockHandler).toBeCalledWith([
    // Didn't rerender, so the nested column will keep its original name for mock calls
    expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[1]),
    expect.objectContaining({
      ...NESTED_COLUMN_HEADER_GROUPS[0],
      name: 'abcd',
    }),
  ]);
});

test('Delete group', () => {
  const mockHandler = jest.fn();
  const { rerender } = render(
    <BuilderWithNestedGroups onColumnHeaderGroupChanged={mockHandler} />
  );

  userEvent.click(screen.getAllByLabelText('Delete group')[1]); // Nested group delete

  expect(mockHandler).toBeCalledWith([
    expect.objectContaining({
      ...COLUMN_HEADER_GROUPS[0],
      children: COLUMN_HEADER_GROUPS[0].children.concat(
        COLUMN_HEADER_GROUPS[1].children
      ),
    }),
  ]);

  const newGroups = mockHandler.mock.calls[0][0];
  mockHandler.mockReset();
  rerender(
    <BuilderWithNestedGroups
      columnHeaderGroups={newGroups}
      onColumnHeaderGroupChanged={mockHandler}
    />
  );

  userEvent.click(screen.getAllByLabelText('Delete group')[0]);

  expect(mockHandler).toBeCalledWith([]);
});

test('Change group color', () => {
  const mockHandler = jest.fn();
  const getColorButton = () => screen.getAllByLabelText('Set color')[0];
  render(<BuilderWithGroups onColumnHeaderGroupChanged={mockHandler} />);

  userEvent.click(getColorButton());
  const colorInput = screen.getAllByLabelText('Color input')[0];
  expect(colorInput).toHaveFocus();

  // Color inputs can't be properly input by RTL
  // https://github.com/testing-library/user-event/issues/423#issuecomment-669368863
  fireEvent.input(colorInput, { target: { value: '#123456' } });

  expect(mockHandler).toBeCalledWith([
    expect.objectContaining({
      ...COLUMN_HEADER_GROUPS[0],
      color: '#123456',
    }),
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

test('Toggles selected visibility', () => {
  const mockHandler = jest.fn();
  const { rerender } = render(
    <BuilderWithGroups onColumnVisibilityChanged={mockHandler} />
  );

  selectItems([1, 11]); // GroupOneAndThree, last column
  const indexes = [1, 3, 9]; // model indexes of selected

  const hideButton = screen.getByText('Hide Selected');
  userEvent.click(hideButton);
  expect(mockHandler).toBeCalledWith(indexes, false);

  rerender(
    <BuilderWithGroups
      onColumnVisibilityChanged={mockHandler}
      userColumnWidths={new Map(indexes.map(i => [i, 0]))}
    />
  );
  const showButton = screen.getByText('Show Selected');
  userEvent.click(showButton);
  expect(mockHandler).toBeCalledWith(indexes, true);
});

test('Toggles individual visibility', () => {
  const mockHandler = jest.fn();
  render(<BuilderWithGroups onColumnVisibilityChanged={mockHandler} />);

  const hideButtons = screen.getAllByLabelText('Toggle visibility');
  userEvent.click(hideButtons[0]);
  expect(mockHandler).toBeCalledWith([0], false);
  userEvent.click(hideButtons[1]); // Hide group
  expect(mockHandler).toBeCalledWith([1, 3], false);
});

test('Resets state', () => {
  const mockGroupHandler = jest.fn();
  const mockMoveHandler = jest.fn();
  const mockVisibilityHandler = jest.fn();
  const model = makeModelWithGroups();
  render(
    <Builder
      model={model}
      onColumnHeaderGroupChanged={mockGroupHandler}
      onColumnVisibilityChanged={mockVisibilityHandler}
      onMovedColumnsChanged={mockMoveHandler}
    />
  );

  const resetBtn = screen.getByText('Reset');
  userEvent.click(resetBtn);

  expect(mockGroupHandler).toBeCalledWith(model.initialColumnHeaderGroups);
  expect(mockMoveHandler).toBeCalledWith(model.initialMovedColumns);
  expect(mockVisibilityHandler).toBeCalledWith(
    Array(COLUMNS.length)
      .fill(0)
      .map((_, i) => i),
    true
  );
});

test('Sets drag item display string on multi-select', () => {
  // This is a hacky test and calls the method directly
  // RTL can't simulate drag and drop (in jsdom at least)
  // So this is the best option for now
  const builder = React.createRef<VisibilityOrderingBuilder>();
  render(<Builder builderRef={builder} />);

  const items = flattenTree(
    getTreeItems(COLUMNS, [], [], new Map(), [
      `${COLUMN_PREFIX}0`,
      `${COLUMN_PREFIX}1`,
    ])
  );

  const itemRef = React.createRef<HTMLDivElement>();
  selectItems([0, 1]);

  assertNotNull(builder.current);

  const { getByText } = render(
    builder.current.renderItem({
      value: 'Test',
      clone: true,
      item: items[0],
      handleProps: {},
      ref: itemRef,
    })
  );

  expect(getByText(`${COLUMN_PREFIX}0, ${COLUMN_PREFIX}1`)).toBeDefined();
});

// The cases for dragging are tested in depth in VisibilityOrderingBuilderUtils.test.ts
// This test simply makes sure the change handlers are called when drag happens
test('On drag start/end', () => {
  // This is a hacky test and calls the method directly
  // RTL can't simulate drag and drop (in jsdom at least)
  // So this is the best option for now
  const builder = React.createRef<VisibilityOrderingBuilder>();
  const mockGroupHandler = jest.fn();
  const mockMoveHandler = jest.fn();
  render(
    <Builder
      builderRef={builder}
      onColumnHeaderGroupChanged={mockGroupHandler}
      onMovedColumnsChanged={mockMoveHandler}
    />
  );

  const items = flattenTree(
    getTreeItems(COLUMNS, [], [], new Map(), [`${COLUMN_PREFIX}0`])
  );

  builder.current?.handleDragStart(`${COLUMN_PREFIX}0`);
  expectSelection([0]);

  // This hits the path where the item is already selected in dragStart
  builder.current?.handleDragStart(`${COLUMN_PREFIX}0`);
  expectSelection([0]);

  builder.current?.handleDragEnd(items[0], items[1]);
  expect(mockGroupHandler).toBeCalledWith([]);
  expect(mockMoveHandler).toBeCalledWith([{ from: 0, to: 1 }]);
});
