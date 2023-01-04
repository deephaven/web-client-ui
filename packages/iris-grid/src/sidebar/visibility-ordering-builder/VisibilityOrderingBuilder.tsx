/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { ChangeEvent, Component, ReactElement } from 'react';
import classNames from 'classnames';
import {
  GridUtils,
  ModelIndex,
  ModelSizeMap,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import { TextUtils, assertNotNull, DbNameValidator } from '@deephaven/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  dhEye,
  dhEyeSlash,
  dhSortAlphaDown,
  dhSortAlphaUp,
  dhArrowToTop,
  dhArrowToBottom,
  vsChevronUp,
  vsChevronDown,
  vsSymbolStructure,
  vsRefresh,
  vsCircleLargeFilled,
  vsAdd,
} from '@deephaven/icons';
import memoize from 'memoizee';
import debounce from 'lodash.debounce';
import { Button, SearchInput } from '@deephaven/components';
import clamp from 'lodash.clamp';
import throttle from 'lodash.throttle';
import './VisibilityOrderingBuilder.scss';
import IrisGridModel from '../../IrisGridModel';
import { ColumnName } from '../../CommonTypes';
import ColumnHeaderGroup from '../../ColumnHeaderGroup';
import VisibilityOrderingItem from './VisibilityOrderingItem';
import {
  FlattenedIrisGridTreeItem,
  flattenTree,
  getTreeItems,
  IrisGridTreeItem,
} from './sortable-tree/utilities';
import SortableTree from './sortable-tree/SortableTree';
import { TreeItemRenderFn } from './sortable-tree/TreeItem';

const DEBOUNCE_SEARCH_COLUMN = 150;

interface VisibilityOrderingBuilderProps {
  model: IrisGridModel;
  movedColumns: MoveOperation[];
  userColumnWidths: ModelSizeMap;
  columnHeaderGroups: ColumnHeaderGroup[];
  onColumnVisibilityChanged: (
    columns: VisibleIndex[],
    isVisible: boolean
  ) => void;
  onMovedColumnsChanged: (operations: MoveOperation[], cb?: () => void) => void;
  onColumnHeaderGroupChanged: (groups: ColumnHeaderGroup[] | undefined) => void;
}

interface VisibilityOrderingBuilderState {
  selectedColumns: Set<string>;
  lastSelectedColumn: string;
  searchFilter: string;
}

class VisibilityOrderingBuilder extends Component<
  VisibilityOrderingBuilderProps,
  VisibilityOrderingBuilderState
> {
  static SORTING_OPTIONS = { DSC: 'DSC', ASC: 'ASC' };

  static MOVE_OPTIONS = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    UP: 'UP',
    DOWN: 'DOWN',
  };

  static COLUMN_CHANGE_OPTIONS = { ALL: 'ALL', SELECTION: 'SELECTION' };

  static moveToGroup(
    item: FlattenedIrisGridTreeItem,
    toName: string | null,
    columnGroups: ColumnHeaderGroup[]
  ): ColumnHeaderGroup[] {
    if (item.parentId === toName) {
      // Can't move a group into itself
      return columnGroups;
    }

    let newGroups = [...columnGroups];
    const fromGroup = newGroups.find(g => g.name === item.parentId);
    const toGroup = newGroups.find(g => g.name === toName);

    if (fromGroup != null) {
      // Moved out of a group
      fromGroup.children = fromGroup.children.filter(name => name !== item.id);

      // Moved all children out of a group
      if (fromGroup.children.length === 0) {
        const deleteNames = new Set([fromGroup.name]);
        let { parent } = fromGroup;
        parent?.removeChildren([fromGroup.name]);

        // Might need to delete parents if their only child is the now empty group
        while (parent && parent.children.length === 0) {
          deleteNames.add(parent.name);
          parent.parent?.removeChildren([parent.name]);
          parent = parent.parent;
        }

        // Delete all groups that are now empty
        newGroups = newGroups.filter(({ name }) => !deleteNames.has(name));
      }
    }

    if (toGroup != null) {
      // Moved into a group
      toGroup.addChildren([item.id]);
    }

    return newGroups;
  }

  constructor(props: VisibilityOrderingBuilderProps) {
    super(props);

    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.searchColumns = this.searchColumns.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleGroupDelete = this.handleGroupDelete.bind(this);
    this.handleGroupNameChange = this.handleGroupNameChange.bind(this);
    this.handleGroupCreate = this.handleGroupCreate.bind(this);
    this.validateGroupName = this.validateGroupName.bind(this);
    this.addColumnToSelected = this.addColumnToSelected.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);

    this.state = {
      selectedColumns: new Set(),
      lastSelectedColumn: '',
      searchFilter: '',
    };

    this.list = null;
  }

  componentWillUnmount(): void {
    this.debouncedSearchColumns.cancel();
  }

  list: HTMLDivElement | null;

  debouncedSearchColumns = debounce(this.searchColumns, DEBOUNCE_SEARCH_COLUMN);

  resetVisibilityOrdering(): void {
    const {
      model,
      onColumnVisibilityChanged,
      onMovedColumnsChanged,
      onColumnHeaderGroupChanged,
    } = this.props;
    const { columns } = model;

    onColumnVisibilityChanged(
      columns.map(column => {
        const index = model.getColumnIndexByName(column.name);
        assertNotNull(index);
        return index;
      }),
      true
    );
    this.setState({
      selectedColumns: new Set(),
      lastSelectedColumn: '',
      searchFilter: '',
    });

    onColumnHeaderGroupChanged(model.parseColumnHeaderGroups(undefined).groups);
    onMovedColumnsChanged(model.initialMovedColumns);
  }

  resetSelection(): void {
    this.setState({ selectedColumns: new Set(), lastSelectedColumn: '' });
  }

  handleSearchInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const searchFilter = event.target.value;
    this.setState({ searchFilter });
    if (!searchFilter) {
      this.debouncedSearchColumns.cancel();
      this.resetSelection();
      return;
    }
    this.debouncedSearchColumns(searchFilter);
  }

  searchColumns(searchFilter: string): void {
    const flattenedItems = flattenTree(this.getTreeItems());
    const itemsMatch = flattenedItems.filter(({ id }) =>
      id.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const columnsMatch = itemsMatch.map(({ id }) => id);
    const visibleIndexToFocus = flattenedItems.findIndex(({ id }) =>
      id.toLowerCase().includes(searchFilter.toLowerCase())
    );

    this.addColumnToSelected(columnsMatch, false);
    if (columnsMatch.length > 0) {
      const columnItemToFocus = this.list?.querySelectorAll('.item-wrapper')[
        visibleIndexToFocus
      ];
      columnItemToFocus?.scrollIntoView({ block: 'center' });
    }
  }

  /**
   * Moves the currently selected columns in the direction specified.
   * Does not commit any changes to any state, just gets the required modifications.
   *
   * Items that are part of a selected group should not be moved separate from the group.
   *
   * Items moved to top or bottom should be removed from any groups they are within,
   * unless part of a group that is also selected. The highest level selected group will
   * be moved to the root level of the tree.
   *
   * Items moved up or down should move into and out of groups when applicable.
   * They should never move more than 1 depth level at a time.
   *
   * Multiple selected items should move to the top or bottom in their existing order,
   * but become one block of continuous columns.
   *
   * Multiple selected items moving up or down should move independently,
   * unless they are at the same depth and contiguous. In that case, they should
   * move in and out of groups together. I.e. if the 2 items above a group are selected,
   * and the move down button is pressed, then both items should be moved into the group.
   *
   * @param option The movement option
   * @returns A new copy of the movedColumns including moves required to perform the operation.
   *
   */
  moveSelectedColumns(
    option: string
  ): { newMoves: MoveOperation[]; groups: ColumnHeaderGroup[] } {
    const { columnHeaderGroups } = this.props;
    const { selectedColumns } = this.state;
    if (selectedColumns.size === 0) {
      return { newMoves: [], groups: columnHeaderGroups };
    }

    const treeItems = flattenTree(this.getTreeItems());
    let firstMovableIndex = this.getFirstMovableIndex();
    let lastMovableIndex = this.getLastMovableIndex();

    if (firstMovableIndex == null || lastMovableIndex == null) {
      return { newMoves: [], groups: columnHeaderGroups };
    }

    const selectedItems = this.getSelectedParentItems();

    const isMovingUpward =
      option === VisibilityOrderingBuilder.MOVE_OPTIONS.UP ||
      option === VisibilityOrderingBuilder.MOVE_OPTIONS.TOP;

    // for moving up and to the top, move column(s) in visibility index order
    // for moving down and to the bottom, move column(s) in reverse visibility index order
    if (!isMovingUpward) {
      selectedItems.reverse();
    }

    let newMoves = [] as MoveOperation[];
    let updatedGroups = columnHeaderGroups;

    for (let i = 0; i < selectedItems.length; i += 1) {
      const {
        id,
        parentId,
        depth,
        data: { visibleIndex },
      } = selectedItems[i];

      switch (option) {
        case VisibilityOrderingBuilder.MOVE_OPTIONS.TOP: {
          newMoves = GridUtils.moveItemOrRange(
            visibleIndex,
            firstMovableIndex,
            newMoves,
            true
          );
          const size = Array.isArray(visibleIndex)
            ? visibleIndex[1] - visibleIndex[0] + 1
            : 1;
          firstMovableIndex += size;
          // Moving items to top should move out of any groups
          updatedGroups = VisibilityOrderingBuilder.moveToGroup(
            selectedItems[i],
            null,
            updatedGroups
          );
          break;
        }
        case VisibilityOrderingBuilder.MOVE_OPTIONS.BOTTOM: {
          newMoves = GridUtils.moveItemOrRange(
            visibleIndex,
            lastMovableIndex,
            newMoves,
            true
          );
          const size = Array.isArray(visibleIndex)
            ? visibleIndex[1] - visibleIndex[0] + 1
            : 1;
          lastMovableIndex -= size;
          // Moving items to bottom should move out of any groups
          updatedGroups = VisibilityOrderingBuilder.moveToGroup(
            selectedItems[i],
            null,
            updatedGroups
          );
          break;
        }
        case VisibilityOrderingBuilder.MOVE_OPTIONS.UP: {
          const itemIndex = treeItems.findIndex(item => item.id === id);
          // Array.findLast would be better here, but it's too new for our browser support
          const prevItemIndex = treeItems
            .map(
              (item, idx) => idx < itemIndex && !selectedColumns.has(item.id)
            )
            .lastIndexOf(true);
          const prevItem = treeItems[prevItemIndex];

          if (prevItem != null && prevItem.parentId !== parentId) {
            // Moving into a different parent
            if (Math.abs(prevItem.depth - depth) > 1) {
              // Prev item is more than 1 level away
              // Find prev parent at same depth as current
              // This way we only ever move 1 depth level per event
              const newParentItemIndex = treeItems
                .map((item, idx) => idx < prevItemIndex && item.depth === depth)
                .lastIndexOf(true);
              const newParentItem = treeItems[newParentItemIndex];
              updatedGroups = VisibilityOrderingBuilder.moveToGroup(
                selectedItems[i],
                newParentItem.id,
                updatedGroups
              );
            } else {
              updatedGroups = VisibilityOrderingBuilder.moveToGroup(
                selectedItems[i],
                prevItem.parentId,
                updatedGroups
              );
            }
          } else {
            const toIndex = clamp(
              Array.isArray(visibleIndex)
                ? visibleIndex[0] - 1
                : visibleIndex - 1,
              firstMovableIndex,
              lastMovableIndex
            );
            newMoves = GridUtils.moveItemOrRange(
              visibleIndex,
              toIndex,
              newMoves,
              false
            );
            const size = Array.isArray(visibleIndex)
              ? visibleIndex[1] - visibleIndex[0] + 1
              : 1;
            firstMovableIndex += size;
          }
          break;
        }
        case VisibilityOrderingBuilder.MOVE_OPTIONS.DOWN: {
          const itemIndex = treeItems.findIndex(item => item.id === id);
          const nextItem = treeItems.find(
            (item, idx) => idx > itemIndex && !selectedColumns.has(item.id)
          );

          if (nextItem) {
            if (nextItem?.parentId !== parentId) {
              // Moving out of our group
              // Move to the parent of our parent
              // That way we only ever move 1 level at a time
              const parentItem = treeItems.find(item => item.id === parentId);
              updatedGroups = VisibilityOrderingBuilder.moveToGroup(
                selectedItems[i],
                parentItem?.parentId ?? null,
                updatedGroups
              );
              break;
            } else if (nextItem?.children.length > 0) {
              // Moving into a group as 1st item
              updatedGroups = VisibilityOrderingBuilder.moveToGroup(
                selectedItems[i],
                nextItem.id,
                updatedGroups
              );
              break;
            }
          }

          const toIndex = clamp(
            Array.isArray(visibleIndex)
              ? visibleIndex[0] + 1
              : visibleIndex + 1,
            firstMovableIndex,
            lastMovableIndex
          );
          newMoves = GridUtils.moveItemOrRange(
            visibleIndex,
            toIndex,
            newMoves,
            false
          );
          const size = Array.isArray(visibleIndex)
            ? visibleIndex[1] - visibleIndex[0] + 1
            : 1;
          lastMovableIndex -= size;

          break;
        }
        default: {
          break;
        }
      }
    }

    return { newMoves, groups: updatedGroups };
  }

  /**
   * Moves the selected columns according to the option.
   * Commits changes to state and scrolls the list if moving to top or bottom.
   *
   * @param option The move operation
   */
  handleMoveColumns(option: string): void {
    const {
      onMovedColumnsChanged,
      movedColumns,
      onColumnHeaderGroupChanged,
    } = this.props;

    const { newMoves, groups } = this.moveSelectedColumns(option);
    let scrollListAfterMove: (() => void) | undefined;

    if (option === VisibilityOrderingBuilder.MOVE_OPTIONS.TOP) {
      scrollListAfterMove = () => {
        this.list?.parentElement?.scroll({ top: 0 });
      };
    }
    if (option === VisibilityOrderingBuilder.MOVE_OPTIONS.BOTTOM) {
      scrollListAfterMove = () => {
        this.list?.parentElement?.scroll({
          top: this.list.parentElement.scrollHeight,
        });
      };
    }

    onColumnHeaderGroupChanged(groups);

    if (newMoves.length > 0) {
      onMovedColumnsChanged(movedColumns.concat(newMoves), scrollListAfterMove);
    }
  }

  /**
   * Get the move operations required to recursively sort the grid
   * Column header groups are sorted using their name
   * Children of column header groups are then sorted within each group
   *
   * @param items The tree items to sort
   * @param option Direction of the sort
   * @param movedColumns The existing moved columns for the sort
   *                     Grids may use an initial move list from the model (e.g. column header groups)
   *                     Also used to recursively sort header groups
   * @returns The moves required to sort the grid. Includes the starting movedColumns in the array
   */
  getSortMoves(
    items: IrisGridTreeItem[],
    option: string,
    movedColumns: MoveOperation[]
  ): MoveOperation[] {
    // Sort all the movable columns
    const isAscending =
      option === VisibilityOrderingBuilder.SORTING_OPTIONS.ASC;
    items.sort((a, b) => {
      const aName = a.id.toUpperCase();
      const bName = b.id.toUpperCase();
      return TextUtils.sort(aName, bName, isAscending);
    });

    let newMoves = [...movedColumns]; // Start with the base state moves by the model
    let moveToIndex = Math.min(
      ...items.flatMap(item => {
        const { modelIndex } = item.data;
        return Array.isArray(modelIndex)
          ? GridUtils.getVisibleIndexes(modelIndex, newMoves)
          : GridUtils.getVisibleIndex(modelIndex, newMoves);
      })
    );

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const { modelIndex } = item.data;
      const visibleIndex = Array.isArray(modelIndex)
        ? GridUtils.getVisibleIndexes(modelIndex, newMoves)
        : GridUtils.getVisibleIndex(modelIndex, newMoves);
      newMoves = Array.isArray(visibleIndex)
        ? GridUtils.moveRange(
            [Math.min(...visibleIndex), Math.max(...visibleIndex)],
            moveToIndex,
            newMoves,
            true
          )
        : GridUtils.moveItem(visibleIndex, moveToIndex, newMoves);

      if (Array.isArray(visibleIndex)) {
        // Recursively sort groups
        newMoves = this.getSortMoves(item.children, option, newMoves);
      }

      moveToIndex += Array.isArray(modelIndex) ? modelIndex.length : 1;
    }

    return newMoves;
  }

  handleSortColumns(option: string): void {
    const { model, onMovedColumnsChanged } = this.props;

    const newMoves = this.getSortMoves(
      this.getTreeItems(),
      option,
      model.initialMovedColumns
    );
    onMovedColumnsChanged(newMoves);
  }

  handleItemClick(
    name: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ): void {
    event.stopPropagation();

    // Click was triggered by an interactive element. Ignore select
    if (
      event.target instanceof HTMLElement &&
      (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT')
    ) {
      return;
    }

    event.currentTarget.focus();

    const { selectedColumns, lastSelectedColumn } = this.state;
    const isModifierKeyDown = GridUtils.isModifierKeyDown(event);
    const isShiftKeyDown = event.shiftKey;
    const isSelected = selectedColumns.has(name);
    const columnsToBeAdded = [name];

    if (isSelected && isModifierKeyDown) {
      this.removeColumnFromSelected(name);
      return;
    }

    const movableItems = flattenTree(this.getTreeItems());

    if (isSelected && !isShiftKeyDown && lastSelectedColumn === name) {
      const selectedItem = movableItems.find(({ id }) => id === name);
      const childCount = flattenTree(selectedItem?.children ?? []).length;
      // If clicking on an item and it's the only thing selected, deselect it
      if (childCount + 1 === selectedColumns.size) {
        this.resetSelection();
        return;
      }
    }

    if (isShiftKeyDown) {
      const selectedIndex = movableItems.findIndex(item => item.id === name);
      const lastSelectedIndex = movableItems.findIndex(
        item => item.id === lastSelectedColumn
      );

      columnsToBeAdded.push(
        ...movableItems
          .slice(
            Math.min(lastSelectedIndex, selectedIndex),
            Math.max(lastSelectedIndex, selectedIndex) + 1
          )
          .map(item => item.id)
      );
    }

    this.addColumnToSelected(
      columnsToBeAdded,
      isModifierKeyDown || isShiftKeyDown
    );

    this.setState({
      lastSelectedColumn: name,
    });
  }

  /**
   * Adds columns or groups to the selected column set
   * Groups being added will add all of their children to the selection as well
   *
   * @param columnsToBeAdded Array of column or group names to add
   * @param addToExisting If these should be added to the existing selection or overwrite it
   */
  addColumnToSelected(columnsToBeAdded: string[], addToExisting = false): void {
    const { selectedColumns } = this.state;
    const newSelectedColumns = new Set(
      addToExisting
        ? [...selectedColumns.values()].concat(columnsToBeAdded)
        : columnsToBeAdded
    );

    const flattenedItems = flattenTree(this.getTreeItems());

    // Add all children of selected groups to the selected columns
    // The treeItems array will always be parent -> child in the order
    // We don't need to recursively iterate because of this
    // The parent will always be added before any children for nested selections
    flattenedItems.forEach(({ id, children }) => {
      if (newSelectedColumns.has(id)) {
        children.forEach(child => newSelectedColumns.add(child.id));
      }
    });

    this.setState({
      selectedColumns: newSelectedColumns,
    });
  }

  /**
   * Removes a column or group from selected columns set.
   *
   * Removing a group will deselect all of its children.
   *
   * Removing a child will deselect all parent groups.
   * Other children in those parents will stay selected, just not the group item.
   *
   * @param name Name of the column to remove
   */
  removeColumnFromSelected(name: string): void {
    const { selectedColumns } = this.state;
    const flattenedItems = flattenTree(this.getTreeItems());

    const item = flattenedItems.find(({ id }) => id === name);
    let parentItem = flattenedItems.find(({ id }) => id === item?.parentId);

    // Remove all children of deselected groups
    flattenTree(item?.children ?? []).forEach(child =>
      selectedColumns.delete(child.id)
    );

    // Remove all parents of the removed group since it is no longer fully selected
    while (parentItem != null) {
      selectedColumns.delete(parentItem.id);
      const newParentId = parentItem.parentId;
      parentItem = flattenedItems.find(({ id }) => id === newParentId);
    }

    selectedColumns.delete(name);

    this.setState({
      selectedColumns: new Set(selectedColumns),
    });
  }

  handleDragStart(id: string): void {
    const { selectedColumns } = this.state;
    if (!selectedColumns.has(id)) {
      this.addColumnToSelected([id]);
    }
  }

  handleGroupNameChange(group: ColumnHeaderGroup, newName: string): void {
    const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
    const newGroups = [...columnHeaderGroups];

    const oldName = group.name;
    const newGroup = newGroups.find(({ name }) => name === oldName);

    if (newGroup) {
      newGroup.name = newName;
      newGroup.parent?.removeChildren([oldName]);
      newGroup.parent?.addChildren([newName]);
    }

    onColumnHeaderGroupChanged(newGroups);
  }

  handleDragEnd(
    from: FlattenedIrisGridTreeItem,
    to: FlattenedIrisGridTreeItem
  ): void {
    const {
      movedColumns,
      onMovedColumnsChanged,
      columnHeaderGroups,
      onColumnHeaderGroupChanged,
    } = this.props;

    const selectedParentItems = this.getSelectedParentItems();
    const treeItems = flattenTree(this.getTreeItems()).map((item, i) => ({
      ...item,
      index: i,
    }));
    const firstMovableIndex = this.getFirstMovableIndex();
    const lastMovableIndex = this.getLastMovableIndex();
    if (firstMovableIndex == null || lastMovableIndex == null) {
      return;
    }

    let newMoves: MoveOperation[] = [];
    let newGroups = columnHeaderGroups;

    const firstVisibleIndex = selectedParentItems[0].data.visibleIndex;

    const fromIndex = treeItems.findIndex(({ id }) => id === from.id);

    let toIndex = Array.isArray(firstVisibleIndex)
      ? firstVisibleIndex[1] + 1
      : firstVisibleIndex + 1;

    newGroups = VisibilityOrderingBuilder.moveToGroup(
      selectedParentItems[0],
      to.parentId,
      newGroups
    );

    // Move the items after to all after the first selected item
    for (let i = 1; i < selectedParentItems.length; i += 1) {
      const {
        data: { visibleIndex },
      } = selectedParentItems[i];

      newMoves = GridUtils.moveItemOrRange(
        visibleIndex,
        toIndex,
        newMoves,
        true
      );

      toIndex += Array.isArray(visibleIndex)
        ? visibleIndex[1] - visibleIndex[0] + 1
        : 1;

      newGroups = VisibilityOrderingBuilder.moveToGroup(
        selectedParentItems[i],
        to.parentId,
        newGroups
      );
    }

    const selectedRange = [
      Array.isArray(firstVisibleIndex)
        ? firstVisibleIndex[0]
        : firstVisibleIndex,
      toIndex - 1,
    ] as [number, number];

    const originalDropIndex = Array.isArray(to.data.visibleIndex)
      ? to.data.visibleIndex[0]
      : to.data.visibleIndex;
    let dropIndex = GridUtils.getVisibleIndex(originalDropIndex, newMoves);

    // When moving up from multi-select
    // And the items caused the drop index to shift (disjoint multi-select)
    // The drop index will be off by 1
    if (from.index > to.index && dropIndex > originalDropIndex) {
      dropIndex -= 1;
    }

    // Dropping as first item in a group
    // Need to adjust visible index if dragging from before this group or it is off by 1
    if (
      to.children.length > 0 &&
      (Array.isArray(fromIndex) ? fromIndex[0] : fromIndex) < toIndex
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

    onColumnHeaderGroupChanged(newGroups);
    onMovedColumnsChanged(movedColumns.concat(newMoves));
  }

  handleGroupColorChange = throttle(
    (group: ColumnHeaderGroup, color: string | undefined): void => {
      const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
      const newGroups = [...columnHeaderGroups];
      const newGroup = newGroups.find(({ name }) => name === group.name);
      if (!newGroup) {
        throw new Error(
          `Changed the color group that does not exist: ${group.name}`
        );
      }

      newGroup.color = color;

      onColumnHeaderGroupChanged(newGroups);
    },
    250
  );

  handleGroupDelete(group: ColumnHeaderGroup): void {
    const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
    const newGroups = columnHeaderGroups.filter(g => g.name !== group.name);
    const newParent = newGroups.find(g => g.name === group.parent?.name);
    if (newParent !== undefined) {
      newParent.addChildren(group.children);
      newParent.removeChildren([group.name]);
    }
    onColumnHeaderGroupChanged(newGroups);
  }

  handleGroupCreate(): void {
    const {
      movedColumns,
      onMovedColumnsChanged,
      onColumnHeaderGroupChanged,
    } = this.props;

    const { newMoves, groups } = this.moveSelectedColumns(
      VisibilityOrderingBuilder.MOVE_OPTIONS.TOP
    );

    const newGroups = groups.filter(group => !group.isNew);

    const selectedItems = this.getSelectedParentItems();

    const childIndexes = selectedItems
      .map(item => item.data.modelIndex)
      .flat()
      .filter(index => index >= 0);

    // We don't care about this name really as long as it's unique
    // The user must change it and we display a placeholder instead
    const name = `${ColumnHeaderGroup.NEW_GROUP_PREFIX}-${Date.now()}`;

    const newGroup = new ColumnHeaderGroup({
      name,
      children: selectedItems.map(({ id }) => id),
      depth: 0,
      childIndexes: [...new Set(childIndexes)], // Remove any duplicates
    });

    if (newMoves.length > 0) {
      onMovedColumnsChanged(movedColumns.concat(newMoves), () => {
        this.list?.parentElement?.scroll({ top: 0 });
      });
    }

    onColumnHeaderGroupChanged(newGroups.concat([newGroup]));

    this.resetSelection();
  }

  /**
   * Validates if a header group name is valid and not in use by any header groups or columns
   * @param groupName The name to validate
   * @returns Error message if invalid
   */
  validateGroupName(groupName: string): string {
    const { model, columnHeaderGroups } = this.props;
    const { columns } = model;

    if (!DbNameValidator.isValidColumnName(groupName)) {
      return 'Invalid name';
    }

    if (
      columns.some(({ name }) => name === groupName) ||
      columnHeaderGroups.some(({ name }) => name === groupName)
    ) {
      return 'Duplicate name';
    }

    return '';
  }

  renderItem = memoize<TreeItemRenderFn<IrisGridTreeItem>>(
    ({ value, clone, item, ref, handleProps }) => {
      const { onColumnVisibilityChanged } = this.props;
      const { selectedColumns } = this.state;

      let displayString = value;

      // The cloned drag overlay we want to show the items being dragged
      if (clone) {
        const selectedItemNames = this.getSelectedParentItems().map(
          ({ id }) => id
        );
        displayString = selectedItemNames.join(', ');
      }

      return (
        <VisibilityOrderingItem
          ref={ref}
          value={displayString}
          clone={clone}
          item={item}
          childCount={selectedColumns.size}
          onVisibilityChange={onColumnVisibilityChanged}
          onClick={this.handleItemClick}
          onGroupDelete={this.handleGroupDelete}
          onGroupColorChange={this.handleGroupColorChange}
          onGroupNameChange={this.handleGroupNameChange}
          validateGroupName={this.validateGroupName}
          handleProps={handleProps}
        />
      );
    }
  );

  /**
   * Gets the first movable visible index
   */
  getFirstMovableIndex(): ModelIndex | null {
    const { data } = this.getTreeItems()[0];
    if (data == null) {
      return null;
    }
    return Array.isArray(data.visibleIndex)
      ? data.visibleIndex[0]
      : data.visibleIndex;
  }

  /**
   * Gets the first movable visible index
   */
  getLastMovableIndex(): ModelIndex | null {
    const items = this.getTreeItems();
    const { data } = items[items.length - 1];

    if (data == null) {
      return null;
    }
    return Array.isArray(data.visibleIndex)
      ? data.visibleIndex[1]
      : data.visibleIndex;
  }

  memoizedGetTreeItems = memoize((
    model: IrisGridModel,
    movedColumns: MoveOperation[],
    // Unused here, but changes to groups should bust cache
    columnHeaderGroups: ColumnHeaderGroup[],
    userColumnWidths: ModelSizeMap,
    selectedColumns: Set<string>
  ) =>
    getTreeItems(model, movedColumns, userColumnWidths, [
      ...selectedColumns.values(),
    ])
  );

  /**
   * Gets the tree of movable items in order. Memoized for efficiency
   * Use flattenItems(this.getTreeItems()) if a flat list is needed
   * @returns The movable tree items in order
   */
  getTreeItems(): IrisGridTreeItem[] {
    const {
      model,
      movedColumns,
      userColumnWidths,
      columnHeaderGroups,
    } = this.props;
    const { selectedColumns } = this.state;

    return this.memoizedGetTreeItems(
      model,
      movedColumns,
      columnHeaderGroups,
      userColumnWidths,
      selectedColumns
    );
  }

  /**
   * Gets the selected items that are movable.
   * This is any item whose parent is not also selected.
   *
   * @returns The array of items whose parents are not selected
   */
  getSelectedParentItems(): FlattenedIrisGridTreeItem[] {
    const { selectedColumns } = this.state;
    const selectedColumnsSet = new Set(selectedColumns);
    const treeItems = flattenTree(this.getTreeItems());

    return treeItems.filter(
      ({ id, parentId }) =>
        // All items whose parents are not selected
        selectedColumnsSet.has(id) && !selectedColumnsSet.has(parentId ?? '')
    );
  }

  makeVisibilityOrderingList = memoize((movableItems: IrisGridTreeItem[]) => {
    const { model, movedColumns } = this.props;
    const { columns } = model;

    const elements = [];

    let wasMovable = false;
    for (
      let visibleIndex = 0;
      visibleIndex < columns.length;
      visibleIndex += 1
    ) {
      const modelIndex = GridUtils.getModelIndex(visibleIndex, movedColumns);
      const column = columns[modelIndex];
      const isMovable = model.isColumnMovable(modelIndex);
      if (visibleIndex > 0 && isMovable !== wasMovable) {
        elements.push(<hr key={column.name} />);
      }

      if (isMovable && isMovable !== wasMovable) {
        elements.push(
          <SortableTree
            key="movable-items"
            items={movableItems}
            renderItem={this.renderItem}
            onDragStart={this.handleDragStart}
            onDragEnd={this.handleDragEnd}
          />
        );
      } else if (!isMovable) {
        elements.push(this.renderImmovableItem(column.name));
      }

      wasMovable = isMovable;
    }

    return elements;
  });

  renderImmovableItem = memoize(
    (columnName: ColumnName): ReactElement => (
      <div className="visibility-ordering-list-item immovable" key={columnName}>
        <div className="column-item">
          <span className="column-name">{columnName}</span>
        </div>
      </div>
    )
  );

  render(): ReactElement {
    const { userColumnWidths, onColumnVisibilityChanged } = this.props;
    const { selectedColumns, searchFilter } = this.state;
    const hasSelection = selectedColumns.size > 0;
    const treeItems = this.getTreeItems();
    const nameToIndexes = new Map(
      flattenTree(treeItems).map(item => [item.id, item.data.modelIndex])
    );

    const columnsToToggle = [
      // Pass through Set to dedupe model indexes
      ...new Set(
        hasSelection
          ? [...selectedColumns.values()]
              .map(name => nameToIndexes.get(name))
              .filter((i): i is number | number[] => i != null)
              .flat()
          : treeItems.map(item => item.data.modelIndex).flat()
      ),
    ];
    const areSomeVisible = !GridUtils.checkAllColumnsHidden(
      columnsToToggle,
      userColumnWidths
    );

    const allToggleText = areSomeVisible ? 'Hide All' : 'Show All';

    const selectedToggleText = areSomeVisible
      ? 'Hide Selected'
      : 'Show Selected';

    const visibilityOrderingList = this.makeVisibilityOrderingList(treeItems);

    return (
      <div role="menu" className="visibility-ordering-builder" tabIndex={0}>
        <div className="top-menu">
          <Button
            kind="ghost"
            className="toggle-visibility-btn"
            onClick={() => {
              onColumnVisibilityChanged(columnsToToggle, !areSomeVisible);
            }}
            icon={areSomeVisible ? dhEye : dhEyeSlash}
            tooltip="Toggle column visibility"
          >
            {!hasSelection ? allToggleText : selectedToggleText}
          </Button>

          <SearchInput
            className="visibility-search"
            value={searchFilter}
            matchCount={searchFilter ? selectedColumns.size : undefined}
            onChange={this.handleSearchInputChange}
          />
        </div>
        <div className="top-menu">
          <Button
            kind="ghost"
            icon={vsRefresh}
            tooltip="Reset to default"
            onClick={() => {
              this.resetVisibilityOrdering();
            }}
          >
            Reset
          </Button>
          <span className="vertical-divider" />
          <Button
            kind="ghost"
            icon={dhSortAlphaDown}
            tooltip="Sort ascending"
            onClick={() => {
              this.handleSortColumns(
                VisibilityOrderingBuilder.SORTING_OPTIONS.ASC
              );
            }}
          />
          <Button
            kind="ghost"
            icon={dhSortAlphaUp}
            tooltip="Sort descending"
            onClick={() => {
              this.handleSortColumns(
                VisibilityOrderingBuilder.SORTING_OPTIONS.DSC
              );
            }}
          />
          <span className="vertical-divider" />
          <Button
            kind="ghost"
            tooltip="Create group from selection"
            disabled={!hasSelection}
            onClick={this.handleGroupCreate}
          >
            <span className="fa-layers" style={{ marginRight: '0.75rem' }}>
              <FontAwesomeIcon
                mask={vsSymbolStructure}
                icon={vsCircleLargeFilled}
                transform="right-7 down-5 shrink-6"
              />
              <FontAwesomeIcon
                icon={vsAdd}
                transform="right-8 down-6 shrink-8"
              />
            </span>
            Group
          </Button>
          <span className="vertical-divider" />
          <Button
            kind="ghost"
            icon={vsChevronUp}
            tooltip="Move selection up"
            onClick={() => {
              this.handleMoveColumns(VisibilityOrderingBuilder.MOVE_OPTIONS.UP);
            }}
            disabled={!hasSelection}
          />
          <Button
            kind="ghost"
            icon={vsChevronDown}
            tooltip="Move selection down"
            onClick={() => {
              this.handleMoveColumns(
                VisibilityOrderingBuilder.MOVE_OPTIONS.DOWN
              );
            }}
            disabled={!hasSelection}
          />
          <Button
            kind="ghost"
            icon={dhArrowToTop}
            tooltip="Move selection to top"
            onClick={() => {
              this.handleMoveColumns(
                VisibilityOrderingBuilder.MOVE_OPTIONS.TOP
              );
            }}
            disabled={!hasSelection}
          />
          <Button
            kind="ghost"
            icon={dhArrowToBottom}
            tooltip="Move selection to bottom"
            onClick={() => {
              this.handleMoveColumns(
                VisibilityOrderingBuilder.MOVE_OPTIONS.BOTTOM
              );
            }}
            disabled={!hasSelection}
          />
        </div>

        <div role="menu" className={classNames('visibility-ordering-list')}>
          <div
            className="column-list"
            ref={list => {
              this.list = list;
            }}
          >
            {visibilityOrderingList}
          </div>
        </div>
      </div>
    );
  }
}

export default VisibilityOrderingBuilder;
