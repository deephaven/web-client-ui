import { GridUtils, MoveOperation } from '@deephaven/grid';
import clamp from 'lodash.clamp';
import ColumnHeaderGroup from '../../ColumnHeaderGroup';
import { FlattenedItem } from './sortable-tree/types';
import { FlattenedIrisGridTreeItem } from './sortable-tree/utilities';

/**
 * Moves an item as the result of drag and drop in the visibility ordering builder
 * This is extracted from the component mostly for testing purposes
 * Drag and drop interactions are not easily testable
 *
 * @param from The item being dragged
 * @param to The item being dropped on
 * @param movedColumns The existing moved columns
 * @param columnHeaderGroups The column header groups pre-drag
 * @param flattenedItems Flattened tree items representing the list
 * @param selectedParentItems The user selected items in tree order. Should not include items if their parent item is selected
 * @param firstMovableIndex The first visible index that can be moved
 * @param lastMovableIndex The last visible index that can be moved
 * @returns Object containing the updated column header groups and updated movedColumns array
 *          The movedColumns returned is complete and does not need to be combined with the existing movedColumns
 */
export function moveItemsFromDrop(
  from: FlattenedIrisGridTreeItem,
  to: FlattenedIrisGridTreeItem,
  movedColumns: readonly MoveOperation[],
  columnHeaderGroups: readonly ColumnHeaderGroup[],
  flattenedItems: readonly FlattenedIrisGridTreeItem[],
  selectedParentItems: readonly FlattenedIrisGridTreeItem[],
  firstMovableIndex: number,
  lastMovableIndex: number
): {
  groups: readonly ColumnHeaderGroup[];
  movedColumns: readonly MoveOperation[];
} {
  const treeItems = flattenedItems.map((item, i) => ({
    ...item,
    index: i,
  }));

  let newMoves: MoveOperation[] = [];
  let newGroups = columnHeaderGroups;

  const firstVisibleIndex = selectedParentItems[0].data.visibleIndex;

  const fromItemIndex = treeItems.findIndex(({ id }) => id === from.id);
  const toItemIndex = treeItems.findIndex(({ id }) => id === to.id);

  let toIndex = Array.isArray(firstVisibleIndex)
    ? firstVisibleIndex[1] + 1
    : firstVisibleIndex + 1;

  newGroups = moveToGroup(selectedParentItems[0], to.parentId, newGroups);

  // Move the items after to all after the first selected item
  for (let i = 1; i < selectedParentItems.length; i += 1) {
    const {
      data: { visibleIndex },
    } = selectedParentItems[i];

    newMoves = GridUtils.moveItemOrRange(visibleIndex, toIndex, newMoves, true);

    toIndex += Array.isArray(visibleIndex)
      ? visibleIndex[1] - visibleIndex[0] + 1
      : 1;

    newGroups = moveToGroup(selectedParentItems[i], to.parentId, newGroups);
  }

  const selectedRange = [
    Array.isArray(firstVisibleIndex) ? firstVisibleIndex[0] : firstVisibleIndex,
    toIndex - 1,
  ] as [number, number];

  const originalDropIndex = Array.isArray(to.data.visibleIndex)
    ? to.data.visibleIndex[0]
    : to.data.visibleIndex;
  let dropIndex = GridUtils.getVisibleIndex(originalDropIndex, newMoves);

  // When moving up from multi-select
  // And the items caused the drop index to shift (disjoint multi-select)
  // The drop index will be off by 1
  if (fromItemIndex > toItemIndex && dropIndex > originalDropIndex) {
    dropIndex -= 1;
  }
  // Dropping as first item in a group
  // Need to adjust visible index if dragging from before this group or it is off by 1
  if (
    to.children.length > 0 &&
    (Array.isArray(firstVisibleIndex)
      ? firstVisibleIndex[0]
      : firstVisibleIndex) < dropIndex
  ) {
    dropIndex -= 1;
  }

  if (selectedRange[0] < dropIndex) {
    dropIndex -= selectedRange[1] - selectedRange[0];
  }

  newMoves = GridUtils.moveItemOrRange(
    selectedRange,
    clamp(dropIndex, firstMovableIndex, lastMovableIndex),
    newMoves
  );

  return { groups: newGroups, movedColumns: movedColumns.concat(newMoves) };
}

export function moveToGroup<T>(
  item: FlattenedItem<T>,
  toName: string | null,
  columnGroups: readonly ColumnHeaderGroup[]
): ColumnHeaderGroup[] {
  if (item.parentId === toName) {
    // Don't need to move an item if it is already in the group
    return [...columnGroups];
  }

  let newGroups = columnGroups.map(group => new ColumnHeaderGroup(group));
  const newGroupMap = new Map(newGroups.map(group => [group.name, group]));
  const fromGroup = newGroups.find(g => g.name === item.parentId);
  const toGroup = newGroups.find(g => g.name === toName);
  const movedGroup = newGroups.find(g => g.name === item.id);

  if (fromGroup != null) {
    // Moved out of a group
    fromGroup.children = fromGroup.children.filter(name => name !== item.id);

    // Moved all children out of a group
    if (fromGroup.children.length === 0) {
      const deleteNames = new Set([fromGroup.name]);
      const { parent: parentName = '' } = fromGroup;
      let parent = newGroupMap.get(parentName);
      parent?.removeChildren([fromGroup.name]);

      // Might need to delete parents if their only child is the now empty group
      while (parent && parent.children.length === 0) {
        deleteNames.add(parent.name);
        const nextParentName = parent?.parent ?? '';
        const nextParent = newGroupMap.get(nextParentName);
        nextParent?.removeChildren([parent.name]);
        parent = nextParent;
      }

      // Delete all groups that are now empty
      newGroups = newGroups.filter(({ name }) => !deleteNames.has(name));
    }
  }

  if (toGroup != null) {
    // Moved into a group
    toGroup.addChildren([item.id]);
  }

  movedGroup?.setParent(toName ?? undefined);

  return newGroups;
}
