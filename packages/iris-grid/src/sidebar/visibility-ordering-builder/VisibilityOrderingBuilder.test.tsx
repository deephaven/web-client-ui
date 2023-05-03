import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridUtils } from '@deephaven/grid';
import type { MoveOperation } from '@deephaven/grid';
import { assertNotNull, TestUtils } from '@deephaven/utils';
import dh from '@deephaven/jsapi-shim';
import { ColumnGroup } from '@deephaven/jsapi-types';
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
  hiddenColumns = [],
  movedColumns = model.initialMovedColumns,
  columnHeaderGroups = model.columnHeaderGroups,
  onColumnHeaderGroupChanged = jest.fn(),
  onColumnVisibilityChanged = jest.fn(),
  onMovedColumnsChanged = jest.fn(),
  onReset = jest.fn(),
  builderRef = React.createRef(),
}: Partial<VisibilityOrderingBuilder['props']> & {
  builderRef?: React.RefObject<VisibilityOrderingBuilder>;
} = {}) {
  return (
    <VisibilityOrderingBuilder
      model={model}
      hiddenColumns={hiddenColumns}
      movedColumns={movedColumns}
      columnHeaderGroups={columnHeaderGroups}
      onColumnHeaderGroupChanged={onColumnHeaderGroupChanged}
      onColumnVisibilityChanged={onColumnVisibilityChanged}
      onMovedColumnsChanged={onMovedColumnsChanged}
      onReset={onReset}
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
    dh,
    IrisGridTestUtils.makeTable({ columns: COLUMNS })
  );
}

function makeModelWithGroups(groups = COLUMN_HEADER_GROUPS) {
  return IrisGridTestUtils.makeModel(
    dh,
    IrisGridTestUtils.makeTable({
      columns: COLUMNS,
      layoutHints: { columnGroups: groups },
    })
  );
}

async function clickItem(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  addToExisting = false
) {
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  if (addToExisting) {
    await TestUtils.controlClick(user, elements[index]);
  } else {
    await user.click(elements[index]);
  }
}

async function selectItems(
  user: ReturnType<typeof userEvent.setup>,
  indexes: number[]
) {
  await clearSelection(user);
  for (let i = 0; i < indexes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await clickItem(user, indexes[i], true);
  }
}

async function clearSelection(user: ReturnType<typeof userEvent.setup>) {
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  await clickItem(user, 0);
  if (elements[0].closest(`.${SELECTED_CLASS}`) != null) {
    await clickItem(user, 0);
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
    dh,
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
    dh,
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

test('Select and deselects items', async () => {
  const user = userEvent.setup({ delay: null });
  render(<Builder />);
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });
  await clickItem(user, 0);
  expectSelection([0]);
  await clickItem(user, 1);
  expectSelection([1]);

  await TestUtils.controlClick(user, elements[2]);
  expectSelection([1, 2]);

  await TestUtils.shiftClick(user, elements[4]);
  expectSelection([1, 2, 3, 4]);

  await TestUtils.controlClick(user, elements[2]);
  expectSelection([1, 3, 4]);

  await clickItem(user, 2);
  expectSelection([2]);
  await TestUtils.controlClick(user, elements[3]);
  expectSelection([2, 3]);
  await clickItem(user, 3);
  expectSelection([3]);
});

test('Select and deselects groups', async () => {
  const user = userEvent.setup({ delay: null });
  render(<BuilderWithGroups />);
  const elements = screen.getAllByText(ALL_PREFIX, { exact: false });

  await clickItem(user, 1); // Select group
  expectSelection([1, 2, 3]);

  await clickItem(user, 4); // Select the other group
  expectSelection([4, 5, 6]);

  await TestUtils.controlClick(user, elements[7]); // Add element to selection
  expectSelection([4, 5, 6, 7]);

  await TestUtils.shiftClick(user, elements[9]); // Add 2 more to selection via range select
  expectSelection([4, 5, 6, 7, 8, 9]);

  await TestUtils.controlClick(user, elements[1]); // Add 1st group to selection
  expectSelection([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  await TestUtils.controlClick(user, elements[1]); // Remove 1st group from selection
  expectSelection([4, 5, 6, 7, 8, 9]);

  await TestUtils.controlClick(user, elements[5]); // Remove child of 2nd group from selection
  expectSelection([6, 7, 8, 9]);

  await clickItem(user, 2); // Select item in 1st group alone
  expectSelection([2]);
});

test('Moves items up with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const getUpButton = () => screen.getByLabelText('Move selection up');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  await selectItems(user, [1]);
  // Must get after an item is selected
  // Disabled buttons render in a wrapper and the element changes after selection
  await user.click(getUpButton());
  let newMoves = [{ from: 1, to: 0 }];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Item is at top, move up should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getUpButton());
  expect(mockHandler).not.toBeCalled();

  await clearSelection(user);

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  await selectItems(user, [1, 3]);
  await user.click(getUpButton());
  newMoves = [
    { from: 1, to: 0 },
    { from: 3, to: 2 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  await user.click(getUpButton());
  newMoves = newMoves.concat({ from: 2, to: 1 });
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Both at the top now
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getUpButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups up with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const getUpButton = () => screen.getByLabelText('Move selection up');
  const model = makeModelWithGroups();
  const { rerender } = render(
    <BuilderWithGroups model={model} onMovedColumnsChanged={mockHandler} />
  );

  await selectItems(user, [1]);
  await user.click(getUpButton());
  const newMoves: MoveOperation[] = model.initialMovedColumns.concat([
    { from: [1, 2], to: 0 },
  ]);
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Item is at top, move up should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getUpButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves items in and out of groups with up button', async () => {
  const user = userEvent.setup({ delay: null });
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

  await selectItems(user, [2]); // First child in outer group
  await user.click(getUpButton());
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

  await selectItems(user, [7]); // First item after the nested groups, col5
  await user.click(getUpButton());
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
  await user.click(getUpButton());
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

test('Moves items down with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const getDownButton = () => screen.getByLabelText('Move selection down');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  await clickItem(user, 1);
  await user.click(getDownButton());
  let newMoves = [{ from: 1, to: 2 }];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  await user.click(getDownButton());
  newMoves = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Multi-select
  rerender(<Builder onMovedColumnsChanged={mockHandler} />);

  await selectItems(user, [6, 8]);
  await user.click(getDownButton());
  newMoves = [
    { from: 8, to: 9 },
    { from: 6, to: 7 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  await user.click(getDownButton());
  newMoves = newMoves.concat({ from: 7, to: 8 });
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  mockHandler.mockReset();
  // Both at bottom
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  await user.click(getDownButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups down with button', async () => {
  const user = userEvent.setup({ delay: null });
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

  await selectItems(user, [8]); // 2nd group, 1 item above the bottom
  await user.click(getDownButton());
  const newMoves: MoveOperation[] = movedColumns.concat([
    { from: [7, 8], to: 8 },
  ]);
  expect(mockHandler).toBeCalledWith(newMoves, undefined);

  // Item is at bottom, move down should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getDownButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves items in and out of groups with down button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockMoveHandler = jest.fn();
  const mockGroupHandler = jest.fn() as jest.MockedFunction<
    VisibilityOrderingBuilder['props']['onColumnHeaderGroupChanged']
  >;
  const getDownButton = () => screen.getByLabelText('Move selection down');
  let model = makeModelWithGroups(NESTED_COLUMN_HEADER_GROUPS);
  const { rerender } = render(
    <BuilderWithGroups
      model={model}
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
    />
  );

  await selectItems(user, [0]); // First item above groups
  await user.click(getDownButton());
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

  await selectItems(user, [6]); // Last item of the nested groups, col4
  await user.click(getDownButton());
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
      model={model}
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
      columnHeaderGroups={model.columnHeaderGroups}
    />
  );
  mockGroupHandler.mockReset();
  await user.click(getDownButton());
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

  model = makeModelWithGroups(COLUMN_HEADER_GROUPS);
  rerender(
    <BuilderWithGroups
      model={model}
      onMovedColumnsChanged={mockMoveHandler}
      onColumnHeaderGroupChanged={mockGroupHandler}
      // Move 1st group to the bottom
      movedColumns={model.initialMovedColumns.concat([{ from: [1, 2], to: 8 }])}
    />
  );
  mockGroupHandler.mockReset();

  await selectItems(user, [11]); // Last item. In the 1st group and at the bottom
  await user.click(getDownButton());
  expect(mockMoveHandler).not.toBeCalled();
  expect(mockGroupHandler).toBeCalledWith([
    expect.objectContaining({
      ...COLUMN_HEADER_GROUPS[0],
      children: COLUMN_HEADER_GROUPS[0].children.slice(0, -1),
    }),
    expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
  ]);
});

test('Moves items to top with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn((_, cb) => cb());
  const getTopButton = () => screen.getByLabelText('Move selection to top');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  await selectItems(user, [1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  await user.click(getTopButton());
  let newMoves = [{ from: 1, to: 0 }];
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  // Item is at top, move to top should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getTopButton());
  expect(mockHandler).not.toBeCalled();

  await clearSelection(user);

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  await selectItems(user, [0, 2, 4]);
  await user.click(getTopButton());
  newMoves = [
    { from: 2, to: 1 },
    { from: 4, to: 2 },
  ];
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getTopButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups to top with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn((_, cb) => cb());
  const getTopButton = () => screen.getByLabelText('Move selection to top');
  const model = makeModelWithGroups();
  const { rerender } = render(
    <BuilderWithGroups model={model} onMovedColumnsChanged={mockHandler} />
  );

  await selectItems(user, [1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  await user.click(getTopButton());
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
  await user.click(getTopButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves items to bottom with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn((_, cb) => cb());
  const getBottomButton = () =>
    screen.getByLabelText('Move selection to bottom');
  const { rerender } = render(<Builder onMovedColumnsChanged={mockHandler} />);

  await selectItems(user, [1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  await user.click(getBottomButton());
  let newMoves = [{ from: 1, to: 9 }];
  expect(mockHandler).toBeCalledWith(newMoves, expect.anything());

  // Item is at bottom, move to bottom should not generate new moves
  rerender(
    <Builder onMovedColumnsChanged={mockHandler} movedColumns={newMoves} />
  );
  mockHandler.mockReset();
  await user.click(getBottomButton());
  expect(mockHandler).not.toBeCalled();

  await clearSelection(user);

  // Multi select
  rerender(<Builder onMovedColumnsChanged={mockHandler} movedColumns={[]} />);
  await selectItems(user, [0, 2, 4, 9]);
  await user.click(getBottomButton());
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
  await user.click(getBottomButton());
  expect(mockHandler).not.toBeCalled();
});

test('Moves groups to bottom with button', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn((_, cb) => cb());
  const getBottomButton = () =>
    screen.getByLabelText('Move selection to bottom');
  const model = makeModelWithGroups();
  const { rerender } = render(
    <BuilderWithGroups model={model} onMovedColumnsChanged={mockHandler} />
  );

  await selectItems(user, [1]);
  // Must get after an item is selected. Disabled buttons render in a wrapper
  await user.click(getBottomButton());
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
  await user.click(getBottomButton());
  expect(mockHandler).not.toBeCalled();
});

test('Sorts items', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const { rerender } = render(
    <BuilderWithGroups onMovedColumnsChanged={mockHandler} />
  );
  const sortDescendingBtn = screen.getByLabelText('Sort descending');

  await user.click(sortDescendingBtn);
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
  await user.click(sortAscendingBtn);
  // No idea why this is a prefer destructuring issue
  // eslint-disable-next-line prefer-destructuring
  movedColumns = mockHandler.mock.calls[0][0];
  expect(GridUtils.getVisibleIndexes(modelIndexes, movedColumns)).toEqual(
    visibleIndexes
  );
});

test('Creates groups', async () => {
  const user = userEvent.setup({ delay: null });
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

  await selectItems(user, [1, 3]);

  const createGroupBtn = screen.getByText('Group');
  await user.click(createGroupBtn);

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
  await user.click(cancelButton);
  expect(mockGroupHandler).toBeCalledWith([]);
  expect(mockMoveHandler).not.toBeCalled();
});

test('Only allows 1 new group at a time', async () => {
  const user = userEvent.setup({ delay: null });
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

  await selectItems(user, [2, 3]);
  const groupObject = {
    children: [`${COLUMN_PREFIX}2`, `${COLUMN_PREFIX}3`],
    name: expect.stringContaining(`${ColumnHeaderGroup.NEW_GROUP_PREFIX}`),
  };

  const createGroupBtn = screen.getByText('Group');
  await user.click(createGroupBtn);
  expect(mockGroupHandler).toBeCalledWith([
    expect.objectContaining(groupObject),
  ]);

  createGroupBtn.focus();
  expect(screen.queryAllByText('Invalid name').length).toBe(1);
});

test('Shows validation error for new group on blur when never typed in', async () => {
  const user = userEvent.setup({ delay: null });

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

  expect(screen.queryAllByText('Invalid name').length).toBe(0);

  await selectItems(user, [2]);
  expect(screen.queryAllByText('Invalid name').length).toBe(1);
});

test('Search columns', async () => {
  const user = userEvent.setup({ delay: null });

  const model = makeModelWithGroups([
    ...COLUMN_HEADER_GROUPS,
    {
      name: `${ColumnHeaderGroup.NEW_GROUP_PREFIX}Test`,
      children: [COLUMNS[9].name],
    },
  ]);

  render(<BuilderWithGroups model={model} />);

  const searchInput = screen.getByPlaceholderText('Search');

  await user.type(searchInput, GROUP_PREFIX);
  act(() => {
    jest.advanceTimersByTime(500); // Advance past debounce timeout.
  }); // Not sure why only this call needs act to silence the test warnings

  // 1 is first group, 2 and 3 are children. 4 is 2nd group, 5 and 6 are children
  expectSelection([1, 2, 3, 4, 5, 6]);

  await user.type(searchInput, 'One');
  jest.advanceTimersByTime(500);
  expectSelection([1, 2, 3]);

  await user.clear(searchInput);
  jest.advanceTimersByTime(500);
  expectSelection([]);

  await user.type(searchInput, 'asdf');
  jest.advanceTimersByTime(500);
  expectSelection([]);

  await user.clear(searchInput);
  jest.advanceTimersByTime(500);
  await user.type(searchInput, ColumnHeaderGroup.NEW_GROUP_PREFIX);
  jest.advanceTimersByTime(500);
  expectSelection([]);
});

test('Edit group name', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const getEditButton = () => screen.getAllByLabelText('Edit')[1]; // Edit the nested group
  const originalName = NESTED_COLUMN_HEADER_GROUPS[1].name;
  render(<BuilderWithNestedGroups onColumnHeaderGroupChanged={mockHandler} />);

  await user.click(getEditButton());

  let nameInput = screen.getByDisplayValue(originalName);
  expect(nameInput).toHaveFocus();
  await user.type(nameInput, 'abc');

  const cancelButton = screen.getByLabelText('Cancel');
  await user.click(cancelButton);
  expect(mockHandler).toHaveBeenCalledTimes(0);

  await user.click(getEditButton());
  nameInput = screen.getByDisplayValue(originalName);
  await user.type(nameInput, 'abc{Escape}');
  expect(mockHandler).toHaveBeenCalledTimes(0);

  await user.click(getEditButton());

  nameInput = screen.getByDisplayValue(originalName);
  await user.clear(nameInput);
  await user.type(nameInput, NESTED_COLUMN_HEADER_GROUPS[0].name);
  expect(screen.queryAllByText('Duplicate name').length).toBe(1);

  await user.clear(nameInput);
  expect(screen.queryAllByText('Duplicate name').length).toBe(0);

  await user.type(nameInput, 'abc ');
  expect(screen.queryAllByText('Invalid name').length).toBe(1);

  // Test hitting enter w/ an invalid name
  await user.type(nameInput, '{Enter}');
  expect(mockHandler).not.toBeCalled();

  await user.type(nameInput, '{Backspace}');
  expect(screen.queryAllByText('Invalid name').length).toBe(0);

  const confirmButton = screen.getByLabelText('Confirm');
  await user.click(confirmButton);
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
  await user.click(screen.getAllByLabelText('Edit')[0]);
  nameInput = screen.getByDisplayValue(COLUMN_HEADER_GROUPS[0].name);
  await user.clear(nameInput);
  await user.type(nameInput, 'abcd{Enter}');
  expect(mockHandler).toBeCalledWith([
    // Didn't rerender, so the nested column will keep its original name for mock calls
    expect.objectContaining(NESTED_COLUMN_HEADER_GROUPS[1]),
    expect.objectContaining({
      ...NESTED_COLUMN_HEADER_GROUPS[0],
      name: 'abcd',
    }),
  ]);
});

test('Delete group', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const { rerender } = render(
    <BuilderWithNestedGroups onColumnHeaderGroupChanged={mockHandler} />
  );

  await user.click(screen.getAllByLabelText('Delete group')[1]); // Nested group delete

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

  await user.click(screen.getAllByLabelText('Delete group')[0]);

  expect(mockHandler).toBeCalledWith([]);
});

test('Change group color', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const getColorButton = () => screen.getAllByLabelText('Set color')[0];
  render(<BuilderWithGroups onColumnHeaderGroupChanged={mockHandler} />);

  await user.click(getColorButton());
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

test('Toggles all visibility', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const { rerender } = render(
    <Builder onColumnVisibilityChanged={mockHandler} />
  );

  const indexes = Array(COLUMNS.length)
    .fill(0)
    .map((_, i) => i);

  const hideButton = screen.getByText('Hide All');
  await user.click(hideButton);
  expect(mockHandler).toBeCalledWith(indexes, false);

  rerender(
    <Builder onColumnVisibilityChanged={mockHandler} hiddenColumns={indexes} />
  );
  const showButton = screen.getByText('Show All');
  await user.click(showButton);
  expect(mockHandler).toBeCalledWith(indexes, true);
});

test('Toggles selected visibility', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  const { rerender } = render(
    <BuilderWithGroups onColumnVisibilityChanged={mockHandler} />
  );

  await selectItems(user, [1, 11]); // GroupOneAndThree, last column
  const indexes = [1, 3, 9]; // model indexes of selected

  const hideButton = screen.getByText('Hide Selected');
  await user.click(hideButton);
  expect(mockHandler).toBeCalledWith(indexes, false);

  rerender(
    <BuilderWithGroups
      onColumnVisibilityChanged={mockHandler}
      hiddenColumns={indexes}
    />
  );
  const showButton = screen.getByText('Show Selected');
  await user.click(showButton);
  expect(mockHandler).toBeCalledWith(indexes, true);
});

test('Toggles individual visibility', async () => {
  const user = userEvent.setup({ delay: null });
  const mockHandler = jest.fn();
  render(<BuilderWithGroups onColumnVisibilityChanged={mockHandler} />);

  const hideButtons = screen.getAllByLabelText('Toggle visibility');
  await user.click(hideButtons[0]);
  expect(mockHandler).toBeCalledWith([0], false);
  await user.click(hideButtons[1]); // Hide group
  expect(mockHandler).toBeCalledWith([1, 3], false);
});

test('Resets state', async () => {
  const user = userEvent.setup({ delay: null });
  const mockReset = jest.fn();
  const model = makeModelWithGroups();
  render(<Builder model={model} onReset={mockReset} />);

  const resetBtn = screen.getByText('Reset');
  await user.click(resetBtn);

  expect(mockReset).toBeCalledTimes(1);
});

test('Sets drag item display string on multi-select', async () => {
  // This is a hacky test and calls the method directly
  // RTL can't simulate drag and drop (in jsdom at least)
  // So this is the best option for now
  const user = userEvent.setup({ delay: null });
  const builder = React.createRef<VisibilityOrderingBuilder>();
  render(<Builder builderRef={builder} />);

  const items = flattenTree(
    getTreeItems(
      COLUMNS,
      [],
      [],
      [],
      [`${COLUMN_PREFIX}0`, `${COLUMN_PREFIX}1`]
    )
  );

  const itemRef = React.createRef<HTMLDivElement>();
  await selectItems(user, [0, 1]);

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
    getTreeItems(COLUMNS, [], [], [], [`${COLUMN_PREFIX}0`])
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
