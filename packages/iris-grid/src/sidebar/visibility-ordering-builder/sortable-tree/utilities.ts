import { arrayMove } from '@dnd-kit/sortable';
import { GridUtils, ModelSizeMap, MoveOperation } from '@deephaven/grid';
import type IrisGridModel from '../../../IrisGridModel';
import type ColumnHeaderGroup from '../../../ColumnHeaderGroup';
import type { FlattenedItem, TreeItem, TreeItems } from './types';

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

interface IrisGridTreeItemData {
  modelIndex: number | number[];
  visibleIndex: number | [number, number];
  isVisible: boolean;
  selected: boolean;
  group?: ColumnHeaderGroup;
}

export type IrisGridTreeItem = TreeItem<IrisGridTreeItemData>;

export type FlattenedIrisGridTreeItem = FlattenedItem<IrisGridTreeItemData>;

function getTreeItem(
  model: IrisGridModel,
  movedColumns: MoveOperation[],
  name: string,
  userColumnWidths: ModelSizeMap,
  selectedItems: Set<string>
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
            userColumnWidths,
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
        isVisible: modelIndexes.some(
          // If no user set width, assume it's visible
          index => (userColumnWidths.get(index) ?? 1) > 0
        ),
        selected: selectedItems.has(name),
      },
    };
  }

  return {
    id: name,
    children: [],
    data: {
      modelIndex,
      visibleIndex: GridUtils.getVisibleIndex(modelIndex, movedColumns),
      // If no user set width, assume it's visible
      isVisible: (userColumnWidths.get(modelIndex) ?? 1) > 0,
      selected: selectedItems.has(name),
    },
  };
}

export function getTreeItems(
  model: IrisGridModel,
  movedColumns: MoveOperation[],
  userColumnWidths: ModelSizeMap,
  selectedItems: string[]
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
      userColumnWidths,
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
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
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

function getMinDepth({ nextItem }: { nextItem: FlattenedItem | undefined }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

function flatten<T>(
  items: TreeItems<T>,
  parentId: string | null = null,
  depth = 0
): FlattenedItem<T>[] {
  return items.reduce<FlattenedItem<T>[]>(
    (acc, item, index) => [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children, item.id, depth + 1),
    ],
    []
  );
}

export function flattenTree<T>(items: TreeItems<T>): FlattenedItem<T>[] {
  return flatten(items);
}

export function findItem(
  items: TreeItem[],
  itemId: string
): TreeItem | undefined {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(
  items: TreeItems,
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

export function getChildCount(items: TreeItems, id: string): number {
  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

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
