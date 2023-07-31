import dh from '@deephaven/jsapi-shim';
import type { ColumnGroup } from '@deephaven/jsapi-types';
import IrisGridTestUtils from '../../IrisGridTestUtils';
import {
  moveItemsFromDrop,
  moveToGroup,
} from './VisibilityOrderingBuilderUtils';
import {
  FlattenedIrisGridTreeItem,
  flattenTree,
  getProjection,
  getTreeItems,
} from './sortable-tree/utilities';

const irisGridTestUtils = new IrisGridTestUtils(dh);
const COLUMN_PREFIX = 'TestColumn';
const GROUP_PREFIX = 'TestGroup';
const COLUMNS = irisGridTestUtils.makeColumns(10, COLUMN_PREFIX);
const SINGLE_HEADER_GROUPS: ColumnGroup[] = [
  {
    name: `${GROUP_PREFIX}OneAndThree`,
    children: [COLUMNS[1].name, COLUMNS[3].name],
  },
];

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

function makeTreeItems(groups: ColumnGroup[] = []) {
  const model = irisGridTestUtils.makeModel(
    irisGridTestUtils.makeTable({
      columns: COLUMNS,
      layoutHints: { columnGroups: groups },
    })
  );

  const items = getTreeItems(
    COLUMNS,
    model.initialMovedColumns,
    model.initialColumnHeaderGroups,
    new Map(),
    []
  );

  return {
    items,
    flattenedItems: flattenTree(items),
    movedColumns: model.initialMovedColumns,
    groups: model.initialColumnHeaderGroups,
  };
}

function getItem(
  items: FlattenedIrisGridTreeItem[],
  name: string
): FlattenedIrisGridTreeItem {
  const item = items.find(({ id }) => id === name);
  if (!item) {
    throw new Error(`Item not found: ${name}`);
  }

  return item;
}

function getProjectedItem(
  items: FlattenedIrisGridTreeItem[],
  activeId: string,
  overId: string,
  depth = 0
) {
  return {
    ...getItem(items, overId),
    parentId: getProjection(items, activeId, overId, depth * 30, 30).parentId,
  };
}

describe('Move to group', () => {
  test('Move an item into a group', () => {
    const { flattenedItems, groups } = makeTreeItems(COLUMN_HEADER_GROUPS);

    const moveItem = getItem(flattenedItems, COLUMNS[0].name);
    expect(moveToGroup(moveItem, groups[0].name, groups)).toEqual([
      expect.objectContaining({
        ...COLUMN_HEADER_GROUPS[0],
        children: COLUMN_HEADER_GROUPS[0].children.concat([moveItem.id]),
      }),
      expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
    ]);
  });

  test('Move a group into a group', () => {
    const { flattenedItems, groups } = makeTreeItems(COLUMN_HEADER_GROUPS);

    const moveItem = getItem(flattenedItems, groups[1].name);
    expect(moveToGroup(moveItem, groups[0].name, groups)).toEqual([
      expect.objectContaining({
        ...COLUMN_HEADER_GROUPS[0],
        children: COLUMN_HEADER_GROUPS[0].children.concat([moveItem.id]),
      }),
      expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
    ]);
  });

  test('Move a nested group out of its group', () => {
    const { flattenedItems, groups } = makeTreeItems(
      NESTED_COLUMN_HEADER_GROUPS
    );

    const moveItem = getItem(
      flattenedItems,
      NESTED_COLUMN_HEADER_GROUPS[1].name
    );
    expect(moveToGroup(moveItem, null, groups)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...COLUMN_HEADER_GROUPS[0],
          children: COLUMN_HEADER_GROUPS[0].children.filter(
            id => id !== moveItem.id
          ),
        }),
        expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
      ])
    );
  });

  test('Move an item out of a group', () => {
    const { flattenedItems, groups } = makeTreeItems(COLUMN_HEADER_GROUPS);

    const moveItem = getItem(flattenedItems, COLUMNS[1].name);
    expect(moveToGroup(moveItem, null, groups)).toEqual([
      expect.objectContaining({
        ...COLUMN_HEADER_GROUPS[0],
        children: COLUMN_HEADER_GROUPS[0].children.filter(
          name => name !== moveItem.id
        ),
      }),
      expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
    ]);
  });

  test('Move an item between groups', () => {
    const { flattenedItems, groups } = makeTreeItems(COLUMN_HEADER_GROUPS);

    const moveItem = getItem(flattenedItems, COLUMNS[1].name);
    expect(moveToGroup(moveItem, groups[1].name, groups)).toEqual([
      expect.objectContaining({
        ...COLUMN_HEADER_GROUPS[0],
        children: COLUMN_HEADER_GROUPS[0].children.filter(
          name => name !== moveItem.id
        ),
      }),
      expect.objectContaining({
        ...COLUMN_HEADER_GROUPS[1],
        children: COLUMN_HEADER_GROUPS[1].children.concat([moveItem.id]),
      }),
    ]);
  });

  test('Does not move an item to the group it is already in', () => {
    const { flattenedItems, groups } = makeTreeItems(COLUMN_HEADER_GROUPS);

    const moveItem = getItem(flattenedItems, COLUMNS[1].name);
    expect(moveToGroup(moveItem, moveItem.parentId, groups)).toEqual([
      expect.objectContaining(COLUMN_HEADER_GROUPS[0]),
      expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
    ]);
  });

  test('Move the last item out of a group', () => {
    const { flattenedItems, groups } = makeTreeItems(COLUMN_HEADER_GROUPS);

    const firstItem = getItem(flattenedItems, COLUMNS[1].name);
    const firstMoveGroups = moveToGroup(firstItem, null, groups);

    const moveItem = getItem(flattenedItems, COLUMNS[3].name);
    expect(moveToGroup(moveItem, null, firstMoveGroups)).toEqual([
      expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
    ]);
  });

  test('Move the last item out of a nested group', () => {
    jest.setTimeout(5000); // If this test breaks, it can be in an infinite loop
    const { flattenedItems, groups } = makeTreeItems(
      NESTED_COLUMN_HEADER_GROUPS
    );

    let item = getItem(flattenedItems, COLUMNS[1].name);
    let moveGroups = moveToGroup(item, null, groups);
    item = getItem(flattenedItems, COLUMNS[3].name);
    moveGroups = moveToGroup(item, null, moveGroups);
    item = getItem(flattenedItems, COLUMNS[2].name);
    moveGroups = moveToGroup(item, null, moveGroups);
    item = getItem(flattenedItems, COLUMNS[4].name);
    expect(moveToGroup(item, null, moveGroups)).toEqual([]);
  });
});

describe('Move items from drop', () => {
  test('Move an item into a group from above', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(SINGLE_HEADER_GROUPS);
    const fromItem = getItem(flattenedItems, COLUMNS[0].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      groups[0].children[0]
    );
    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [
        expect.objectContaining({
          ...SINGLE_HEADER_GROUPS[0],
          children: SINGLE_HEADER_GROUPS[0].children.concat([fromItem.id]),
        }),
      ],
      movedColumns: movedColumns.concat([{ from: 0, to: 1 }]),
    });
  });

  test('Drop an item on a group from above', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(SINGLE_HEADER_GROUPS);
    // Should move into the group at the top
    const fromItem = getItem(flattenedItems, COLUMNS[0].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      groups[0].name
    );
    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [
        expect.objectContaining({
          ...SINGLE_HEADER_GROUPS[0],
          children: SINGLE_HEADER_GROUPS[0].children.concat([fromItem.id]),
        }),
      ],
      movedColumns,
    });
  });

  test('Move an item into a group from below', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(SINGLE_HEADER_GROUPS);
    const fromItem = getItem(flattenedItems, COLUMNS[7].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      groups[0].children[0]
    );

    // Dragging onto first child of the group
    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [
        expect.objectContaining({
          ...SINGLE_HEADER_GROUPS[0],
          children: SINGLE_HEADER_GROUPS[0].children.concat([fromItem.id]),
        }),
      ],
      movedColumns: movedColumns.concat([{ from: 7, to: 1 }]),
    });
  });

  test('Drop an item on a group from below', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(SINGLE_HEADER_GROUPS);
    // Should move past the group
    const fromItem = getItem(flattenedItems, COLUMNS[7].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      groups[0].name
    );

    // Dragging onto first child of the group
    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups,
      movedColumns: movedColumns.concat([{ from: 7, to: 1 }]),
    });
  });

  test('Move the item below a group to the bottom of the group', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(SINGLE_HEADER_GROUPS);
    const fromItem = getItem(flattenedItems, COLUMNS[2].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      fromItem.id,
      1
    );

    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [
        expect.objectContaining({
          ...SINGLE_HEADER_GROUPS[0],
          children: SINGLE_HEADER_GROUPS[0].children.concat([fromItem.id]),
        }),
      ],
      movedColumns,
    });
  });

  test('Move the group directly below a group to the bottom of the group', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(COLUMN_HEADER_GROUPS);
    const fromItem = getItem(flattenedItems, COLUMN_HEADER_GROUPS[1].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      fromItem.id,
      1
    );

    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [
        expect.objectContaining({
          ...COLUMN_HEADER_GROUPS[0],
          children: COLUMN_HEADER_GROUPS[0].children.concat([fromItem.id]),
        }),
        expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
      ],
      movedColumns,
    });
  });

  test('Move a group onto a group from above', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(COLUMN_HEADER_GROUPS);
    const fromItem = getItem(flattenedItems, groups[0].name);
    const toItem = getProjectedItem(
      flattenedItems,
      fromItem.id,
      groups[1].name,
      1
    );

    expect(
      moveItemsFromDrop(
        fromItem,
        toItem,
        movedColumns,
        groups,
        flattenedItems,
        [fromItem],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [
        expect.objectContaining(COLUMN_HEADER_GROUPS[0]),
        expect.objectContaining({
          ...COLUMN_HEADER_GROUPS[1],
          children: COLUMN_HEADER_GROUPS[1].children.concat([
            COLUMN_HEADER_GROUPS[0].name,
          ]),
        }),
      ],
      movedColumns,
    });
  });

  test('Move multiple, disjoint items', () => {
    const { flattenedItems, groups, movedColumns } = makeTreeItems();
    const fromItemOne = getItem(flattenedItems, COLUMNS[6].name);
    const fromItemTwo = getItem(flattenedItems, COLUMNS[8].name);

    // Move from 6 and drop on 7. Should be below 7
    expect(
      moveItemsFromDrop(
        fromItemOne,
        getProjectedItem(flattenedItems, fromItemOne.id, COLUMNS[7].name),
        movedColumns,
        groups,
        flattenedItems,
        [fromItemOne, fromItemTwo],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [],
      movedColumns: movedColumns.concat([
        { from: 8, to: 7 },
        { from: [6, 7], to: 7 },
      ]),
    });

    // Move from 8 and drop on 7. Should be above 7
    expect(
      moveItemsFromDrop(
        fromItemTwo,
        getProjectedItem(flattenedItems, fromItemTwo.id, COLUMNS[7].name),
        movedColumns,
        groups,
        flattenedItems,
        [fromItemOne, fromItemTwo],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: [],
      movedColumns: movedColumns.concat([{ from: 8, to: 7 }]),
    });
  });

  test('Move multiple, disjoint items including a group', () => {
    const { flattenedItems, groups, movedColumns } =
      makeTreeItems(COLUMN_HEADER_GROUPS);
    let fromItemOne = getItem(flattenedItems, COLUMN_HEADER_GROUPS[0].name);
    let fromItemTwo = getItem(flattenedItems, COLUMNS[8].name);

    // Move from group 1 and drop on 2. Should be below 2 and in group 2
    expect(
      moveItemsFromDrop(
        fromItemOne,
        getProjectedItem(flattenedItems, fromItemOne.id, COLUMNS[2].name),
        movedColumns,
        groups,
        flattenedItems,
        [fromItemOne, fromItemTwo],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: expect.arrayContaining([
        expect.objectContaining(COLUMN_HEADER_GROUPS[0]),
        expect.objectContaining({
          ...COLUMN_HEADER_GROUPS[1],
          children: COLUMN_HEADER_GROUPS[1].children.concat([
            fromItemOne.id,
            fromItemTwo.id,
          ]),
        }),
      ]),
      movedColumns: movedColumns.concat([
        { from: 8, to: 3 },
        { from: [1, 3], to: 2 },
      ]),
    });

    // Move from 8 and drop on 4. Should be above 4 and in group 2
    expect(
      moveItemsFromDrop(
        fromItemTwo,
        getProjectedItem(flattenedItems, fromItemTwo.id, COLUMNS[4].name),
        movedColumns,
        groups,
        flattenedItems,
        [fromItemOne, fromItemTwo],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: expect.arrayContaining([
        expect.objectContaining(COLUMN_HEADER_GROUPS[0]),
        expect.objectContaining({
          ...COLUMN_HEADER_GROUPS[1],
          children: COLUMN_HEADER_GROUPS[1].children.concat([
            fromItemOne.id,
            fromItemTwo.id,
          ]),
        }),
      ]),
      movedColumns: movedColumns.concat([
        { from: 8, to: 3 },
        { from: [1, 3], to: 2 },
      ]),
    });

    // Move where group item needs to be moved up to the selection
    fromItemOne = getItem(flattenedItems, COLUMNS[0].name);
    fromItemTwo = getItem(flattenedItems, COLUMN_HEADER_GROUPS[1].name);
    expect(
      moveItemsFromDrop(
        fromItemTwo,
        getProjectedItem(flattenedItems, fromItemOne.id, COLUMNS[7].name),
        movedColumns,
        groups,
        flattenedItems,
        [fromItemOne, fromItemTwo],
        0,
        COLUMNS.length - 1
      )
    ).toEqual({
      groups: expect.arrayContaining([
        expect.objectContaining(COLUMN_HEADER_GROUPS[0]),
        expect.objectContaining(COLUMN_HEADER_GROUPS[1]),
      ]),
      movedColumns: movedColumns.concat([
        { from: [3, 4], to: 1 },
        { from: [0, 2], to: 5 }, // [5, 6, 7] after move. Below original 7, above 8
      ]),
    });
  });
});
