import { arrayMove } from '@dnd-kit/sortable';
import type { dh } from '@deephaven/jsapi-types';
import {
  GridRange,
  GridUtils,
  type VisibleIndex,
  type ModelIndex,
  type MoveOperation,
} from '@deephaven/grid';
import { assertNotNull } from '@deephaven/utils';
import type ColumnHeaderGroup from '../../../ColumnHeaderGroup';
import {
  isFlattenedTreeItem,
  type ReadonlyTreeItems,
  type FlattenedItem,
  type TreeItem,
} from './types';

/**
 * Gets the depth of an item dragged with a given x-axis offset
 *
 * @param offset x-axis offset of the dragging item
 * @param indentationWidth Width of indentation for each depth
 * @returns The drag depth for the given offset
 */
function getDragDepth(offset: number, indentationWidth: number): number {
  return Math.round(offset / indentationWidth);
}

export interface IrisGridTreeItemData {
  modelIndex: number | number[];
  visibleIndex: number | [number, number];
  isVisible: boolean;
  group?: ColumnHeaderGroup;
}

export type IrisGridTreeItem = TreeItem<IrisGridTreeItemData>;

export type FlattenedIrisGridTreeItem = FlattenedItem<IrisGridTreeItemData>;

function getTreeItem(
  nameToIndexes: Map<
    string,
    { visibleIndex: VisibleIndex; modelIndex: ModelIndex }
  >,
  movedColumns: readonly MoveOperation[],
  columnHeaderGroupMap: Map<string, ColumnHeaderGroup>,
  name: string,
  hiddenColumnSet: Set<ModelIndex>,
  selectedItems: Set<string>,
  showHiddenColumns: boolean
): IrisGridTreeItem {
  const { modelIndex, visibleIndex } = nameToIndexes.get(name) ?? {};
  if (modelIndex === undefined || visibleIndex === undefined) {
    const group = columnHeaderGroupMap.get(name);

    if (group == null) {
      throw new Error(`Column or header group not found: ${name}`);
    }

    const modelIndexes = group.childIndexes.flat();

    return {
      id: name,
      selected: selectedItems.has(name),
      children: group.children
        .filter(
          (_, i) =>
            showHiddenColumns || !hiddenColumnSet.has(group.childIndexes[i])
        )
        .map(childName =>
          getTreeItem(
            nameToIndexes,
            movedColumns,
            columnHeaderGroupMap,
            childName,
            hiddenColumnSet,
            selectedItems,
            showHiddenColumns
          )
        )
        .sort((a, b) => {
          const aVal = Array.isArray(a.data.visibleIndex)
            ? a.data.visibleIndex[0]
            : a.data.visibleIndex;
          const bVal = Array.isArray(b.data.visibleIndex)
            ? b.data.visibleIndex[0]
            : b.data.visibleIndex;
          return aVal - bVal;
        }),
      data: {
        modelIndex: modelIndexes,
        visibleIndex: group.getVisibleRange(movedColumns),
        group,
        isVisible: modelIndexes.some(index => !hiddenColumnSet.has(index)),
      },
    };
  }

  return {
    id: name,
    children: [],
    selected: selectedItems.has(name),
    data: {
      modelIndex,
      visibleIndex,
      isVisible: !hiddenColumnSet.has(modelIndex),
    },
  };
}

export function getTreeItems(
  columns: readonly dh.Column[],
  movedColumns: readonly MoveOperation[],
  columnHeaderGroups: readonly ColumnHeaderGroup[],
  hiddenColumns: readonly ModelIndex[],
  selectedItems: readonly string[],
  showHiddenColumns: boolean
): IrisGridTreeItem[] {
  const items: IrisGridTreeItem[] = [];
  const selectedItemsSet = new Set(selectedItems);
  const groupMap = new Map(
    columnHeaderGroups.map(group => [group.name, group])
  );
  const hiddenColumnSet = new Set(hiddenColumns);

  let visibleIndex = 0;
  const modelRanges = GridRange.boundedRanges(
    GridUtils.getModelRange(
      GridRange.makeNormalized(0, 0, columns.length - 1, 0),
      movedColumns
    ),
    columns.length,
    1
  );
  const mapEntries = modelRanges.flatMap(range => {
    const { startColumn, endColumn } = range;
    const rangeLength = endColumn - startColumn + 1;
    const entries = new Array(rangeLength)
      .fill(0)
      .map((_, i) => [visibleIndex + i, startColumn + i] as const);
    visibleIndex += rangeLength;
    return entries;
  });
  const visibleToModelMap = new Map<VisibleIndex, ModelIndex>(mapEntries);

  const nameToIndexes = new Map<
    string,
    { visibleIndex: VisibleIndex; modelIndex: ModelIndex }
  >(
    visibleToModelMap
      .entries()
      .map(([v, m]) => [columns[m].name, { visibleIndex: v, modelIndex: m }])
  );

  visibleIndex = 0;
  while (visibleIndex < columns.length) {
    const modelIndex = visibleToModelMap.get(visibleIndex);
    assertNotNull(modelIndex);
    const columnName = columns[modelIndex].name;

    let group = columnHeaderGroups.find(({ children }) =>
      children.includes(columnName)
    );
    while (group !== undefined && group.parent !== undefined) {
      group = groupMap.get(group.parent);
    }

    const item = getTreeItem(
      nameToIndexes,
      movedColumns,
      groupMap,
      group ? group.name : columnName,
      hiddenColumnSet,
      selectedItemsSet,
      showHiddenColumns
    );

    items.push(item);

    if (Array.isArray(item.data.visibleIndex)) {
      visibleIndex += item.data.visibleIndex[1] - item.data.visibleIndex[0] + 1;
    } else {
      visibleIndex += 1;
    }
  }

  return items;
}

/**
 * Gets the projected drop position and depth of the dragged item
 *
 * @param items List of flattened items
 * @param activeId ID of the actively dragged item
 * @param overId ID of the item currently being dragged over
 * @param dragOffset The x-axis offset of the dragged item
 * @param indentationWidth The width for each level of the tree
 * @returns The projected position and depth if the item were to be dropped.
 *          Null if the projection could not be calculated.
 */
export function getProjection(
  items: readonly FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
): {
  depth: number;
  maxDepth: number;
  minDepth: number;
  parentId: string | null;
} | null {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  if (overItemIndex === -1 || activeItemIndex === -1) {
    return null;
  }
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(
    items as FlattenedItem[],
    activeItemIndex,
    overItemIndex
  );
  const previousItem: FlattenedItem | undefined = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({
    previousItem,
    nextItem,
  });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId(): string | null {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find(item => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth({
  previousItem,
  nextItem,
}: {
  previousItem?: FlattenedItem;
  nextItem?: FlattenedItem;
}): number {
  return Math.max(previousItem?.depth ?? 0, nextItem?.depth ?? 0);
}

function getMinDepth({
  nextItem,
}: {
  nextItem: FlattenedItem | undefined;
}): number {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

/**
 * Helper function to recursively flatten a tree
 *
 * @param items Items to flatten
 * @param parentId The current parentId of the items
 * @param depth The current depth of the items
 * @returns Flattened items
 */
function flatten<T>(
  items: ReadonlyTreeItems<T>,
  parentId: string | null = null,
  depth = 0
): FlattenedItem<T>[] {
  return items
    .reduce<FlattenedItem<T>[]>(
      (acc, item) => [
        ...acc,
        { ...item, parentId, depth, index: 0 }, // Index will be recalculated after
        ...flatten(item.children, item.id, depth + 1),
      ],
      []
    )
    .map((item, index) => ({ ...item, index })); // Recalculate indexes to be sequential
}

/**
 * Flattens a tree into a 1D array given the items
 * @param items The tree items to flatten
 * @returns The flattened tree items list
 */
export function flattenTree<T>(
  items: ReadonlyTreeItems<T>
): FlattenedItem<T>[] {
  // Should help prevent double flattening since FlattenedItems are valid TreeItems
  if (items.every(isFlattenedTreeItem)) {
    return [...items];
  }
  return flatten(items);
}

/**
 * Recursively checks for the item in a list of items.
 * The list does not have to be flattened prior to searching.
 *
 * @param items Items to search
 * @param itemId Item to find
 * @returns The item if found
 */
export function findItemDeep(
  items: ReadonlyTreeItems,
  itemId: string
): TreeItem | undefined {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(items: ReadonlyTreeItems, id: string): number {
  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

/**
 * Removes the children of the list of parents from the list of flattened items
 *
 * @param items The flattened items to remove from
 * @param ids The parents we want to remove the children of
 * @returns The flattened items without the children of the parents
 */
export function removeChildrenOf<T>(
  items: FlattenedItem<T>[],
  ids: string[]
): FlattenedItem<T>[] {
  const excludeParentIds = new Set(ids);

  return items.filter(item => {
    if (item.parentId != null && excludeParentIds.has(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.add(item.id);
      }
      return false;
    }

    return true;
  });
}
