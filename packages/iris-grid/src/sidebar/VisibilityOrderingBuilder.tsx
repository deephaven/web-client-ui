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
  vsGripper,
} from '@deephaven/icons';
import memoize from 'memoizee';
import debounce from 'lodash.debounce';
import {
  Button,
  SearchInput,
  ThemeExport,
  Tooltip,
} from '@deephaven/components';
import type { Column } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import throttle from 'lodash.throttle';
import './VisibilityOrderingBuilder.scss';
import IrisGridModel from '../IrisGridModel';
import { ColumnName } from '../CommonTypes';
import ColumnHeaderGroup from '../ColumnHeaderGroup';
import VisibilityOrderingGroup from './visibility-ordering-builder/VisibilityOrderingGroup';
import {
  FlattenedIrisGridTreeItem,
  getTreeItems,
  IrisGridTreeItem,
} from './visibility-ordering-builder/sortable-tree/utilities';
import { SortableTree } from './visibility-ordering-builder/sortable-tree/SortableTree';
import styles from './visibility-ordering-builder/sortable-tree/TreeItem.module.scss';

const log = Log.module('VisibilityOrderingBuilder');
const DEBOUNCE_SEARCH_COLUMN = 150;

interface VisibilityOrderingBuilderProps {
  model: IrisGridModel;
  movedColumns: MoveOperation[];
  userColumnWidths: ModelSizeMap;
  onColumnVisibilityChanged: (
    columns: VisibleIndex[],
    options?: VisibilityOptionType
  ) => void;
  onMovedColumnsChanged: (operations: MoveOperation[], cb?: () => void) => void;
  onColumnHeaderGroupChanged: (groups: ColumnHeaderGroup[]) => void;
}

interface VisibilityOrderingBuilderState {
  selectedColumns: ModelIndex[]; // model index of selected column(s)
  lastSelectedColumns: ModelIndex[];
  isDraggingVisibility: boolean;
  visibilityDraggingOption?: VisibilityOptionType;
  visibilityDraggingStartColumn: number | null;
  searchFilter: string;
}

type Values<T> = T[keyof T];

export type VisibilityOptionType = Values<
  typeof VisibilityOrderingBuilder.VISIBILITY_OPTIONS
>;

class VisibilityOrderingBuilder extends Component<
  VisibilityOrderingBuilderProps,
  VisibilityOrderingBuilderState
> {
  static VISIBILITY_OPTIONS = { SHOW: 'SHOW', HIDE: 'HIDE' } as const;

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
    this.handleGroupMove = this.handleGroupMove.bind(this);
    this.handleGroupDelete = this.handleGroupDelete.bind(this);
    this.handleGroupNameChange = this.handleGroupNameChange.bind(this);
    this.validateGroupName = this.validateGroupName.bind(this);
    // this.handleGroupColorChange = this.handleGroupColorChange.bind(this);

    this.state = {
      selectedColumns: [], // model index of selected column(s)
      lastSelectedColumns: [],
      isDraggingVisibility: false,
      visibilityDraggingOption: undefined,
      visibilityDraggingStartColumn: null,
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
      VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
    );
    this.setState({
      selectedColumns: [],
      lastSelectedColumns: [],
      searchFilter: '',
    });
    onMovedColumnsChanged(model.movedColumns);
    model.setColumnHeaderGroups(model.layoutHints?.columnGroups);
    onColumnHeaderGroupChanged(model.getColumnHeaderGroups());
  }

  resetSelection(): void {
    this.setState({ selectedColumns: [], lastSelectedColumns: [] });
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
    const { model, movedColumns } = this.props;
    const { columns } = model;

    const columnsMatch = [] as number[];
    let visibleIndexToFocus = columns.length;
    columns.forEach((column, index) => {
      const columnName = column.name.toLowerCase();
      if (
        model.isColumnMovable(index) &&
        columnName.includes(searchFilter.toLowerCase())
      ) {
        columnsMatch.push(index);
        visibleIndexToFocus = Math.min(
          visibleIndexToFocus,
          GridUtils.getVisibleIndex(index, movedColumns)
        );
      }
    });
    this.addColumnToSelected(columnsMatch, false);
    if (columnsMatch.length > 0) {
      const columnItemToFocus = this.list?.querySelectorAll('.column-item')[
        visibleIndexToFocus
      ];
      columnItemToFocus?.scrollIntoView({ block: 'center' });
    }
  }

  handleVisibilityKeyDown(
    modelIndex: ModelIndex,
    visibilityOption: VisibilityOptionType
  ): void {
    const { onColumnVisibilityChanged } = this.props;
    onColumnVisibilityChanged([modelIndex], visibilityOption);
  }

  handleVisibilityDraggingStart(
    modelIndex: ModelIndex,
    visibilityOption: VisibilityOptionType,
    event: React.MouseEvent
  ): void {
    const { onColumnVisibilityChanged, movedColumns } = this.props;

    const isModifierKeyDown = GridUtils.isModifierKeyDown(event);
    const isShiftKeyDown = event.shiftKey;

    if (isModifierKeyDown || isShiftKeyDown) return;

    onColumnVisibilityChanged([modelIndex], visibilityOption);

    const visibleIndex = GridUtils.getVisibleIndex(modelIndex, movedColumns);

    this.setState({
      isDraggingVisibility: true,
      visibilityDraggingOption: visibilityOption,
      visibilityDraggingStartColumn: visibleIndex,
    });

    this.addColumnToSelected([modelIndex]);
  }

  handleVisibilityDraggingEnd(event: React.MouseEvent | null = null): void {
    if (event) (event.target as HTMLButtonElement).focus();

    const { isDraggingVisibility } = this.state;
    if (isDraggingVisibility) {
      this.setState({
        isDraggingVisibility: false,
        visibilityDraggingOption: undefined,
        visibilityDraggingStartColumn: null,
      });
    }
  }

  handleMouseEnter(
    targetModelIndex: ModelIndex,
    event: React.MouseEvent
  ): void {
    const {
      onColumnVisibilityChanged,
      movedColumns,
      userColumnWidths,
    } = this.props;
    const {
      isDraggingVisibility,
      visibilityDraggingOption,
      visibilityDraggingStartColumn: draggingStartVisibleIndex,
    } = this.state;
    const targetVisibleIndex = GridUtils.getVisibleIndex(
      targetModelIndex,
      movedColumns
    );
    const isModifierKeyDown = GridUtils.isModifierKeyDown(event);
    const isShiftKeyDown = event.shiftKey;

    if (!isDraggingVisibility || isModifierKeyDown || isShiftKeyDown) {
      return;
    }

    (event.target as HTMLButtonElement).focus();

    // browser can skip mouseEnter / mouseMove event if user moves the mouse too fast
    // try to check columns between dragging start index to current index to compensate missing event,
    const columnsToChangeVisibility = [targetModelIndex];
    assertNotNull(draggingStartVisibleIndex);
    const checkDownward = targetVisibleIndex > draggingStartVisibleIndex;

    for (
      let visibleIndexToCheck = draggingStartVisibleIndex;
      checkDownward
        ? visibleIndexToCheck < targetVisibleIndex
        : visibleIndexToCheck > targetVisibleIndex;
      checkDownward ? (visibleIndexToCheck += 1) : (visibleIndexToCheck -= 1)
    ) {
      const modelIndexToCheck = GridUtils.getModelIndex(
        visibleIndexToCheck,
        movedColumns
      );
      const isHidden = GridUtils.checkColumnHidden(
        modelIndexToCheck,
        userColumnWidths
      );
      if (
        isHidden &&
        visibilityDraggingOption ===
          VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
      ) {
        columnsToChangeVisibility.push(modelIndexToCheck);
      } else if (
        !isHidden &&
        visibilityDraggingOption ===
          VisibilityOrderingBuilder.VISIBILITY_OPTIONS.HIDE
      ) {
        columnsToChangeVisibility.push(modelIndexToCheck);
      }
    }

    this.addColumnToSelected(columnsToChangeVisibility, true);

    onColumnVisibilityChanged(
      columnsToChangeVisibility,
      visibilityDraggingOption
    );
  }

  handleMoveColumns(option: string): void {
    const { movedColumns, onMovedColumnsChanged, model } = this.props;
    const { columns } = model;
    const { selectedColumns } = this.state;
    if (selectedColumns.length === 0) {
      return;
    }

    const firstMovableIndex = this.getFirstMovableIndex(
      model,
      columns,
      movedColumns
    );
    const lastMovableIndex = this.getLastMovableIndex(
      model,
      columns,
      movedColumns
    );
    if (firstMovableIndex == null || lastMovableIndex == null) {
      return;
    }

    // for moving up and to the top, move column(s) in visibility index order
    // for moving down and to the bottom, move column(s) in reverse visibility index order
    const sortedSelectedColumns = [
      ...selectedColumns,
    ].sort((columnA, columnB) =>
      option === VisibilityOrderingBuilder.MOVE_OPTIONS.TOP ||
      option === VisibilityOrderingBuilder.MOVE_OPTIONS.UP
        ? GridUtils.getVisibleIndex(columnA, movedColumns) -
          GridUtils.getVisibleIndex(columnB, movedColumns)
        : GridUtils.getVisibleIndex(columnB, movedColumns) -
          GridUtils.getVisibleIndex(columnA, movedColumns)
    );

    let newMoves = [] as MoveOperation[];
    let scrollListAfterMove: () => void = () => undefined;

    switch (option) {
      case VisibilityOrderingBuilder.MOVE_OPTIONS.TOP:
        sortedSelectedColumns.forEach((columnModelIndex, index) => {
          const visibleIndex = GridUtils.getVisibleIndex(
            columnModelIndex,
            movedColumns
          );
          newMoves = GridUtils.moveItem(
            visibleIndex,
            firstMovableIndex + index,
            newMoves
          );
        });
        scrollListAfterMove = () => {
          assertNotNull(this.list);
          this.list.parentElement?.scroll({ top: 0 });
        };
        break;
      case VisibilityOrderingBuilder.MOVE_OPTIONS.BOTTOM:
        sortedSelectedColumns.forEach((columnModelIndex, index) => {
          const visibleIndex = GridUtils.getVisibleIndex(
            columnModelIndex,
            movedColumns
          );
          newMoves = GridUtils.moveItem(
            visibleIndex,
            lastMovableIndex - index,
            newMoves
          );
        });
        scrollListAfterMove = () => {
          assertNotNull(this.list);
          this.list.parentElement?.scroll({
            top: this.list.parentElement.scrollHeight,
          });
        };

        break;
      case VisibilityOrderingBuilder.MOVE_OPTIONS.UP:
        if (
          GridUtils.getVisibleIndex(sortedSelectedColumns[0], movedColumns) !==
          firstMovableIndex // check if the first visible column has reached top
        ) {
          sortedSelectedColumns.forEach(columnModelIndex => {
            const visibleIndex = GridUtils.getVisibleIndex(
              columnModelIndex,
              movedColumns
            );
            newMoves = GridUtils.moveItem(
              visibleIndex,
              visibleIndex - 1,
              newMoves
            );
          });
        }
        break;
      case VisibilityOrderingBuilder.MOVE_OPTIONS.DOWN:
        if (
          GridUtils.getVisibleIndex(sortedSelectedColumns[0], movedColumns) !==
          lastMovableIndex // check if the last visible column has reached bottom
        ) {
          sortedSelectedColumns.forEach(columnModelIndex => {
            const visibleIndex = GridUtils.getVisibleIndex(
              columnModelIndex,
              movedColumns
            );
            newMoves = GridUtils.moveItem(
              visibleIndex,
              visibleIndex + 1,
              newMoves
            );
          });
        }
        break;
      default:
        break;
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
    const {
      model,
      movedColumns,
      onMovedColumnsChanged,
      userColumnWidths,
    } = this.props;
    const movableItems = getTreeItems(model, movedColumns, userColumnWidths);
    const newMoves = this.getSortMoves(
      movableItems,
      option,
      model.movedColumns
    );
    onMovedColumnsChanged(newMoves);
  }

  handleItemClick(
    modelIndexClicked: ModelIndex | ModelIndex[],
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    removeSelectionOnClick = true
  ): void {
    event.stopPropagation();
    event.currentTarget.focus();

    const { selectedColumns, lastSelectedColumns } = this.state;
    const isModifierKeyDown = GridUtils.isModifierKeyDown(event);
    const isShiftKeyDown = event.shiftKey;
    const isSelected = selectedColumns.includes(modelIndexClicked);
    const columnsToBeAdded = [modelIndexClicked];

    if (isSelected && isModifierKeyDown) {
      this.removeColumnFromSelected(modelIndexClicked);
      return;
    }

    if (isSelected && selectedColumns.length === 1 && removeSelectionOnClick) {
      this.removeColumnFromSelected(modelIndexClicked);
      return;
    }

    if (isShiftKeyDown) {
      const { movedColumns } = this.props;
      const lastSelectedColumn =
        lastSelectedColumns[lastSelectedColumns.length - 1];
      const lastSelectedColumnVisibleIndex = GridUtils.getVisibleIndex(
        lastSelectedColumn,
        movedColumns
      );
      const visibleIndexToBeSelected = GridUtils.getVisibleIndex(
        modelIndexClicked,
        movedColumns
      );
      const checkDownward =
        visibleIndexToBeSelected > lastSelectedColumnVisibleIndex;
      const columnsInBetween = [];
      for (
        let i = lastSelectedColumnVisibleIndex;
        checkDownward
          ? i < visibleIndexToBeSelected
          : i > visibleIndexToBeSelected;
        checkDownward ? (i += 1) : (i -= 1)
      ) {
        columnsInBetween.push(GridUtils.getModelIndex(i, movedColumns));
      }
      columnsInBetween.forEach(column => {
        if (!selectedColumns.includes(column)) {
          columnsToBeAdded.push(column);
        }
      });
    }

    this.addColumnToSelected(
      columnsToBeAdded,
      isModifierKeyDown || isShiftKeyDown
    );
  }

  addColumnToSelected(
    columnsToBeAdded: ModelIndex[],
    addToExisting = false
  ): void {
    const { selectedColumns, lastSelectedColumns } = this.state;
    const newSelectedColumns = addToExisting
      ? selectedColumns.concat(columnsToBeAdded)
      : columnsToBeAdded;
    const newLastSelectedColumns = addToExisting
      ? lastSelectedColumns.concat(columnsToBeAdded)
      : columnsToBeAdded;

    this.setState({
      selectedColumns: newSelectedColumns,
      lastSelectedColumns: newLastSelectedColumns,
    });
  }

  removeColumnFromSelected(modelIndex: ModelIndex): void {
    const { selectedColumns, lastSelectedColumns } = this.state;
    const newSelectedColumns = [...selectedColumns];

    newSelectedColumns.splice(
      newSelectedColumns.findIndex(selected => selected === modelIndex),
      1
    );
    const lastSelectedColumn =
      lastSelectedColumns[lastSelectedColumns.length - 1];
    const newLastSelectedColumns = [...lastSelectedColumns];
    if (lastSelectedColumn === modelIndex) {
      newLastSelectedColumns.pop();
    }
    this.setState({
      selectedColumns: newSelectedColumns,
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

  handleGroupMove(
    from: FlattenedIrisGridTreeItem,
    to: FlattenedIrisGridTreeItem
  ): void {
    const {
      model,
      onMovedColumnsChanged,
      onColumnHeaderGroupChanged,
      movedColumns,
    } = this.props;

    if (from.parentId !== to.parentId) {
      const columnGroups = model.getColumnHeaderGroups();
      let newGroups = [...columnGroups];
      const fromGroup = newGroups.find(g => g.name === from.parentId);
      const toGroup = newGroups.find(g => g.name === to.parentId);

      if (fromGroup != null) {
        // Moved out of a group
        fromGroup.children = fromGroup.children.filter(
          name => name !== from.id
        );

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
        toGroup.addChildren([from.id.toString()]);
      }

      model.setColumnHeaderGroups(newGroups);
      onColumnHeaderGroupChanged(newGroups);
    }

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
      Array.isArray(fromIndex)
        ? GridUtils.moveRange(fromIndex, toIndex, movedColumns, true)
        : GridUtils.moveItem(fromIndex, toIndex, movedColumns)
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

  handleGroupCreate(childIndexes: number[]): void {
    const { model, onColumnHeaderGroupChanged } = this.props;
    const columnGroupMap = model.getColumnHeaderGroupMap();
    const newGroups = [...columnGroupMap.values()];

    // TODO: Change to name based so you can seed with groups
    // TODO: Remove children from their parents
    // const childIndexes = children
    //   .map(childName => {
    //     const group = columnGroupMap.get(childName);
    //     if (group) {
    //       return group.childIndexes.flat();
    //     }

    //     return model.getColumnIndexByName(childName) ?? -1;
    //   })
    //   .filter(index => index >= 0);

    // TODO: Make this check if it's already in use
    const name = 'NewGroup';

    const children = childIndexes.map(i => model.columns[i].name);

    const newGroup = new ColumnHeaderGroup({
      name,
      children,
      depth: 0,
      childIndexes,
    });

    newGroups.push(newGroup);

    model.setColumnHeaderGroups(newGroups);
    onColumnHeaderGroupChanged(newGroups);
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
      childCount,
      item,
    }: {
      value: string;
      clone: boolean;
      childCount: number;
      item: IrisGridTreeItem;
    }) => {
      const { onColumnVisibilityChanged } = this.props;
      const { group, modelIndex, hidden } = item.data;

      return (
        <>
          <Button
            kind="ghost"
            className="px-1"
            onClick={() =>
              onColumnVisibilityChanged(
                [modelIndex].flat(),
                hidden
                  ? VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
                  : VisibilityOrderingBuilder.VISIBILITY_OPTIONS.HIDE
              )
            }
            // onKeyDown={visibilityOnKeyDown}
            icon={hidden ? dhEyeSlash : dhEye}
            tooltip="Toggle visibility"
          />
          <span
            className="column-name"
            style={{ flexGrow: 1 }}
            onClick={e => this.handleItemClick(modelIndex, e)}
          >
            {group ? (
              <VisibilityOrderingGroup
                group={group}
                onDelete={this.handleGroupDelete}
                onColorChange={this.handleGroupColorChange}
                onNameChange={this.handleGroupNameChange}
                validateName={this.validateGroupName}
                isNew={modelIndex === -1}
              />
            ) : (
              value
            )}
          </span>
          <div>
            {clone && childCount > 1 && (
              <span className={styles.Count}>{childCount}</span>
            )}
            <Tooltip>Drag to re-order</Tooltip>
            <FontAwesomeIcon icon={vsGripper} />
          </div>
        </>
      );
    }
  );

  makeVisibilityOrderingList = memoize(
    (
      movedColumns: MoveOperation[],
      columnHeaderGroups: ColumnHeaderGroup[],
      userColumnWidths: ModelSizeMap,
      selectedColumns: ModelIndex[]
    ) => {
      const { model } = this.props;
      const { columns } = model;

      const elements = [];
      const movableItems = getTreeItems(
        model,
        movedColumns,
        userColumnWidths,
        selectedColumns
      );

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
    }
  );

  /**
   * Gets the first movable visible index
   */
  getFirstMovableIndex = memoize(
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
   * Gets the last movable visible index
   */
  getLastMovableIndex = memoize(
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
    const {
      model,
      userColumnWidths,
      onColumnVisibilityChanged,
      movedColumns,
    } = this.props;
    const { selectedColumns, searchFilter } = this.state;
    const { columns } = model;
    const noSelection = selectedColumns.length === 0;
    const columnsToToggle = noSelection
      ? columns.map((c, i) => i).filter(i => model.isColumnMovable(i))
      : [...selectedColumns];
    const toggleToShow = GridUtils.checkAllColumnsHidden(
      columnsToToggle,
      userColumnWidths
    );
    const selectedToggleText = toggleToShow ? 'Show Selected' : 'Hide Selected';

    const columnItems = this.makeVisibilityOrderingList(
      movedColumns,
      model.getColumnHeaderGroups(),
      userColumnWidths,
      selectedColumns
    );

    return (
      <div
        role="menu"
        className="visibility-ordering-builder"
        tabIndex={0}
        onMouseUp={() => {
          this.handleVisibilityDraggingEnd();
        }}
        onMouseLeave={() => {
          this.handleVisibilityDraggingEnd();
        }}
      >
        <div className="top-menu">
          <Button
            kind="ghost"
            className="toggle-visibility-btn"
            onClick={() => {
              onColumnVisibilityChanged(
                columnsToToggle,
                toggleToShow
                  ? VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
                  : VisibilityOrderingBuilder.VISIBILITY_OPTIONS.HIDE
              );
            }}
            icon={toggleToShow ? dhEyeSlash : dhEye}
            tooltip="Toggle column visibility"
          >
            {noSelection ? 'Toggle All' : selectedToggleText}
          </Button>

          <SearchInput
            className="visibility-search"
            value={searchFilter}
            matchCount={searchFilter ? selectedColumns.length : undefined}
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
            tooltip={
              selectedColumns.length === 0
                ? 'Select items to create group'
                : 'Create group'
            }
            disabled={selectedColumns.length === 0}
            onClick={() => this.handleGroupCreate(selectedColumns)}
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
                color={ThemeExport.white}
              />
            </span>
            Group
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
            icon={vsChevronUp}
            tooltip="Move selection upppp"
            onClick={() => {
              this.handleMoveColumns(VisibilityOrderingBuilder.MOVE_OPTIONS.UP);
            }}
            disabled={noSelection}
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
            disabled={noSelection}
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
            disabled={noSelection}
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
            disabled={noSelection}
          />
        </div>

        <div role="menu" className={classNames('visibility-ordering-list')}>
          <div
            className="column-list"
            ref={list => {
              this.list = list;
            }}
          >
            {columnItems}
          </div>
        </div>
      </div>
    );
  }
}

export default VisibilityOrderingBuilder;
