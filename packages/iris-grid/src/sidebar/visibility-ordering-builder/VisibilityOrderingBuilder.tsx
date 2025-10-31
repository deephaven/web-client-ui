import React, {
  memo,
  PureComponent,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from 'react';
import { flushSync } from 'react-dom';
import classNames from 'classnames';
import {
  GridUtils,
  type ModelIndex,
  type MoveOperation,
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
  vsBlank,
  vsCheck,
  vsKebabVertical,
} from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import memoize from 'memoizee';
import { type DragStartEvent } from '@dnd-kit/core';
import type { Key } from '@react-types/shared';
import {
  ActionButton,
  Button,
  GLOBAL_SHORTCUTS,
  Icon,
  Item,
  Keyboard,
  MenuTrigger,
  Section,
  SpectrumMenu,
  Text,
} from '@deephaven/components';
import clamp from 'lodash.clamp';
import throttle from 'lodash.throttle';
import { useUndoRedo } from '@deephaven/react-hooks';
import Log from '@deephaven/log';
import './VisibilityOrderingBuilder.scss';
import { type DisplayColumn } from '../../IrisGridModel';
import type IrisGridModel from '../../IrisGridModel';
import { type ColumnName } from '../../CommonTypes';
import ColumnHeaderGroup from '../../ColumnHeaderGroup';
import VisibilityOrderingItem from './VisibilityOrderingItem';
import {
  type FlattenedIrisGridTreeItem,
  flattenTree,
  getTreeItems,
  type IrisGridTreeItem,
  type IrisGridTreeItemData,
} from './sortable-tree/utilities';
import SortableTree from './sortable-tree/SortableTree';
import { type TreeItemRenderFnProps } from './sortable-tree/TreeItem';
import {
  moveItemsFromDrop,
  moveToGroup,
} from './VisibilityOrderingBuilderUtils';
import IrisGridUtils from '../../IrisGridUtils';
import SearchWithModal from './SearchWithModal';
import SortableTreeDndContext from './sortable-tree/SortableTreeDndContext';

const log = Log.module('VisibilityOrderingBuilder');

export interface VisibilityOrderingBuilderProps {
  model: IrisGridModel;
  movedColumns: readonly MoveOperation[];
  hiddenColumns: readonly ModelIndex[];
  columnHeaderGroups: readonly ColumnHeaderGroup[];
  onColumnVisibilityChanged: (
    columns: readonly ModelIndex[],
    isVisible: boolean
  ) => void;
  onReset: () => void;
  onMovedColumnsChanged: (
    operations: readonly MoveOperation[],
    cb?: () => void
  ) => void;
  onColumnHeaderGroupChanged: (groups: readonly ColumnHeaderGroup[]) => void;
  onFrozenColumnsChanged: (columns: readonly ColumnName[]) => void;
  __testRef?: React.Ref<VisibilityOrderingBuilderInner>;
}

interface VisibilityOrderingBuilderInnerProps
  extends Omit<
    VisibilityOrderingBuilderProps,
    'onFrozenColumnsChanged' | '__testRef'
  > {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  startUndoGroup: () => void;
  endUndoGroup: () => void;
}

interface VisibilityOrderingBuilderInnerState {
  selectedColumns: Set<string>;
  lastSelectedColumn: string;
  isSearchModalOpen: boolean;
  showHiddenColumns: boolean;
}

class VisibilityOrderingBuilderInner extends PureComponent<
  VisibilityOrderingBuilderInnerProps,
  VisibilityOrderingBuilderInnerState
> {
  static SORTING_OPTIONS = { DSC: 'DSC', ASC: 'ASC' } as const;

  static MOVE_OPTIONS = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    UP: 'UP',
    DOWN: 'DOWN',
  } as const;

  static shouldRenderColumn(column: DisplayColumn): boolean {
    // We don't want to render the proxy column in the visibility ordering list
    return column.isProxy !== true;
  }

  constructor(props: VisibilityOrderingBuilderInnerProps) {
    super(props);

    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleGroupDelete = this.handleGroupDelete.bind(this);
    this.handleGroupNameChange = this.handleGroupNameChange.bind(this);
    this.handleGroupCreate = this.handleGroupCreate.bind(this);
    this.validateGroupName = this.validateGroupName.bind(this);
    this.addColumnToSelected = this.addColumnToSelected.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleOverflowAction = this.handleOverflowAction.bind(this);
    this.handleKeyboardShortcut = this.handleKeyboardShortcut.bind(this);
    this.handleSearchModalOpenChange =
      this.handleSearchModalOpenChange.bind(this);
    this.handleSearchSelect = this.handleSearchSelect.bind(this);
    this.handleSearchItemClicked = this.handleSearchItemClicked.bind(this);
    this.handleSearchDragStart = this.handleSearchDragStart.bind(this);
    this.renderItem = this.renderItem.bind(this);

    this.state = {
      selectedColumns: new Set(),
      lastSelectedColumn: '',
      showHiddenColumns: true,
      isSearchModalOpen: false,
    };

    this.list = null;
  }

  componentDidMount(): void {
    assertNotNull(this.wrapperRef.current);
    // This fixes focus loss when editing a group because we use the name as the key for rendering.
    // When the name is changed or group deleted, we lose focus entirely which is indicated by
    // the focusout relatedTarget being null.
    this.wrapperRef.current.addEventListener('focusin', (e: FocusEvent) => {
      if (e.target instanceof HTMLElement) {
        const treeItem = e.target.closest('.tree-item') as HTMLElement | null;
        if (treeItem != null) {
          this.lastFocusedItemIndex =
            typeof treeItem.dataset.index === 'string'
              ? parseInt(treeItem.dataset.index, 10)
              : null;
        }
      }
    });
  }

  componentDidUpdate(prevProps: VisibilityOrderingBuilderInnerProps): void {
    // Scroll to the item when it's available
    if (this.scrollAndFocusColumnOnUpdate != null) {
      const itemElement = this.list?.querySelector(
        `.item-wrapper[data-id="${this.scrollAndFocusColumnOnUpdate}"] .tree-item`
      );
      if (itemElement instanceof HTMLElement) {
        itemElement.scrollIntoView({ block: 'nearest' });
        itemElement.focus();
        this.scrollAndFocusColumnOnUpdate = null;
      }
    }

    // document.activeElement is either body or html when nothing is focused.
    // If there is no focused element, then we probably deleted or renamed a group
    // resulting in focus loss. Try to re-establish focus.
    // Cannot rely on focusout event for this because it doesn't fire when the focused element is deleted
    // (except in Chrome which is against the spec here).
    if (
      (document.activeElement === document.body ||
        document.activeElement === document.documentElement) &&
      this.lastFocusedItemIndex !== null
    ) {
      const itemToFocus = this.list?.querySelector(
        `.item-wrapper:nth-child(${this.lastFocusedItemIndex + 1}) .tree-item`
      );

      if (itemToFocus != null && itemToFocus instanceof HTMLElement) {
        itemToFocus.focus();
      } else {
        log.warn('Could not maintain focus');
        this.lastFocusedItemIndex = null;
      }
    }
  }

  componentWillUnmount(): void {
    const { columnHeaderGroups, onColumnHeaderGroupChanged } = this.props;
    // Clean up unnamed groups on unmount
    const filteredGroups = columnHeaderGroups.filter(group => !group.isNew);
    if (filteredGroups.length !== columnHeaderGroups.length) {
      onColumnHeaderGroupChanged(filteredGroups);
    }
  }

  wrapperRef = React.createRef<HTMLDivElement>();

  lastFocusedItemIndex: number | null = null;

  list: HTMLDivElement | null;

  /**
   * This is set by the search modal handlers since a column could be hidden
   * and not displayed in the list. We need to wait until the update to scroll to it.
   */
  scrollAndFocusColumnOnUpdate: string | null = null;

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
    });

    onReset();
    onColumnHeaderGroupChanged(model.initialColumnHeaderGroups);
    onMovedColumnsChanged(model.initialMovedColumns);
  }

  resetSelection(): void {
    this.setState({
      selectedColumns: new Set(),
      lastSelectedColumn: '',
    });
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
    option: keyof typeof VisibilityOrderingBuilderInner.MOVE_OPTIONS
  ): { newMoves: MoveOperation[]; groups: readonly ColumnHeaderGroup[] } {
    const { columnHeaderGroups } = this.props;
    const { selectedColumns } = this.state;

    const treeItems = flattenTree(this.getTreeItems());
    let firstMovableIndex = this.getFirstMovableIndex();
    let lastMovableIndex = this.getLastMovableIndex();
    assertNotNull(firstMovableIndex);
    assertNotNull(lastMovableIndex);

    const selectedItems = this.getSelectedParentItems();

    const isMovingUpward =
      option === VisibilityOrderingBuilderInner.MOVE_OPTIONS.UP ||
      option === VisibilityOrderingBuilderInner.MOVE_OPTIONS.TOP;

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
        case VisibilityOrderingBuilderInner.MOVE_OPTIONS.TOP: {
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
        case VisibilityOrderingBuilderInner.MOVE_OPTIONS.BOTTOM: {
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
        case VisibilityOrderingBuilderInner.MOVE_OPTIONS.UP: {
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
        case VisibilityOrderingBuilderInner.MOVE_OPTIONS.DOWN: {
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
    option: keyof typeof VisibilityOrderingBuilderInner.MOVE_OPTIONS
  ): void {
    const { onMovedColumnsChanged, movedColumns, onColumnHeaderGroupChanged } =
      this.props;

    const { newMoves, groups } = this.moveSelectedColumns(option);
    let scrollListAfterMove: (() => void) | undefined;

    if (option === VisibilityOrderingBuilderInner.MOVE_OPTIONS.TOP) {
      scrollListAfterMove = () => {
        this.list?.parentElement?.scroll({ top: 0 });
      };
    }
    if (option === VisibilityOrderingBuilderInner.MOVE_OPTIONS.BOTTOM) {
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
    itemsParam: readonly IrisGridTreeItem[],
    option: keyof typeof VisibilityOrderingBuilderInner.SORTING_OPTIONS,
    movedColumns: readonly MoveOperation[]
  ): MoveOperation[] {
    const items = [...itemsParam];
    // Sort all the movable columns
    const isAscending =
      option === VisibilityOrderingBuilderInner.SORTING_OPTIONS.ASC;
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
    option: keyof typeof VisibilityOrderingBuilderInner.SORTING_OPTIONS
  ): void {
    const { model, onMovedColumnsChanged } = this.props;
    const tree = this.getTreeItems();
    const firstIndex = this.getFirstMovableIndex() ?? 0;
    const lastIndex = this.getLastMovableIndex() ?? tree.length - 1;
    const moveableTree = tree.slice(firstIndex, lastIndex + 1);

    // add frozen moves
    const initialAndFrozenMovedColumns = [...model.initialMovedColumns];
    for (let i = 0; i < model.frozenColumns.length; i += 1) {
      const frozenColumn = model.frozenColumns[i];
      const newFrozenIndex = GridUtils.getVisibleIndex(
        model.getColumnIndexByName(frozenColumn) ?? 0,
        initialAndFrozenMovedColumns
      );
      if (newFrozenIndex !== i) {
        initialAndFrozenMovedColumns.push({
          from: newFrozenIndex,
          to: i,
        });
      }
    }

    const newMoves = this.getSortMoves(
      moveableTree,
      option,
      initialAndFrozenMovedColumns
    );

    onMovedColumnsChanged(newMoves);
  }

  /**
   * Handles clicking on an item in the visibility ordering list.
   * Adds and removes to selection as necessary based on modifier and shift keys.
   * Returns the columns to be added to the selection, if any.
   *
   * @param name The name of the column clicked
   * @param event The click event
   * @param showHiddenColumns If hidden columns should be included in the selection
   * @returns The columns to be added to the selection, if any`
   */
  handleItemClick(
    name: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    showHiddenColumns?: boolean
  ): string[] {
    event.stopPropagation();

    // Click was triggered by an interactive element. Ignore select
    if (
      event.target instanceof HTMLElement &&
      (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT')
    ) {
      return [];
    }

    event.currentTarget?.focus();

    const { selectedColumns, lastSelectedColumn } = this.state;
    const isModifierKeyDown = GridUtils.isModifierKeyDown(event);
    const isShiftKeyDown = event.shiftKey;
    const isSelected = selectedColumns.has(name);
    const columnsToBeAdded = [name];

    if (isSelected && isModifierKeyDown) {
      this.removeColumnFromSelected(name);
      return [];
    }

    const movableItems = flattenTree(this.getTreeItems(showHiddenColumns));

    if (isSelected && !isShiftKeyDown && lastSelectedColumn === name) {
      const selectedItem = movableItems.find(({ id }) => id === name);
      assertNotNull(selectedItem);
      const childCount = flattenTree(selectedItem.children).length;
      // If clicking on an item and it's the only thing selected, deselect it
      if (childCount + 1 === selectedColumns.size) {
        this.resetSelection();
        return [];
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

    return columnsToBeAdded;
  }

  handleSearchItemClicked(
    name: string,
    event: React.MouseEvent<HTMLElement>
  ): void {
    const columnsToAdd = this.handleItemClick(name, event, true);
    const { showHiddenColumns } = this.state;
    const { onColumnVisibilityChanged } = this.props;

    if (columnsToAdd.length === 0) {
      return;
    }

    const modelIndexesToShow = this.getSelectedItemModelIndexes(
      new Set(columnsToAdd)
    );

    if (!showHiddenColumns) {
      onColumnVisibilityChanged(modelIndexesToShow, true);
    }

    if (event.shiftKey || GridUtils.isModifierKeyDown(event)) {
      return;
    }

    this.scrollAndFocusColumnOnUpdate = name;
  }

  handleSearchSelect(names: string[]): void {
    if (names.length === 0) {
      return;
    }
    const { showHiddenColumns } = this.state;
    const { onColumnVisibilityChanged } = this.props;

    if (!showHiddenColumns) {
      const modelIndexesToShow = this.getSelectedItemModelIndexes(
        new Set(names)
      );
      onColumnVisibilityChanged(modelIndexesToShow, true);
    }

    const [firstItem] = names;
    this.scrollAndFocusColumnOnUpdate = firstItem;
    this.addColumnToSelected(names, false);
  }

  handleSearchDragStart(e: DragStartEvent): void {
    const columnName = e.active.id as string;
    const { model, onColumnVisibilityChanged } = this.props;
    const { showHiddenColumns } = this.state;
    if (showHiddenColumns) {
      return;
    }
    const columnIndex = model.getColumnIndexByName(columnName);
    if (columnIndex == null) {
      return;
    }
    onColumnVisibilityChanged([columnIndex], true);
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
      // For some reason, flushSync is needed here to prevent issues when
      // dragging multiple items, dropping, then immediately dragging a single item
      // over the previously dragged group. Without flushSync, the item being dragged
      // can cause items in the previously dragged group to be in completely wrong places.
      flushSync(() => this.addColumnToSelected([id], false));
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
    const flattenedItems = flattenTree(this.getTreeItems());
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
    // this.scrollAndFocusColumnOnUpdate = from.id; // Focus the dragged item after the move
  }

  handleGroupNameChange(group: ColumnHeaderGroup, newName: string): void {
    const { columnHeaderGroups, onColumnHeaderGroupChanged, endUndoGroup } =
      this.props;
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
    endUndoGroup();
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
    const { columnHeaderGroups, endUndoGroup, onColumnHeaderGroupChanged } =
      this.props;
    const newGroups = columnHeaderGroups.filter(g => g.name !== group.name);
    const parentIndex = newGroups.findIndex(g => g.name === group.parent);
    if (parentIndex >= 0) {
      const newParent = new ColumnHeaderGroup(newGroups[parentIndex]);
      newParent.addChildren(group.children);
      newParent.removeChildren([group.name]);
      newGroups.splice(parentIndex, 1, newParent);
    }
    onColumnHeaderGroupChanged(newGroups);
    // Could be started from editing a new group which is deleted without saving
    endUndoGroup();
  }

  handleGroupCreate(): void {
    const {
      movedColumns,
      onMovedColumnsChanged,
      onColumnHeaderGroupChanged,
      startUndoGroup,
    } = this.props;

    const { newMoves, groups } = this.moveSelectedColumns(
      VisibilityOrderingBuilderInner.MOVE_OPTIONS.TOP
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

    startUndoGroup();

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

  renderItem({
    value,
    clone,
    item,
    ref,
    handleProps,
  }: TreeItemRenderFnProps<IrisGridTreeItemData>): JSX.Element {
    const { onColumnVisibilityChanged } = this.props;
    const { selectedColumns, showHiddenColumns } = this.state;

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
        key={item.id}
        ref={ref}
        value={displayString}
        clone={clone}
        item={item}
        childCount={selectedColumns.size}
        onVisibilityChange={onColumnVisibilityChanged}
        visibilityClickAndDrag={showHiddenColumns}
        onClick={this.handleItemClick}
        onGroupDelete={this.handleGroupDelete}
        onGroupColorChange={this.handleGroupColorChange}
        onGroupNameChange={this.handleGroupNameChange}
        validateGroupName={this.validateGroupName}
        handleProps={handleProps}
      />
    );
  }

  getMemoizedFirstMovableIndex = memoize(
    (
      model: IrisGridModel,
      columns: readonly dh.Column[],
      movedColumns: readonly MoveOperation[]
    ) => {
      for (let i = 0; i < columns.length; i += 1) {
        const modelIndex = GridUtils.getModelIndex(i, movedColumns);

        if (model.isColumnMovable(modelIndex)) {
          return i;
        }
      }

      return null;
    },
    { max: 10 }
  );

  /**
   * Gets the first movable visible index
   */
  getFirstMovableIndex(): number | null {
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
      columns: readonly dh.Column[],
      movedColumns: readonly MoveOperation[]
    ) => {
      for (let i = columns.length - 1; i >= 0; i -= 1) {
        const modelIndex = GridUtils.getModelIndex(i, movedColumns);

        if (model.isColumnMovable(modelIndex)) {
          return i;
        }
      }

      return null;
    },
    { max: 10 }
  );

  /**
   * Gets the last movable visible index
   */
  getLastMovableIndex(): number | null {
    const { model, movedColumns } = this.props;
    return this.getMemoizedLastMovableIndex(model, model.columns, movedColumns);
  }

  memoizedGetTreeItems = memoize(
    (
      columns: readonly dh.Column[],
      movedColumns: readonly MoveOperation[],
      columnHeaderGroups: readonly ColumnHeaderGroup[],
      hiddenColumns: readonly ModelIndex[],
      selectedColumns: ReadonlySet<string>,
      showHiddenColumns: boolean
    ): readonly IrisGridTreeItem[] =>
      getTreeItems(
        columns,
        movedColumns,
        columnHeaderGroups,
        hiddenColumns,
        [...selectedColumns.values()],
        showHiddenColumns
      ),
    { max: 1000 }
  );

  /**
   * Gets the tree of movable items in order. Memoized for efficiency
   * Use flattenItems(this.getTreeItems()) if a flat list is needed
   * @param showHiddenColumns Whether to show hidden columns in the tree. Defaults to the current state value.
   * @returns The movable tree items in order
   */
  getTreeItems(showHiddenColumns?: boolean): readonly IrisGridTreeItem[] {
    const { model, movedColumns, hiddenColumns, columnHeaderGroups } =
      this.props;
    const { selectedColumns, showHiddenColumns: showHiddenColumnsState } =
      this.state;

    return this.memoizedGetTreeItems(
      model.columns,
      movedColumns,
      columnHeaderGroups,
      hiddenColumns,
      selectedColumns,
      showHiddenColumns ?? showHiddenColumnsState
    );
  }

  getSelectedItemModelIndexes(columnNames: Set<string>): ModelIndex[] {
    const { model } = this.props;
    return [...columnNames.values()]
      .map(name => model.getColumnIndexByName(name))
      .filter(i => i != null)
      .flat();
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
    (
      columns: readonly DisplayColumn[],
      treeItems: readonly IrisGridTreeItem[],
      showHiddenColumns: boolean,
      isDraggable: boolean
    ) => {
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

      let movableItems = treeItems.slice(
        firstMovableTreeIndex,
        lastMovableTreeIndex + 1
      );

      if (!showHiddenColumns) {
        movableItems = movableItems.filter(item => item.data.isVisible);
      }

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
          if (VisibilityOrderingBuilderInner.shouldRenderColumn(column)) {
            elements.push(this.renderImmovableItem(column.name));
          }
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
        if (VisibilityOrderingBuilderInner.shouldRenderColumn(column)) {
          elements.push(this.renderImmovableItem(column.name));
        }
      }

      if (firstMovableIndex !== null && firstMovableIndex > 0) {
        elements.push(<hr key="top-horizontal-divider" />);
      }

      elements.push(
        <SortableTree
          key="movable-items"
          items={movableItems}
          renderItem={this.renderItem}
          isDraggable={isDraggable}
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
        if (VisibilityOrderingBuilderInner.shouldRenderColumn(column)) {
          elements.push(this.renderImmovableItem(column.name));
        }
      }

      return elements;
    },
    { max: 10 }
  );

  renderImmovableItem = memoize(
    (columnName: ColumnName): ReactElement => (
      <div className="visibility-ordering-list-item immovable" key={columnName}>
        <div className="column-item">
          <span className="column-name">{columnName}</span>
        </div>
      </div>
    ),
    { max: 1000 }
  );

  handleOverflowAction(key: Key): void {
    const { undo, redo } = this.props;
    switch (key) {
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'showHidden':
        this.setState(prev => ({
          showHiddenColumns: !prev.showHiddenColumns,
          selectedColumns: new Set(),
        }));
        break;
    }
  }

  handleKeyboardShortcut(event: React.KeyboardEvent): void {
    const { canUndo, canRedo, undo, redo } = this.props;
    if (GLOBAL_SHORTCUTS.UNDO.matchesEvent(event) && canUndo) {
      event.preventDefault();
      undo();
    } else if (GLOBAL_SHORTCUTS.REDO.matchesEvent(event) && canRedo) {
      event.preventDefault();
      redo();
    }
  }

  handleSearchModalOpenChange(isOpen: boolean): void {
    if (isOpen) {
      this.resetSelection();
    } else {
      const { showHiddenColumns, selectedColumns } = this.state;
      const { onColumnVisibilityChanged } = this.props;
      if (!showHiddenColumns) {
        const modelIndexesToShow =
          this.getSelectedItemModelIndexes(selectedColumns);
        onColumnVisibilityChanged(modelIndexesToShow, true);
      }
    }
    this.setState({ isSearchModalOpen: isOpen });
  }

  render(): ReactElement {
    const {
      model,
      hiddenColumns,
      onColumnVisibilityChanged,
      canUndo,
      canRedo,
    } = this.props;
    const { selectedColumns, showHiddenColumns, isSearchModalOpen } =
      this.state;
    const hasSelection = selectedColumns.size > 0;
    const treeItems = this.getTreeItems();
    const flattenedItems = flattenTree(treeItems);
    const hiddenColumnsSet = new Set(hiddenColumns);

    const columnsToToggle = hasSelection
      ? this.getSelectedItemModelIndexes(selectedColumns)
      : treeItems.map(item => item.data.modelIndex).flat();

    const areSomeVisible = columnsToToggle.some(
      column => !hiddenColumnsSet.has(column)
    );

    const allToggleText = areSomeVisible ? 'Hide All' : 'Show All';

    const selectedToggleText = areSomeVisible
      ? 'Hide Selected'
      : 'Show Selected';

    const visibilityOrderingList = this.makeVisibilityOrderingList(
      model.columns,
      treeItems,
      showHiddenColumns,
      !isSearchModalOpen
    );

    return (
      <SortableTreeDndContext
        items={flattenedItems}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        renderItem={this.renderItem}
      >
        <div
          role="menu"
          ref={this.wrapperRef}
          className="visibility-ordering-builder"
          tabIndex={0}
          onKeyUp={this.handleKeyboardShortcut}
        >
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

            <SearchWithModal
              items={flattenedItems}
              onModalOpenChange={this.handleSearchModalOpenChange}
              onClick={this.handleSearchItemClicked}
              onDragStart={this.handleSearchDragStart}
              setSelection={this.handleSearchSelect}
            />

            <MenuTrigger closeOnSelect={false}>
              <ActionButton isQuiet aria-label="More options">
                <FontAwesomeIcon icon={vsKebabVertical} />
              </ActionButton>
              <SpectrumMenu
                onAction={this.handleOverflowAction}
                disabledKeys={[!canUndo && 'undo', !canRedo && 'redo'].filter(
                  k => typeof k === 'string'
                )}
              >
                <Section aria-label="Undo and Redo">
                  <Item key="undo" textValue="Undo">
                    <Icon>
                      <FontAwesomeIcon icon={vsBlank} />
                    </Icon>
                    <Text>Undo</Text>
                    <Keyboard>
                      {GLOBAL_SHORTCUTS.UNDO.getDisplayText()}
                    </Keyboard>
                  </Item>
                  <Item key="redo" textValue="Redo">
                    <Icon>
                      <FontAwesomeIcon icon={vsBlank} />
                    </Icon>
                    <Text>Redo</Text>
                    <Keyboard>
                      {GLOBAL_SHORTCUTS.REDO.getDisplayText()}
                    </Keyboard>
                  </Item>
                </Section>
                <Section aria-label="More actions">
                  <Item key="showHidden" textValue="Show hidden columns">
                    <Icon>
                      <FontAwesomeIcon
                        icon={showHiddenColumns ? vsCheck : vsBlank}
                      />
                    </Icon>
                    <Text>Show hidden columns</Text>
                  </Item>
                </Section>
              </SpectrumMenu>
            </MenuTrigger>
          </div>
          <div className="top-menu">
            <Button
              kind="ghost"
              icon={vsRefresh}
              className="px-1"
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
              className="px-1"
              tooltip="Sort ascending"
              onClick={() => {
                this.handleSortColumns(
                  VisibilityOrderingBuilderInner.SORTING_OPTIONS.ASC
                );
              }}
            />
            <Button
              kind="ghost"
              icon={dhSortAlphaUp}
              className="px-1"
              tooltip="Sort descending"
              onClick={() => {
                this.handleSortColumns(
                  VisibilityOrderingBuilderInner.SORTING_OPTIONS.DSC
                );
              }}
            />
            <span className="vertical-divider" />
            <Button
              kind="ghost"
              className="px-1"
              tooltip="Create group from selection"
              disabled={!hasSelection}
              onClick={this.handleGroupCreate}
            >
              <span className="fa-layers">
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
              className="px-1"
              tooltip="Move selection up"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilderInner.MOVE_OPTIONS.UP
                );
              }}
              disabled={!hasSelection}
            />
            <Button
              kind="ghost"
              icon={vsChevronDown}
              className="px-1"
              tooltip="Move selection down"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilderInner.MOVE_OPTIONS.DOWN
                );
              }}
              disabled={!hasSelection}
            />
            <Button
              kind="ghost"
              icon={dhArrowToTop}
              className="px-1"
              tooltip="Move selection to top"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilderInner.MOVE_OPTIONS.TOP
                );
              }}
              disabled={!hasSelection}
            />
            <Button
              kind="ghost"
              icon={dhArrowToBottom}
              className="px-1"
              tooltip="Move selection to bottom"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilderInner.MOVE_OPTIONS.BOTTOM
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
      </SortableTreeDndContext>
    );
  }
}

// drag and drop display
const VisibilityOrderingBuilder = memo(
  (props: VisibilityOrderingBuilderProps) => {
    const {
      movedColumns,
      hiddenColumns,
      columnHeaderGroups,
      onMovedColumnsChanged,
      onColumnVisibilityChanged,
      onColumnHeaderGroupChanged,
      onFrozenColumnsChanged,
      // Used for unit tests only
      __testRef,
    } = props;

    const {
      set: setUndoState,
      undo,
      canUndo,
      redo,
      canRedo,
      state,
    } = useUndoRedo({
      movedColumns,
      hiddenColumns,
      columnHeaderGroups,
      frozenColumns: props.model.frozenColumns,
    });

    // On undo/redo, we need to ignore the prop change
    // because we are the ones updating the props
    const isUndoRedoAction = useRef(false);
    const isBatched = useRef(false);
    const startUndoGroup = useCallback(() => {
      isBatched.current = true;
    }, []);
    const endUndoGroup = useCallback(() => {
      isBatched.current = false;
    }, []);

    useEffect(() => {
      if (isUndoRedoAction.current) {
        onMovedColumnsChanged(state.movedColumns);
        onColumnVisibilityChanged(hiddenColumns, true);
        onColumnVisibilityChanged(state.hiddenColumns, false);
        onColumnHeaderGroupChanged(state.columnHeaderGroups);
        onFrozenColumnsChanged(state.frozenColumns);
        isUndoRedoAction.current = false;
      } else if (
        // If the parent props changed and it's not an undo/redo action, update the undo state
        !isBatched.current &&
        (movedColumns !== state.movedColumns ||
          columnHeaderGroups !== state.columnHeaderGroups ||
          hiddenColumns.length !== state.hiddenColumns.length ||
          hiddenColumns.some(
            (col, index) => col !== state.hiddenColumns[index]
          ))
      ) {
        setUndoState({
          movedColumns,
          hiddenColumns,
          columnHeaderGroups,
          frozenColumns: props.model.frozenColumns,
        });
      }
    }, [
      columnHeaderGroups,
      hiddenColumns,
      isBatched,
      movedColumns,
      onColumnHeaderGroupChanged,
      onColumnVisibilityChanged,
      onFrozenColumnsChanged,
      onMovedColumnsChanged,
      props.model.frozenColumns,
      setUndoState,
      state.columnHeaderGroups,
      state.frozenColumns,
      state.hiddenColumns,
      state.movedColumns,
    ]);

    const handleColumnHeaderGroupChanged = useCallback(
      (groups: readonly (dh.ColumnGroup | ColumnHeaderGroup)[]) => {
        if (groups !== columnHeaderGroups) {
          onColumnHeaderGroupChanged(
            // Updates which model indexes are in the groups if items were added/removed
            IrisGridUtils.parseColumnHeaderGroups(props.model, groups).groups
          );
        }
      },
      [columnHeaderGroups, onColumnHeaderGroupChanged, props.model]
    );

    const handleUndo = useCallback(() => {
      isUndoRedoAction.current = true;
      undo();
    }, [undo]);

    const handleRedo = useCallback(() => {
      isUndoRedoAction.current = true;
      redo();
    }, [redo]);

    return (
      <VisibilityOrderingBuilderInner
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        ref={__testRef}
        movedColumns={movedColumns}
        hiddenColumns={hiddenColumns}
        columnHeaderGroups={columnHeaderGroups}
        onMovedColumnsChanged={onMovedColumnsChanged}
        onColumnVisibilityChanged={onColumnVisibilityChanged}
        onColumnHeaderGroupChanged={handleColumnHeaderGroupChanged}
        undo={handleUndo}
        canUndo={canUndo}
        redo={handleRedo}
        canRedo={canRedo}
        startUndoGroup={startUndoGroup}
        endUndoGroup={endUndoGroup}
      />
    );
  }
);

VisibilityOrderingBuilder.displayName = 'VisibilityOrderingBuilder';

export default VisibilityOrderingBuilder;
