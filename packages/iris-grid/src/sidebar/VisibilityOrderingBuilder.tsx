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
import { TextUtils, assertNotNull } from '@deephaven/utils';
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
  vsGripper,
  vsSymbolStructure,
  vsRefresh,
  dhNewCircleLargeFilled,
  vsCircleFilled,
  vsCircleLargeFilled,
  vsAdd,
} from '@deephaven/icons';
import {
  DragDropContext,
  Draggable,
  DragStart,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
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
import './VisibilityOrderingBuilder.scss';
import IrisGridModel from '../IrisGridModel';
import { ColumnName } from '../CommonTypes';

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
}

interface VisibilityOrderingBuilderState {
  selectedColumns: ModelIndex[]; // model index of selected column(s)
  lastSelectedColumns: ModelIndex[];
  isDraggingVisibility: boolean;
  visibilityDraggingOption?: VisibilityOptionType;
  visibilityDraggingStartColumn: number | null;
  isDraggingOrder: boolean;
  orderDraggingColumn: number | null;
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
    this.handleOrderDraggingStart = this.handleOrderDraggingStart.bind(this);
    this.handleOrderDraggingEnd = this.handleOrderDraggingEnd.bind(this);

    this.state = {
      selectedColumns: [], // model index of selected column(s)
      lastSelectedColumns: [],
      isDraggingVisibility: false,
      visibilityDraggingOption: undefined,
      visibilityDraggingStartColumn: null,
      isDraggingOrder: false,
      orderDraggingColumn: null,
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
  }

  resetSelection(): void {
    const { isDraggingOrder } = this.state;
    // don't reset selection if user is dragging column(s)
    if (isDraggingOrder) {
      return;
    }
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
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
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

  handleVisibilityDraggingEnd(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null = null
  ): void {
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

  handleOrderDraggingStart(start: DragStart): void {
    document.documentElement.classList.add('drag-pointer-events-none');

    const { selectedColumns } = this.state;
    const {
      draggableId,
      source: { index: startIndex },
    } = start;
    const orderDraggingColumn = parseInt(draggableId, 10);

    // we want to clear focus from any eye toggles
    // however to maintain react-beautiful-dnd keyboard functionality the only valid
    // focus target is the drag target itself, so we set it there instead of blurring
    (this.list?.querySelectorAll('.column-item')[
      startIndex
    ] as HTMLDivElement).focus();

    if (!selectedColumns.includes(orderDraggingColumn)) {
      this.setState({
        isDraggingOrder: true,
        orderDraggingColumn,
        selectedColumns: [orderDraggingColumn],
      });
      return;
    }
    this.setState({ isDraggingOrder: true, orderDraggingColumn });
  }

  handleOrderDraggingEnd(result: DropResult): void {
    document.documentElement.classList.remove('drag-pointer-events-none');

    const { movedColumns, onMovedColumnsChanged } = this.props;
    const { selectedColumns, orderDraggingColumn } = this.state;

    // reset dragging state
    this.setState({ isDraggingOrder: false, orderDraggingColumn: null });

    // if dropped outside the list, re-focus on the dragged item if necessary
    if (!result.destination) {
      return;
    }

    const { index: destinationIndex } = result.destination;

    const selectedColumnsSortByVisibleIndex = [...selectedColumns].sort(
      (columnA, columnB) =>
        GridUtils.getVisibleIndex(columnA, movedColumns) -
        GridUtils.getVisibleIndex(columnB, movedColumns)
    );

    let newMoves = [...movedColumns];
    assertNotNull(orderDraggingColumn);
    const draggingVisibleIndex = GridUtils.getVisibleIndex(
      orderDraggingColumn,
      newMoves
    );
    const upper: number[] = [];
    const lower: number[] = [];

    // move the dragged column to destination first,
    newMoves = GridUtils.moveItem(
      draggingVisibleIndex,
      destinationIndex,
      newMoves
    );

    // split selected columns into two parts on drop destination index: top & bottom
    selectedColumnsSortByVisibleIndex.forEach(column => {
      const columnVisibleIndex = GridUtils.getVisibleIndex(column, newMoves);
      if (column === orderDraggingColumn) {
        return;
      }
      if (columnVisibleIndex < destinationIndex) {
        upper.push(column);
      } else {
        lower.push(column);
      }
    });

    // for the top part, move column(s) to the destination index
    upper.forEach(column => {
      const visibleIndex = GridUtils.getVisibleIndex(column, newMoves);
      newMoves = GridUtils.moveItem(visibleIndex, destinationIndex, newMoves);
    });

    // for the bottom part, in reverse order, move column(s) to the drop destination index if there's no top column(s) or the dragged column is not dropped upside
    // otherwise, move column(s) under the dropping destination index
    const bottomDestinationIndex =
      upper.length > 0 || draggingVisibleIndex > destinationIndex
        ? destinationIndex + 1
        : destinationIndex;

    lower.reverse().forEach(column => {
      const visibleIndex = GridUtils.getVisibleIndex(column, newMoves);
      newMoves = GridUtils.moveItem(
        visibleIndex,
        bottomDestinationIndex,
        newMoves
      );
    });

    onMovedColumnsChanged(newMoves);
    log.debug('move column order by drag & drop', newMoves);
  }

  handleMouseEnter(
    targetModelIndex: ModelIndex,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
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

  handleSortColumns(option: string): void {
    const { model, movedColumns, onMovedColumnsChanged } = this.props;
    const { columns } = model;
    const firstIndex =
      this.getFirstMovableIndex(model, columns, movedColumns) ?? 0;
    const lastIndex =
      this.getLastMovableIndex(model, columns, movedColumns) ??
      columns.length - 1;

    const modelIndexes = GridUtils.getModelIndexes(
      Array(columns.length)
        .fill(0)
        .map((_, i) => i),
      movedColumns
    );

    // We can't move the immovable columns when sorting, so separate them out first
    const frontImmovable = modelIndexes.slice(0, firstIndex);
    const backImmovable = modelIndexes.slice(lastIndex + 1);
    const movableColumns = modelIndexes.slice(firstIndex, lastIndex + 1);

    // Sort all the movable columns
    const isAscending =
      option === VisibilityOrderingBuilder.SORTING_OPTIONS.ASC;
    const movableColumnsSorted = movableColumns.sort((a, b) => {
      const aName = columns[a].name.toUpperCase();
      const bName = columns[b].name.toUpperCase();
      return TextUtils.sort(aName, bName, isAscending);
    });

    // Place all the immovable columns where they need to be
    const modelIndexAlphaSorted = frontImmovable.concat(
      movableColumnsSorted,
      backImmovable
    );

    let newMoves = [] as MoveOperation[];
    modelIndexAlphaSorted.forEach((modelIndex, index) => {
      const visibleIndex = GridUtils.getVisibleIndex(modelIndex, newMoves);
      newMoves = GridUtils.moveItem(visibleIndex, index, newMoves);
    });
    onMovedColumnsChanged(newMoves);
  }

  handleItemClick(
    modelIndexClicked: ModelIndex,
    event: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>,
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

  makeVisibilityOrderingList(): ReactElement[] {
    const { model, userColumnWidths, movedColumns } = this.props;
    const { columns } = model;
    const {
      selectedColumns,
      isDraggingOrder,
      orderDraggingColumn,
    } = this.state;

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
        elements.push(<hr />);
      }
      if (isMovable) {
        const isHidden = userColumnWidths.get(modelIndex) === 0;
        const isSelected = selectedColumns.includes(modelIndex);
        const isDragged = orderDraggingColumn === modelIndex;
        const columnsDragged =
          isDraggingOrder && isDragged && selectedColumns.length > 1
            ? selectedColumns.length
            : null;
        elements.push(
          this.renderVisibilityOrderingItem(
            column.name,
            modelIndex,
            visibleIndex,
            isHidden,
            isSelected,
            isDraggingOrder,
            isDragged,
            columnsDragged
          )
        );
      } else {
        elements.push(this.renderImmovableItem(column.name));
      }

      wasMovable = isMovable;
    }

    return elements;
  }

  /**
   * Gets the first movable visible index
   */
  getFirstMovableIndex = memoize((model: IrisGridModel, columns: Column[]) => {
    for (let i = 0; i < columns.length; i += 1) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns);
      if (model.isColumnMovable(modelIndex)) {
        return i;
      }
    }

    return null;
  });

  /**
   * Gets the last movable visible index
   */
  getLastMovableIndex = memoize((model: IrisGridModel, columns: Column[]) => {
    for (let i = columns.length - 1; i >= 0; i -= 1) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns);
      if (model.isColumnMovable(modelIndex)) {
        return i;
      }
    }

    return null;
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

  renderVisibilityOrderingItem = memoize(
    (
      columnName: ColumnName,
      modelIndex: ModelIndex,
      visibleIndex: VisibleIndex,
      isHidden: boolean,
      isSelected: boolean,
      isDragging: boolean,
      isDragged: boolean,
      columnsDragged: number | null
    ) => (
      <Draggable
        draggableId={`${modelIndex}`} // draggableId requires string input
        index={visibleIndex}
        key={columnName}
        disableInteractiveElementBlocking
      >
        {provided => (
          <div
            className="visibility-ordering-list-item"
            ref={provided.innerRef}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.draggableProps}
          >
            <Button
              kind="ghost"
              className="btn-link-icon visibility"
              onMouseDown={event => {
                this.handleVisibilityDraggingStart(
                  modelIndex,
                  isHidden
                    ? VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
                    : VisibilityOrderingBuilder.VISIBILITY_OPTIONS.HIDE,
                  event
                );
              }}
              onMouseEnter={event => {
                this.handleMouseEnter(modelIndex, event);
              }}
              onMouseUp={event => {
                this.handleVisibilityDraggingEnd(event);
              }}
              onClick={event => {
                this.handleItemClick(modelIndex, event, false);
              }}
              onKeyDown={event => {
                // trigger on keyboard enter or space keys
                if (event.key === 'Enter' || event.key === ' ') {
                  this.handleVisibilityKeyDown(
                    modelIndex,
                    isHidden
                      ? VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
                      : VisibilityOrderingBuilder.VISIBILITY_OPTIONS.HIDE
                  );
                  event.stopPropagation();
                  event.preventDefault();
                }
              }}
              tooltip={isHidden ? 'Show' : 'Hide'}
            >
              <FontAwesomeIcon icon={isHidden ? dhEyeSlash : dhEye} />
            </Button>
            <div
              role="menuitem"
              tabIndex={0}
              className={classNames(
                'ordering column-item',
                {
                  isSelected,
                },
                { isDragging },
                { isDragged },
                { 'two-dragged': columnsDragged === 2 },
                {
                  'multiple-dragged':
                    columnsDragged != null && columnsDragged > 2,
                }
              )}
              onClick={event => {
                this.handleItemClick(modelIndex, event);
              }}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...provided.dragHandleProps}
            >
              <span className="column-name">{columnName}</span>
              <div>
                {columnsDragged != null && columnsDragged !== 0 && (
                  <span className="number-badge">{columnsDragged}</span>
                )}
                <Tooltip>Drag to re-order</Tooltip>
                <FontAwesomeIcon icon={vsGripper} />
              </div>
            </div>
          </div>
        )}
      </Draggable>
    )
  );

  render(): ReactElement {
    const { model, userColumnWidths, onColumnVisibilityChanged } = this.props;
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

    const columnItems = this.makeVisibilityOrderingList();

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
          <Button kind="ghost" tooltip="Create group">
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
            tooltip="Move selection up"
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
        <DragDropContext
          onDragStart={this.handleOrderDraggingStart}
          onDragEnd={this.handleOrderDraggingEnd}
        >
          <Droppable droppableId="droppable-visibility-order-list">
            {(provided, snapshot) => (
              <div
                role="menu"
                className={classNames('visibility-ordering-list', {
                  isDragging: snapshot.draggingFromThisWith,
                })}
                ref={provided.innerRef}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...provided.droppableProps}
              >
                <div
                  className="column-list"
                  ref={list => {
                    this.list = list;
                  }}
                >
                  {columnItems}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }
}

export default VisibilityOrderingBuilder;
