import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  GridUtils,
  ModelSizeMap,
  MoveOperation,
  ModelIndex,
} from '@deephaven/grid';
import type IrisGridModel from '../../../IrisGridModel';
import type ColumnHeaderGroup from '../../../ColumnHeaderGroup';
import type { FlattenedItem, TreeItem, TreeItems } from './types';

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export type IrisGridTreeItem = TreeItem<{
  modelIndex: number | number[];
  visibleIndex: number | [number, number];
  hidden: boolean;
  selected: boolean;
  group?: ColumnHeaderGroup;
}>;

export type FlattenedIrisGridTreeItem = FlattenedItem<{
  modelIndex: number | number[];
  visibleIndex: number | [number, number];
  hidden: boolean;
  selected: boolean;
  group?: ColumnHeaderGroup;
}>;

function getTreeItem(
  model: IrisGridModel,
  movedColumns: MoveOperation[],
  name: string,
  columnWidths: ModelSizeMap,
  selectedItems: Set<ModelIndex>
): IrisGridTreeItem {
  const modelIndex = model.getColumnIndexByName(name);
  if (modelIndex === undefined) {
    const group = model.getColumnHeaderGroupMap().get(name);

    if (group == null) {
      throw new Error(`Column or header group not found: ${name}`);
    }

    const modelIndexes = group.childIndexes.flat();

    return {
      id: name,
      children: group.children
        .map(childName =>
          getTreeItem(
            model,
            movedColumns,
            childName,
            columnWidths,
            selectedItems
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
        hidden: modelIndexes.every(index => columnWidths.get(index) === 0),
        selected: modelIndexes.every(index => selectedItems.has(index)),
      },
    };
  }

  return {
    id: name,
    children: [],
    data: {
      modelIndex,
      visibleIndex: GridUtils.getVisibleIndex(modelIndex, movedColumns),
      hidden: columnWidths.get(modelIndex) === 0,
      selected: selectedItems.has(modelIndex),
    },
  };
}

export function getTreeItems(
  model: IrisGridModel,
  movedColumns: MoveOperation[],
  columnWidths: ModelSizeMap,
  selectedItems: ModelIndex[]
): IrisGridTreeItem[] {
  const items: IrisGridTreeItem[] = [];
  const selectedItemsSet = new Set(selectedItems);

  let visibleIndex = 0;
  while (visibleIndex < model.columnCount) {
    const modelIndex = GridUtils.getModelIndex(visibleIndex, movedColumns);

    let group = model.getColumnHeaderParentGroup(modelIndex, 0);
    while (group !== undefined && group.parent !== undefined) {
      group = group.parent;
    }

    const item = getTreeItem(
      model,
      movedColumns,
      group ? group.name : model.columns[modelIndex].name,
      columnWidths,
      selectedItemsSet
    );

    if (model.isColumnMovable(modelIndex)) {
      items.push(item);
    }

    if (Array.isArray(item.data.visibleIndex)) {
      visibleIndex += item.data.visibleIndex[1] - item.data.visibleIndex[0] + 1;
    } else {
      visibleIndex += 1;
    }
  }

  return items;
}

export function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
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

  function getParentId() {
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
}) {
  return Math.max(previousItem?.depth ?? 0, nextItem?.depth ?? 0);
}

function getMinDepth({ nextItem }: { nextItem: FlattenedItem }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

function flatten(
  items: TreeItems,
  parentId: UniqueIdentifier | null = null,
  depth = 0
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>(
    (acc, item, index) => [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children, item.id, depth + 1),
    ],
    []
  );
}

export function flattenTree(items: TreeItems): FlattenedItem[] {
  return flatten(items);
}

export function buildTree<T>(flattenedItems: FlattenedItem<T>[]): TreeItems<T> {
  const root: TreeItem<T> = { id: 'root', children: [] };
  const nodes: Record<string, TreeItem> = { [root.id]: root };
  const items = flattenedItems.map(item => ({ ...item, children: [] }));

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const { id, children } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    nodes[id] = { id, children };
    parent.children.push(item);
  }

  return root.children;
}

export function findItem(
  items: TreeItem[],
  itemId: UniqueIdentifier
): TreeItem | undefined {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(
  items: TreeItems,
  itemId: UniqueIdentifier
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

export function removeItem(items: TreeItems, id: UniqueIdentifier): TreeItem[] {
  const newItems = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.id === id) {
      continue;
    }

    if (item.children.length) {
      item.children = removeItem(item.children, id);
    }

    newItems.push(item);
  }

  return newItems;
}

export function setProperty<T extends keyof TreeItem>(
  items: TreeItems,
  id: UniqueIdentifier,
  property: T,
  setter: (value: TreeItem[T]) => TreeItem[T]
): TreeItem[] {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.id === id) {
      item[property] = setter(item[property]);
      continue;
    }

    if (item.children.length) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(items: TreeItems, id: UniqueIdentifier): number {
  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf(
  items: FlattenedItem[],
  ids: UniqueIdentifier[]
): FlattenedItem[] {
  const excludeParentIds = [...ids];

  return items.filter(item => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}
