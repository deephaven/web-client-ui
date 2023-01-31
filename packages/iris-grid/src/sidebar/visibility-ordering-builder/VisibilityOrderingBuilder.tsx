import React, { ChangeEvent, Component, ReactElement } from 'react';
import classNames from 'classnames';
import {
  GridUtils,
  ModelIndex,
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
import type { Column } from '@deephaven/jsapi-shim';
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
import {
  moveItemsFromDrop,
  moveToGroup,
} from './VisibilityOrderingBuilderUtils';

const DEBOUNCE_SEARCH_COLUMN = 150;

interface VisibilityOrderingBuilderProps {
  model: IrisGridModel;
  movedColumns: MoveOperation[];
  hiddenColumns: ModelIndex[];
  columnHeaderGroups: ColumnHeaderGroup[];
  onColumnVisibilityChanged: (
    columns: VisibleIndex[],
    isVisible: boolean
  ) => void;
  onReset: () => void;
  onMovedColumnsChanged: (operations: MoveOperation[], cb?: () => void) => void;
  onColumnHeaderGroupChanged: (groups: ColumnHeaderGroup[]) => void;
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
  static SORTING_OPTIONS = { DSC: 'DSC', ASC: 'ASC' } as const;

  static MOVE_OPTIONS = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    UP: 'UP',
    DOWN: 'DOWN',
  } as const;

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
      onReset,
      onMovedColumnsChanged,
      onColumnHeaderGroupChanged,
    } = this.props;

    this.setState({
      selectedColumns: new Set(),
      lastSelectedColumn: '',
      searchFilter: '',
    });

    onReset();
    onColumnHeaderGroupChanged(model.initialColumnHeaderGroups);
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
    option: keyof typeof VisibilityOrderingBuilder.MOVE_OPTIONS
  ): { newMoves: MoveOperation[]; groups: ColumnHeaderGroup[] } {
    const { columnHeaderGroups } = this.props;
    const { selectedColumns } = this.state;

    const treeItems = flattenTree(this.getTreeItems());
    let firstMovableIndex = this.getFirstMovableIndex();
    let lastMovableIndex = this.getLastMovableIndex();
    assertNotNull(firstMovableIndex);
    assertNotNull(lastMovableIndex);

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
          updatedGroups = moveToGroup(selectedItems[i], null, updatedGroups);
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
          updatedGroups = moveToGroup(selectedItems[i], null, updatedGroups);
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
              updatedGroups = moveToGroup(
                selectedItems[i],
                newParentItem.id,
                updatedGroups
              );
            } else {
              updatedGroups = moveToGroup(
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

          if (nextItem?.parentId !== parentId) {
            // Moving out of our group
            // Move to the parent of our parent
            // That way we only ever move 1 level at a time
            const parentItem = treeItems.find(item => item.id === parentId);
            updatedGroups = moveToGroup(
              selectedItems[i],
              parentItem?.parentId ?? null,
              updatedGroups
            );
            break;
          } else if (nextItem?.children.length > 0) {
            // Moving into a group as 1st item
            updatedGroups = moveToGroup(
              selectedItems[i],
              nextItem.id,
              updatedGroups
            );
            break;
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
  handleMoveColumns(
    option: keyof typeof VisibilityOrderingBuilder.MOVE_OPTIONS
  ): void {
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
    itemsParam: IrisGridTreeItem[],
    option: keyof typeof VisibilityOrderingBuilder.SORTING_OPTIONS,
    movedColumns: MoveOperation[]
  ): MoveOperation[] {
    const items = [...itemsParam];
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

  handleSortColumns(
    option: keyof typeof VisibilityOrderingBuilder.SORTING_OPTIONS
  ): void {
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
      assertNotNull(selectedItem);
      const childCount = flattenTree(selectedItem.children).length;
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
  addColumnToSelected(
    columnsToBeAdded: string[],
    addToExisting: boolean
  ): void {
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
    assertNotNull(item);
    let parentItem = flattenedItems.find(({ id }) => id === item.parentId);

    // Remove all children of deselected groups
    flattenTree(item?.children).forEach(child =>
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
      this.addColumnToSelected([id], false);
    }
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
    const flattenedItems = flattenTree(this.getTreeItems()).map((item, i) => ({
      ...item,
      index: i,
    }));
    const firstMovableIndex = this.getFirstMovableIndex();
    const lastMovableIndex = this.getLastMovableIndex();

    assertNotNull(firstMovableIndex);
    assertNotNull(lastMovableIndex);

    const { groups: newGroups, movedColumns: newMoves } = moveItemsFromDrop(
      from,
      to,
      movedColumns,
      columnHeaderGroups,
      flattenedItems,
      selectedParentItems,
      firstMovableIndex,
      lastMovableIndex
    );

    onColumnHeaderGroupChanged(newGroups);
    onMovedColumnsChanged(newMoves);
  }

  handleGroupNameChange(group: ColumnHeaderGroup, newName: string): void {
    const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
    const newGroups = [...columnHeaderGroups];

    const oldName = group.name;
    const groupIndex = newGroups.findIndex(({ name }) => name === oldName);
    const oldGroup = newGroups[groupIndex];
    assertNotNull(oldGroup); // Also means groupIndex >= 0

    const newGroup = new ColumnHeaderGroup(oldGroup);
    newGroup.name = newName;
    newGroups.splice(groupIndex, 1, newGroup);

    const parentIndex = newGroups.findIndex(
      ({ name }) => name === newGroup.parent
    );

    if (parentIndex >= 0) {
      const newParent = new ColumnHeaderGroup(newGroups[parentIndex]);
      newParent.removeChildren([oldName]);
      newParent.addChildren([newName]);
      newGroups.splice(parentIndex, 1, newParent);
    }

    onColumnHeaderGroupChanged(newGroups);
  }

  handleGroupColorChange = throttle(
    (group: ColumnHeaderGroup, color: string | undefined): void => {
      const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
      const newGroups = [...columnHeaderGroups];
      const newGroup = new ColumnHeaderGroup({ ...group, color });

      newGroups.splice(
        newGroups.findIndex(({ name }) => name === group.name),
        1,
        newGroup
      );

      onColumnHeaderGroupChanged(newGroups);
    },
    250
  );

  handleGroupDelete(group: ColumnHeaderGroup): void {
    const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
    const newGroups = columnHeaderGroups.filter(g => g.name !== group.name);
    const parentIndex = newGroups.findIndex(g => g.name === group.parent);
    if (parentIndex >= 0) {
      const newParent = new ColumnHeaderGroup(newGroups[parentIndex]);
      newParent.addChildren(group.children);
      newParent.removeChildren([group.name]);
      newGroups.splice(parentIndex, 1, newParent);
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

    onMovedColumnsChanged(movedColumns.concat(newMoves), () => {
      this.list?.parentElement?.scroll({ top: 0 });
    });

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

  getMemoizedFirstMovableIndex = memoize(
    (
      model: IrisGridModel,
      columns: Column[],
      movedColumns: MoveOperation[]
    ) => {
      for (let i = 0; i < columns.length; i += 1) {
        const modelIndex = GridUtils.getModelIndex(i, movedColumns);

        if (model.isColumnMovable(modelIndex)) {
          return i;
        }
      }

      return null;
    }
  );

  /**
   * Gets the first movable visible index
   */
  getFirstMovableIndex() {
    const { model, movedColumns } = this.props;
    return this.getMemoizedFirstMovableIndex(
      model,
      model.columns,
      movedColumns
    );
  }

  getMemoizedLastMovableIndex = memoize(
    (
      model: IrisGridModel,
      columns: Column[],
      movedColumns: MoveOperation[]
    ) => {
      for (let i = columns.length - 1; i >= 0; i -= 1) {
        const modelIndex = GridUtils.getModelIndex(i, movedColumns);

        if (model.isColumnMovable(modelIndex)) {
          return i;
        }
      }

      return null;
    }
  );

  /**
   * Gets the last movable visible index
   */
  getLastMovableIndex() {
    const { model, movedColumns } = this.props;
    return this.getMemoizedLastMovableIndex(model, model.columns, movedColumns);
  }

  memoizedGetTreeItems = memoize(
    (
      columns: Column[],
      movedColumns: MoveOperation[],
      columnHeaderGroups: ColumnHeaderGroup[],
      hiddenColumns: ModelIndex[],
      selectedColumns: Set<string>
    ) =>
      getTreeItems(columns, movedColumns, columnHeaderGroups, hiddenColumns, [
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
      hiddenColumns,
      columnHeaderGroups,
    } = this.props;
    const { selectedColumns } = this.state;

    return this.memoizedGetTreeItems(
      model.columns,
      movedColumns,
      columnHeaderGroups,
      hiddenColumns,
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
    const treeItems = flattenTree(this.getTreeItems());

    return treeItems.filter(
      ({ id, parentId }) =>
        // All items whose parents are not selected
        selectedColumns.has(id) && !selectedColumns.has(parentId ?? '')
    );
  }

  makeVisibilityOrderingList = memoize(
    (columns: Column[], treeItems: IrisGridTreeItem[]) => {
      const { movedColumns } = this.props;

      const elements = [];
      const firstMovableIndex = this.getFirstMovableIndex();
      const lastMovableIndex = this.getLastMovableIndex();

      const firstMovableTreeIndex = treeItems.findIndex(({ data }) =>
        Array.isArray(data.visibleIndex)
          ? data.visibleIndex[0] === firstMovableIndex
          : data.visibleIndex === firstMovableIndex
      );

      const lastMovableTreeIndex = treeItems.findIndex(({ data }) =>
        Array.isArray(data.visibleIndex)
          ? data.visibleIndex[1] === lastMovableIndex
          : data.visibleIndex === lastMovableIndex
      );

      const movableItems = treeItems.slice(
        firstMovableTreeIndex,
        lastMovableTreeIndex + 1
      );

      // No movable items. Render all as immovable
      if (firstMovableIndex == null || lastMovableIndex === null) {
        for (
          let visibleIndex = 0;
          visibleIndex < columns.length;
          visibleIndex += 1
        ) {
          const modelIndex = GridUtils.getModelIndex(
            visibleIndex,
            movedColumns
          );
          const column = columns[modelIndex];
          elements.push(this.renderImmovableItem(column.name));
        }

        return elements;
      }

      // Currently immovable groups are not supported
      for (
        let visibleIndex = 0;
        visibleIndex < firstMovableIndex;
        visibleIndex += 1
      ) {
        const modelIndex = GridUtils.getModelIndex(visibleIndex, movedColumns);
        const column = columns[modelIndex];
        elements.push(this.renderImmovableItem(column.name));
      }

      if (firstMovableIndex !== null && firstMovableIndex > 0) {
        elements.push(<hr key="top-horizontal-divider" />);
      }

      elements.push(
        <SortableTree
          key="movable-items"
          items={movableItems}
          renderItem={this.renderItem}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
        />
      );

      if (lastMovableIndex != null && lastMovableIndex < columns.length - 1) {
        elements.push(<hr key="bottom-horizontal-divider" />);
      }

      for (
        let visibleIndex = lastMovableIndex + 1;
        visibleIndex < columns.length;
        visibleIndex += 1
      ) {
        const modelIndex = GridUtils.getModelIndex(visibleIndex, movedColumns);
        const column = columns[modelIndex];
        elements.push(this.renderImmovableItem(column.name));
      }

      return elements;
    }
  );

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
    const { model, hiddenColumns, onColumnVisibilityChanged } = this.props;
    const { selectedColumns, searchFilter } = this.state;
    const hasSelection = selectedColumns.size > 0;
    const treeItems = this.getTreeItems();
    const nameToIndexes = new Map(
      flattenTree(treeItems).map(item => [item.id, item.data.modelIndex])
    );
    const hiddenColumnsSet = new Set(hiddenColumns);

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
    const areSomeVisible = columnsToToggle.some(
      column => !hiddenColumnsSet.has(column)
    );

    const allToggleText = areSomeVisible ? 'Hide All' : 'Show All';

    const selectedToggleText = areSomeVisible
      ? 'Hide Selected'
      : 'Show Selected';

    const visibilityOrderingList = this.makeVisibilityOrderingList(
      model.columns,
      treeItems
    );

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
