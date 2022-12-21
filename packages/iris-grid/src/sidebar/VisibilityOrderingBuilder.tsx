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
import Log from '@deephaven/log';
import clamp from 'lodash.clamp';
import throttle from 'lodash.throttle';
import './VisibilityOrderingBuilder.scss';
import IrisGridModel from '../IrisGridModel';
import { ColumnName } from '../CommonTypes';
import ColumnHeaderGroup from '../ColumnHeaderGroup';
import VisibilityOrderingItem from './visibility-ordering-builder/VisibilityOrderingItem';
import {
  FlattenedIrisGridTreeItem,
  flattenTree,
  getTreeItems,
  IrisGridTreeItem,
} from './visibility-ordering-builder/sortable-tree/utilities';
import { SortableTree } from './visibility-ordering-builder/sortable-tree/SortableTree';

const log = Log.module('VisibilityOrderingBuilder');
const DEBOUNCE_SEARCH_COLUMN = 150;

interface VisibilityOrderingBuilderProps {
  model: IrisGridModel;
  movedColumns: MoveOperation[];
  userColumnWidths: ModelSizeMap;
  onColumnVisibilityChanged: (
    columns: VisibleIndex[],
    isVisible: boolean
  ) => void;
  onMovedColumnsChanged: (operations: MoveOperation[], cb?: () => void) => void;
  onColumnHeaderGroupChanged: (groups: ColumnHeaderGroup[]) => void;
}

interface VisibilityOrderingBuilderState {
  selectedColumns: Set<string>;
  lastSelectedColumns: string[];
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

  static defaultProps = {
    movedColumns: [],
    onColumnVisibilityChanged: (): void => undefined,
    onMovedColumnsChanged: (): void => undefined,
  };

  constructor(props: VisibilityOrderingBuilderProps) {
    super(props);

    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.searchColumns = this.searchColumns.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleGroupMove = this.handleGroupMove.bind(this);
    this.handleGroupDelete = this.handleGroupDelete.bind(this);
    this.handleGroupNameChange = this.handleGroupNameChange.bind(this);
    this.handleGroupCreate = this.handleGroupCreate.bind(this);
    this.validateGroupName = this.validateGroupName.bind(this);

    this.state = {
      selectedColumns: new Set(),
      lastSelectedColumns: [],
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
      lastSelectedColumns: [],
      searchFilter: '',
    });
    model.setColumnHeaderGroups(model.layoutHints?.columnGroups);
    onMovedColumnsChanged(model.movedColumns);
    onColumnHeaderGroupChanged(model.getColumnHeaderGroups());
  }

  resetSelection(): void {
    this.setState({ selectedColumns: new Set(), lastSelectedColumns: [] });
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

  moveSelectedColumns(option: string): MoveOperation[] {
    const { selectedColumns } = this.state;
    if (selectedColumns.size === 0) {
      return [];
    }

    const treeItems = flattenTree(this.getTreeItems());
    let firstMovableIndex = this.getFirstMovableIndex();
    let lastMovableIndex = this.getLastMovableIndex();

    if (firstMovableIndex == null || lastMovableIndex == null) {
      return [];
    }

    const selectedColumnsSet = new Set(selectedColumns);

    // If a parent is selected, its children should move regardless of depth
    // The treeItems array will always be parent -> child in the order
    // Add all children before filtering for selected items
    treeItems.forEach(({ id, children }) => {
      if (selectedColumnsSet.has(id)) {
        children.forEach(child => selectedColumnsSet.add(child.id));
      }
    });
    const selectedItems = treeItems.filter(({ id }) =>
      selectedColumnsSet.has(id)
    );

    const isMovingUpward =
      option === VisibilityOrderingBuilder.MOVE_OPTIONS.UP ||
      option === VisibilityOrderingBuilder.MOVE_OPTIONS.TOP;

    // for moving up and to the top, move column(s) in visibility index order
    // for moving down and to the bottom, move column(s) in reverse visibility index order
    if (!isMovingUpward) {
      selectedItems.reverse();
    }

    let newMoves = [] as MoveOperation[];
    const movedColumnSet = new Set<string>(); // Track which columns have moved so we don't double moved nested items

    let moveToIndex = isMovingUpward ? firstMovableIndex : lastMovableIndex;

    for (let i = 0; i < selectedItems.length; i += 1) {
      const {
        id,
        parentId,
        index,
        data: { visibleIndex },
      } = selectedItems[i];

      // If the parent is selected, we will move the parent instead of the child item
      if (selectedColumnsSet.has(parentId ?? '')) {
        movedColumnSet.add(id);
      }

      if (!movedColumnSet.has(id)) {
        switch (option) {
          case VisibilityOrderingBuilder.MOVE_OPTIONS.TOP: {
            newMoves = GridUtils.moveItemOrRange(
              visibleIndex,
              moveToIndex,
              newMoves,
              true
            );
            const size = Array.isArray(visibleIndex)
              ? visibleIndex[1] - visibleIndex[0] + 1
              : 1;
            moveToIndex += size;
            this.moveToGroup(selectedItems[i], null);
            break;
          }
          case VisibilityOrderingBuilder.MOVE_OPTIONS.BOTTOM: {
            newMoves = GridUtils.moveItemOrRange(
              visibleIndex,
              moveToIndex,
              newMoves,
              true
            );
            const size = Array.isArray(visibleIndex)
              ? visibleIndex[1] - visibleIndex[0] + 1
              : 1;
            moveToIndex -= size;
            this.moveToGroup(selectedItems[i], null);
            break;
          }
          case VisibilityOrderingBuilder.MOVE_OPTIONS.UP: {
            const prevItem =
              treeItems[treeItems.findIndex(item => item.id === id) - 1];

            if (prevItem?.parentId !== parentId) {
              this.moveToGroup(selectedItems[i], prevItem.parentId);
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
            const nextItem =
              treeItems[treeItems.findIndex(item => item.id === id) + 1];

            // If not found, would end up as treeItems[-1 + 1]. First item isn't a valid next item anyway
            if (nextItem !== treeItems[0]) {
              if (nextItem?.parentId !== parentId) {
                this.moveToGroup(selectedItems[i], nextItem.parentId);
                break;
              } else if (nextItem?.children.length > 0) {
                this.moveToGroup(selectedItems[i], nextItem.id);
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
    }

    return newMoves;
  }

  handleMoveColumns(option: string): void {
    const { onMovedColumnsChanged, movedColumns } = this.props;

    const newMoves = this.moveSelectedColumns(option);
    let scrollListAfterMove: () => void = () => undefined;

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
      model.movedColumns
    );
    onMovedColumnsChanged(newMoves);
  }

  handleItemClick(
    name: string,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    removeSelectionOnClick = true
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

    const { selectedColumns, lastSelectedColumns } = this.state;
    const isModifierKeyDown = GridUtils.isModifierKeyDown(event);
    const isShiftKeyDown = event.shiftKey;
    const isSelected = selectedColumns.has(name);
    const columnsToBeAdded = [];

    if (isSelected && isModifierKeyDown) {
      this.removeColumnFromSelected(name);
      return;
    }

    if (isSelected && selectedColumns.size === 1 && removeSelectionOnClick) {
      this.removeColumnFromSelected(name);
      return;
    }

    if (isShiftKeyDown) {
      const movableItems = flattenTree(this.getTreeItems());

      const lastSelectedColumn =
        lastSelectedColumns[lastSelectedColumns.length - 1];

      const lastSelectedIndex = movableItems.findIndex(
        item => item.id === lastSelectedColumn
      );
      const selectedIndex = movableItems.findIndex(item => item.id === name);

      columnsToBeAdded.push(
        ...movableItems
          .slice(
            Math.min(lastSelectedIndex, selectedIndex),
            Math.max(lastSelectedIndex, selectedIndex) + 1
          )
          .map(item => item.id)
      );
    } else {
      columnsToBeAdded.push(name);
    }

    this.addColumnToSelected(
      columnsToBeAdded,
      isModifierKeyDown || isShiftKeyDown
    );
  }

  addColumnToSelected(columnsToBeAdded: string[], addToExisting = false): void {
    const { selectedColumns, lastSelectedColumns } = this.state;
    const newSelectedColumns = addToExisting
      ? [...selectedColumns.values()].concat(columnsToBeAdded)
      : columnsToBeAdded;
    const newLastSelectedColumns = addToExisting
      ? lastSelectedColumns.concat(columnsToBeAdded)
      : columnsToBeAdded;

    this.setState({
      selectedColumns: new Set(newSelectedColumns),
      lastSelectedColumns: newLastSelectedColumns,
    });
  }

  removeColumnFromSelected(name: string): void {
    const { selectedColumns, lastSelectedColumns } = this.state;

    selectedColumns.delete(name);
    const newLastSelectedColumns = lastSelectedColumns.filter(
      selected => selected !== name
    );

    this.setState({
      selectedColumns: new Set(selectedColumns),
      lastSelectedColumns: newLastSelectedColumns,
    });
  }

  handleGroupNameChange(group: ColumnHeaderGroup, newName: string): void {
    const { model, onColumnHeaderGroupChanged } = this.props;
    const columnGroups = model.getColumnHeaderGroups();
    const newGroups = [...columnGroups];

    const oldName = group.name;
    const newGroup = newGroups.find(({ name }) => name === oldName);

    if (newGroup) {
      newGroup.name = newName;
      newGroup.parent?.removeChildren([oldName]);
      newGroup.parent?.addChildren([newName]);
    }

    model.setColumnHeaderGroups(newGroups);
    onColumnHeaderGroupChanged(newGroups);
  }

  moveToGroup(item: FlattenedIrisGridTreeItem, toName: string | null): void {
    if (item.parentId === toName) {
      return;
    }

    const { model, onColumnHeaderGroupChanged } = this.props;

    const columnGroups = model.getColumnHeaderGroups();
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

    onColumnHeaderGroupChanged(newGroups);
  }

  handleGroupMove(
    from: FlattenedIrisGridTreeItem,
    to: FlattenedIrisGridTreeItem
  ): void {
    const { onMovedColumnsChanged, movedColumns } = this.props;

    this.moveToGroup(from, to.parentId);

    const fromIndex = from.data.visibleIndex;

    let toIndex = Array.isArray(to.data.visibleIndex)
      ? to.data.visibleIndex[0]
      : to.data.visibleIndex;

    // Dropping as first item in a group
    // Need to adjust visible index if dragging from before this group or it is off by 1
    if (
      to.children.length > 0 &&
      (Array.isArray(fromIndex) ? fromIndex[0] : fromIndex) < toIndex
    ) {
      toIndex -= 1;
    }

    onMovedColumnsChanged(
      GridUtils.moveItemOrRange(fromIndex, toIndex, movedColumns, true)
    );
  }

  handleGroupColorChange = throttle(
    (group: ColumnHeaderGroup, color: string | undefined): void => {
      const { model, onColumnHeaderGroupChanged } = this.props;
      const columnGroups = model.getColumnHeaderGroups();
      const newGroups = [...columnGroups];
      const newGroup = newGroups.find(({ name }) => name === group.name);
      if (!newGroup) {
        throw new Error(
          `Changed the color group that does not exist: ${group.name}`
        );
      }

      newGroup.color = color;

      model.setColumnHeaderGroups(newGroups);
      onColumnHeaderGroupChanged(newGroups);
    },
    250
  );

  handleGroupDelete(group: ColumnHeaderGroup): void {
    const { model, onColumnHeaderGroupChanged } = this.props;
    const columnGroups = model.getColumnHeaderGroups();
    const newGroups = columnGroups.filter(g => g.name !== group.name);
    const newParent = newGroups.find(g => g.name === group.parent?.name);
    if (newParent !== undefined) {
      newParent.addChildren(group.children);
      newParent.removeChildren([group.name]);
    }
    model.setColumnHeaderGroups(newGroups);
    onColumnHeaderGroupChanged(newGroups);
  }

  handleGroupCreate(): void {
    const { selectedColumns } = this.state;
    const { model, onColumnHeaderGroupChanged } = this.props;
    const columnGroupMap = model.getColumnHeaderGroupMap();
    const newGroups = [...columnGroupMap.values()];

    this.handleMoveColumns(VisibilityOrderingBuilder.MOVE_OPTIONS.TOP);

    const selectedColumnsArray = [...selectedColumns.values()];
    const childIndexes = selectedColumnsArray
      .map(childName => {
        const group = columnGroupMap.get(childName);
        if (group) {
          return group.childIndexes.flat();
        }

        return model.getColumnIndexByName(childName) ?? -1;
      })
      .filter(index => index >= 0);

    // We don't care about this name really as long as it's unique
    // The user must change it and we display a placeholder instead
    const name = `:newGroup-${Date.now()}`;

    const newGroup = new ColumnHeaderGroup({
      name,
      children: selectedColumnsArray,
      depth: 0,
      childIndexes,
    });

    newGroups.push(newGroup);

    model.setColumnHeaderGroups(newGroups);
    onColumnHeaderGroupChanged(newGroups);
    this.resetSelection();
  }

  /**
   * Validates if a header group name is valid and not in use by any header groups or columns
   * @param groupName The name to validate
   * @returns True if the name is valid and not in use
   */
  validateGroupName(groupName: string): boolean {
    const { model } = this.props;
    const columnGroups = model.getColumnHeaderGroups();
    const { columns } = model;
    return (
      DbNameValidator.isValidColumnName(groupName) &&
      columns.every(({ name }) => name !== groupName) &&
      columnGroups.every(({ name }) => name !== groupName)
    );
  }

  renderItem = memoize(
    ({
      value,
      clone,
      childCount = 0,
      item,
      ref,
      handleProps,
    }: {
      value: string;
      clone: boolean;
      childCount?: number;
      item: IrisGridTreeItem;
      ref: React.Ref<HTMLDivElement> | null;
      handleProps: unknown;
    }) => {
      const { onColumnVisibilityChanged } = this.props;

      return (
        <VisibilityOrderingItem
          ref={ref}
          value={value}
          clone={clone}
          item={item}
          childCount={childCount}
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
    const { model, movedColumns, userColumnWidths } = this.props;
    const { selectedColumns } = this.state;

    return this.memoizedGetTreeItems(
      model,
      movedColumns,
      model.getColumnHeaderGroups(),
      userColumnWidths,
      selectedColumns
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
            defaultItems={movableItems}
            renderItem={this.renderItem}
            onChange={this.handleGroupMove}
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
    const areAllVisible = GridUtils.checkAllColumnsHidden(
      columnsToToggle,
      userColumnWidths
    );
    const selectedToggleText = areAllVisible
      ? 'Show Selected'
      : 'Hide Selected';

    const visibilityOrderingList = this.makeVisibilityOrderingList(treeItems);

    return (
      <div role="menu" className="visibility-ordering-builder" tabIndex={0}>
        <div className="top-menu">
          <Button
            kind="ghost"
            className="toggle-visibility-btn"
            onClick={() => {
              onColumnVisibilityChanged(columnsToToggle, !areAllVisible);
            }}
            icon={areAllVisible ? dhEyeSlash : dhEye}
            tooltip="Toggle column visibility"
          >
            {!hasSelection ? 'Toggle All' : selectedToggleText}
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
