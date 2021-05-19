/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { GridUtils } from '@deephaven/grid';
import { TextUtils } from '@deephaven/utils';
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
} from '@deephaven/icons';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import memoize from 'memoizee';
import debounce from 'lodash.debounce';
import { SearchInput, Tooltip } from '@deephaven/components';
import Log from '@deephaven/log';
import './VisibilityOrderingBuilder.scss';
import IrisGridModel from '../IrisGridModel';

const log = Log.module('VisibilityOrderingBuilder');
const DEBOUNCE_SEARCH_COLUMN = 150;

class VisibilityOrderingBuilder extends Component {
  static VISIBILITY_OPTIONS = { SHOW: 'SHOW', HIDE: 'HIDE' };

  static SORTING_OPTIONS = { DSC: 'DSC', ASC: 'ASC' };

  static MOVE_OPTIONS = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    UP: 'UP',
    DOWN: 'DOWN',
  };

  static COLUMN_CHANGE_OPTIONS = { ALL: 'ALL', SELECTION: 'SELECTION' };

  constructor(props) {
    super(props);

    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.debouncedSearchColumns = debounce(
      this.searchColumns.bind(this),
      DEBOUNCE_SEARCH_COLUMN
    );
    this.handleOrderDraggingStart = this.handleOrderDraggingStart.bind(this);
    this.handleOrderDraggingEnd = this.handleOrderDraggingEnd.bind(this);

    this.state = {
      selectedColumns: [], // model index of selected column(s)
      lastSelectedColumns: [],
      isDraggingVisibility: false,
      visibilityDraggingOption: null,
      visibilityDraggingStartColumn: null,
      isDraggingOrder: false,
      orderDraggingColumn: null,
      searchFilter: '',
    };

    this.list = null;
  }

  componentWillUnmount() {
    this.debouncedSearchColumns.cancel();
  }

  resetVisibilityOrdering() {
    const {
      model,
      onColumnVisibilityChanged,
      onMovedColumnsChanged,
    } = this.props;
    const { columns } = model;

    onColumnVisibilityChanged(
      columns.map(column => column.index),
      VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
    );
    this.setState({
      selectedColumns: [],
      lastSelectedColumns: [],
      searchFilter: '',
    });
    onMovedColumnsChanged([]);
  }

  resetSelection() {
    const { isDraggingOrder } = this.state;
    // don't reset selection if user is dragging column(s)
    if (isDraggingOrder) {
      return;
    }
    this.setState({ selectedColumns: [], lastSelectedColumns: [] });
  }

  handleSearchInputChange(event) {
    const searchFilter = event.target.value;
    this.setState({ searchFilter });
    if (!searchFilter) {
      this.debouncedSearchColumns.cancel();
      this.resetSelection();
      return;
    }
    this.debouncedSearchColumns(searchFilter);
  }

  searchColumns(searchFilter) {
    const { model, movedColumns } = this.props;
    const { columns } = model;

    const columnsMatch = [];
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
      const columnItemToFocus = this.list.querySelectorAll('.column-item')[
        visibleIndexToFocus
      ];
      columnItemToFocus.scrollIntoView({ block: 'center' });
    }
  }

  handleVisibilityKeyDown(modelIndex, visibilityOption) {
    const { onColumnVisibilityChanged } = this.props;
    onColumnVisibilityChanged([modelIndex], visibilityOption);
  }

  handleVisibilityDraggingStart(modelIndex, visibilityOption, event) {
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

  handleVisibilityDraggingEnd(event = null) {
    if (event) event.target.focus();

    const { isDraggingVisibility } = this.state;
    if (isDraggingVisibility) {
      this.setState({
        isDraggingVisibility: false,
        visibilityDraggingOption: null,
        visibilityDraggingStartColumn: null,
      });
    }
  }

  handleOrderDraggingStart(start) {
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
    this.list.querySelectorAll('.column-item')[startIndex].focus();

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

  handleOrderDraggingEnd(result) {
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

    let newMoves = [].concat(movedColumns);
    const draggingVisibleIndex = GridUtils.getVisibleIndex(
      orderDraggingColumn,
      newMoves
    );
    const upper = [];
    const lower = [];

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

  handleMouseEnter(targetModelIndex, event) {
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

    event.target.focus();

    // browser can skip mouseEnter / mouseMove event if user moves the mouse too fast
    // try to check columns between dragging start index to current index to compensate missing event,
    const columnsToChangeVisibility = [targetModelIndex];
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

  handleMoveColumns(option) {
    const { movedColumns, onMovedColumnsChanged, model } = this.props;
    const { columns } = model;
    const { selectedColumns } = this.state;
    if (selectedColumns.length === 0) {
      return;
    }

    const firstMovableIndex = this.getFirstMovableIndex(model, columns);
    const lastMovableIndex = this.getLastMovableIndex(model, columns);
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

    let newMoves = [];
    let scrollListAfterMove = () => {};

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
          this.list.scrollTop = 0;
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
          this.list.scrollTop = this.list.scrollHeight;
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

  handleSortColumns(option) {
    const { model, onMovedColumnsChanged } = this.props;
    const { columns } = model;

    // We can't move the immovable columns when sorting, so separate them out first
    const movableColumns = [];
    const immovableColumns = [];
    for (let modelIndex = 0; modelIndex < columns.length; modelIndex += 1) {
      if (model.isColumnMovable(modelIndex)) {
        movableColumns.push(modelIndex);
      } else {
        immovableColumns.push(modelIndex);
      }
    }

    // Sort all the movable columns
    const movableColumnsSorted = movableColumns.sort((a, b) => {
      const isAscending =
        option === VisibilityOrderingBuilder.SORTING_OPTIONS.ASC;
      const aName = columns[a].name.toUpperCase();
      const bName = columns[b].name.toUpperCase();
      return TextUtils.sort(aName, bName, isAscending);
    });

    // Place all the immovable columns where they need to be
    const modelIndexAlphaSorted = [];
    for (let i = 0; i < immovableColumns.length; i += 1) {
      const modelIndex = immovableColumns[i];
      modelIndexAlphaSorted[modelIndex] = modelIndex;
    }

    // Then the rest of the sorted columns can be put in the empty spaces
    let insertIndex = 0;
    for (let i = 0; i < movableColumnsSorted.length; i += 1) {
      while (modelIndexAlphaSorted[insertIndex] != null) {
        insertIndex += 1;
      }

      modelIndexAlphaSorted[insertIndex] = movableColumnsSorted[i];
    }

    let newMoves = [];
    modelIndexAlphaSorted.forEach((modelIndex, index) => {
      const visibleIndex = GridUtils.getVisibleIndex(modelIndex, newMoves);
      newMoves = GridUtils.moveItem(visibleIndex, index, newMoves);
    });
    onMovedColumnsChanged(newMoves);
  }

  handleItemClick(modelIndexClicked, event, removeSelectionOnClick = true) {
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

  addColumnToSelected(columnsToBeAdded, addToExisting = false) {
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

  removeColumnFromSelected(modelIndex) {
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

  makeVisibilityOrderingList() {
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

  getFirstMovableIndex = memoize((model, columns) => {
    for (let i = 0; i < columns.length; i += 1) {
      if (model.isColumnMovable(i)) {
        return i;
      }
    }

    return null;
  });

  getLastMovableIndex = memoize((model, columns) => {
    for (let i = columns.length - 1; i >= 0; i -= 1) {
      if (model.isColumnMovable(i)) {
        return i;
      }
    }

    return null;
  });

  renderImmovableItem = memoize(columnName => (
    <div className="visibility-ordering-list-item immovable" key={columnName}>
      <div className="column-item">
        <span className="column-name">{columnName}</span>
      </div>
    </div>
  ));

  renderVisibilityOrderingItem = memoize(
    (
      columnName,
      modelIndex,
      visibleIndex,
      isHidden,
      isSelected,
      isDragging,
      isDragged,
      columnsDragged
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
            <button
              type="button"
              className="visibility btn btn-link btn-link-icon"
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
            >
              <FontAwesomeIcon icon={isHidden ? dhEyeSlash : dhEye} />
            </button>
            <div
              role="menuitem"
              tabIndex="0"
              className={classNames(
                'ordering column-item',
                {
                  isSelected,
                },
                { isDragging },
                { isDragged },
                { 'two-dragged': columnsDragged === 2 },
                { 'multiple-dragged': columnsDragged > 2 }
              )}
              onClick={event => {
                this.handleItemClick(modelIndex, event);
              }}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...provided.dragHandleProps}
            >
              <span className="column-name">{columnName}</span>
              <div>
                {columnsDragged && (
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

  render() {
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
        tabIndex="0"
        onMouseUp={() => {
          this.handleVisibilityDraggingEnd();
        }}
        onMouseLeave={() => {
          this.handleVisibilityDraggingEnd();
        }}
      >
        <div className="top-menu">
          <button
            type="button"
            className="btn btn-link"
            onClick={() => {
              onColumnVisibilityChanged(
                columnsToToggle,
                toggleToShow
                  ? VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
                  : VisibilityOrderingBuilder.VISIBILITY_OPTIONS.HIDE
              );
            }}
          >
            <FontAwesomeIcon icon={toggleToShow ? dhEyeSlash : dhEye} />
            <Tooltip>Toggle column visibility</Tooltip>
            {noSelection ? 'Toggle All' : selectedToggleText}
          </button>

          <div>
            <button
              type="button"
              className="btn btn-link text-muted"
              onClick={() => {
                this.resetVisibilityOrdering();
              }}
            >
              Reset
              <Tooltip>Reset to default</Tooltip>
            </button>
            <button
              type="button"
              className="btn btn-link btn-link-icon"
              onClick={() => {
                this.handleSortColumns(
                  VisibilityOrderingBuilder.SORTING_OPTIONS.ASC
                );
              }}
            >
              <FontAwesomeIcon icon={dhSortAlphaDown} />
              <Tooltip>Sort ascending</Tooltip>
            </button>
            <button
              type="button"
              className="btn btn-link btn-link-icon"
              onClick={() => {
                this.handleSortColumns(
                  VisibilityOrderingBuilder.SORTING_OPTIONS.DSC
                );
              }}
            >
              <FontAwesomeIcon icon={dhSortAlphaUp} />
              <Tooltip>Sort descending</Tooltip>
            </button>
            <span className="vertical-divider" />
            <button
              type="button"
              className="btn btn-link btn-link-icon"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilder.MOVE_OPTIONS.UP
                );
              }}
              disabled={noSelection}
            >
              <FontAwesomeIcon icon={vsChevronUp} />
              <Tooltip>Move selection up</Tooltip>
            </button>
            <button
              type="button"
              className="btn btn-link btn-link-icon"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilder.MOVE_OPTIONS.DOWN
                );
              }}
              disabled={noSelection}
            >
              <FontAwesomeIcon icon={vsChevronDown} />
              <Tooltip>Move selection down</Tooltip>
            </button>
            <button
              type="button"
              className="btn btn-link btn-link-icon"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilder.MOVE_OPTIONS.TOP
                );
              }}
              disabled={noSelection}
            >
              <FontAwesomeIcon icon={dhArrowToTop} />
              <Tooltip>Move selection to top</Tooltip>
            </button>
            <button
              type="button"
              className="btn btn-link btn-link-icon"
              onClick={() => {
                this.handleMoveColumns(
                  VisibilityOrderingBuilder.MOVE_OPTIONS.BOTTOM
                );
              }}
              disabled={noSelection}
            >
              <FontAwesomeIcon icon={dhArrowToBottom} />
              <Tooltip>Move selection to bottom</Tooltip>
            </button>
          </div>
        </div>
        <div className="top-menu">
          <SearchInput
            className="w-100"
            value={searchFilter}
            matchCount={searchFilter ? selectedColumns.length : null}
            onChange={this.handleSearchInputChange}
          />
        </div>
        <DragDropContext
          onDragStart={this.handleOrderDraggingStart}
          onDragEnd={this.handleOrderDraggingEnd}
        >
          <Droppable droppableId="droppable-visibility-order-list">
            {(provided, snapshot) => (
              // eslint-disable-next-line jsx-a11y/interactive-supports-focus
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

VisibilityOrderingBuilder.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  movedColumns: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number,
      to: PropTypes.number,
    })
  ),
  userColumnWidths: PropTypes.instanceOf(Map).isRequired,
  onColumnVisibilityChanged: PropTypes.func,
  onMovedColumnsChanged: PropTypes.func,
};

VisibilityOrderingBuilder.defaultProps = {
  movedColumns: [],
  onColumnVisibilityChanged: () => {},
  onMovedColumnsChanged: () => {},
};

export default VisibilityOrderingBuilder;
