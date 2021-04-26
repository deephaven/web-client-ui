/* eslint react/no-did-update-set-state: "off" */
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import PropTypes from 'prop-types';
import clamp from 'lodash.clamp';
import GridMetricCalculator from './GridMetricCalculator';
import GridModel from './GridModel';
import GridMouseHandler from './GridMouseHandler';
import GridTheme from './GridTheme';
import GridRange from './GridRange';
import GridRenderer from './GridRenderer';
import GridUtils from './GridUtils';
import {
  GridSelectionMouseHandler,
  GridColumnMoveMouseHandler,
  GridColumnSeparatorMouseHandler,
  GridHorizontalScrollBarMouseHandler,
  GridRowMoveMouseHandler,
  GridRowSeparatorMouseHandler,
  GridRowTreeMouseHandler,
  GridScrollBarCornerMouseHandler,
  GridVerticalScrollBarMouseHandler,
  EditMouseHandler,
} from './mouse-handlers';
import './Grid.scss';
import KeyHandler from './KeyHandler';
import {
  EditKeyHandler,
  SelectionKeyHandler,
  TreeKeyHandler,
} from './key-handlers';
import CellInputField from './CellInputField';

/**
 * High performance, extendible, themeable grid component.
 * Architectured to be fast and handle billions of rows/columns by default.
 * The base model does not provide support for sorting, filtering, etc.
 * To get that functionality, extend GridModel/GridRenderer, and add onClick/onContextMenu handlers to implement your own sort.
 *
 * Extend GridModel with your own data model to provide the data for the grid.
 * Extend GridTheme to change the appearance if the grid. See GridTheme for all the settable values.
 * Extend GridMetricCalculator to provide different metrics for the grid, such as column sizing, header sizing, etc.
 * Extend GridRenderer to have complete control over the rendering process. Can override just one method such as drawColumnHeader, or override the whole drawCanvas process.
 *
 * Add an onViewChanged callback to page in/out data as user moves around the grid
 * Can also add onClick and onContextMenu handlers to add custom functionality and menus.
 */
class Grid extends PureComponent {
  // use same constant as chrome source for windows
  // https://github.com/chromium/chromium/blob/973af9d461b6b5dc60208c8d3d66adc27e53da78/ui/events/blink/web_input_event_builders_win.cc#L285
  static pixelsPerLine = 100 / 3;

  static dragTimeout = 1000;

  static getTheme = memoize(userTheme => ({ ...GridTheme, ...userTheme }));

  static getScale(context) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStorePixelRatio =
      context.webkitBackingStorePixelRatio ||
      context.mozBackingStorePixelRatio ||
      context.msBackingStorePixelRatio ||
      context.oBackingStorePixelRatio ||
      context.backingStorePixelRatio ||
      1;
    return devicePixelRatio / backingStorePixelRatio;
  }

  static getCursorClassName(cursor) {
    return cursor ? `grid-cursor-${cursor}` : null;
  }

  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleEditCellCancel = this.handleEditCellCancel.bind(this);
    this.handleEditCellChange = this.handleEditCellChange.bind(this);
    this.handleEditCellCommit = this.handleEditCellCommit.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseDrag = this.handleMouseDrag.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    const { metricCalculator, movedColumns, movedRows, renderer } = props;

    this.renderer = renderer || new GridRenderer();
    this.metricCalculator = metricCalculator || new GridMetricCalculator();

    this.canvas = null;
    this.canvasContext = null;
    this.animationFrame = null;

    this.prevMetrics = null;
    this.metrics = null;

    this.isStuckToBottom = false;
    this.isStuckToRight = false;

    // Track the cursor that is currently added to the document
    // Add to document so that when dragging the cursor stays, even if mouse leaves the canvas
    // Note: on document, not body so that cursor styling can be combined with
    // blocked pointer events that would otherwise prevent cursor styling from showing
    this.documentCursor = null;

    this.dragTimer = null;

    // specify handler ordering, such that any extensions can insert handlers in between
    this.keyHandlers = [
      new EditKeyHandler(400),
      new SelectionKeyHandler(500),
      new TreeKeyHandler(900),
    ];
    this.mouseHandlers = [
      new GridRowSeparatorMouseHandler(100),
      new GridColumnSeparatorMouseHandler(200),
      new GridRowMoveMouseHandler(300),
      new GridColumnMoveMouseHandler(400),
      new EditMouseHandler(450),
      new GridVerticalScrollBarMouseHandler(500),
      new GridHorizontalScrollBarMouseHandler(600),
      new GridScrollBarCornerMouseHandler(700),
      new GridRowTreeMouseHandler(800),
      new GridSelectionMouseHandler(900),
    ];

    this.state = {
      // Top/left visible cell in the grid. Note that it's visible row/column index, not the model index (ie. if columns are re-ordered)
      top: 0,
      left: 0,

      // The scroll offset of the top/left cell. 0,0 means the cell is at the top left
      // Should be less than the width of the column
      topOffset: 0,
      leftOffset: 0,

      // current column/row that user is dragging
      draggingColumn: null,
      draggingRow: null,

      // Offset when dragging a column/row
      draggingColumnOffset: null,
      draggingRowOffset: null,

      // When drawing header separators for resizing
      draggingColumnSeparator: null,
      draggingRowSeparator: null,

      isDraggingHorizontalScrollBar: false,
      isDraggingVerticalScrollBar: false,

      // Anything is performing a drag, for blocking hover rendering
      isDragging: false,

      // The coordinates of the mouse. May be outside of the canvas
      mouseX: null,
      mouseY: null,

      // Move operations the user has performed on this grids columns/rows
      movedColumns,
      movedRows,

      cursorRow: null,
      cursorColumn: null,
      selectionStartRow: null,
      selectionStartColumn: null,
      selectionEndRow: null,
      selectionEndColumn: null,

      selectedRanges: [],
      lastSelectedRanges: [],

      // The cursor style to use for the grid element
      cursor: null,
    };
  }

  componentDidMount() {
    this.initContext();

    // Need to explicitly add wheel event to canvas so we can preventDefault/avoid passive listener issue
    // Otherwise React attaches listener at doc level and you can't prevent default
    // https://github.com/facebook/react/issues/14856
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('resize', this.handleResize);

    this.updateCanvasScale();
    this.updateCanvas();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      isStickyBottom,
      isStickyRight,
      movedColumns,
      movedRows,
      onMovedColumnsChanged,
      onMoveColumnComplete,
    } = this.props;
    const {
      isStickyBottom: prevIsStickyBottom,
      isStickyRight: prevIsStickyRight,
      movedColumns: prevPropMovedColumns,
      movedRows: prevMovedRows,
    } = prevProps;
    const { movedColumns: prevStateMovedColumns } = prevState;
    const {
      draggingColumn,
      movedColumns: currentStateMovedColumns,
    } = this.state;

    if (prevPropMovedColumns !== movedColumns) {
      this.setState({ movedColumns });
    }

    if (prevMovedRows !== movedRows) {
      this.setState({ movedRows });
    }

    if (prevStateMovedColumns !== currentStateMovedColumns) {
      onMovedColumnsChanged(currentStateMovedColumns);
    }

    if (prevState.draggingColumn != null && draggingColumn == null) {
      onMoveColumnComplete(currentStateMovedColumns);
    }

    if (isStickyBottom !== prevIsStickyBottom) {
      this.isStuckToBottom = false;
    }

    if (isStickyRight !== prevIsStickyRight) {
      this.isStuckToRight = false;
    }

    this.requestUpdateCanvas();

    if (!this.metrics || !this.prevMetrics) {
      return;
    }

    const {
      bottomVisible,
      rightVisible,
      rowCount,
      columnCount,
      top,
      left,
      height,
      width,
    } = this.metrics;
    const {
      rowCount: prevRowCount,
      columnCount: prevColumnCount,
      height: prevHeight,
      width: prevWidth,
    } = this.prevMetrics;
    const metricState = this.getMetricState();

    if (prevRowCount !== rowCount || height !== prevHeight) {
      const lastTop = this.metricCalculator.getLastTop(metricState);
      if (
        (this.isStuckToBottom &&
          bottomVisible < rowCount - 1 &&
          bottomVisible > 0 &&
          top > 0) ||
        top > lastTop
      ) {
        this.setState({ top: lastTop });
      }
    }

    if (prevColumnCount !== columnCount || width !== prevWidth) {
      const lastLeft = this.metricCalculator.getLastLeft(metricState);
      if (
        (this.isStuckToRight &&
          rightVisible < columnCount - 1 &&
          rightVisible > 0 &&
          left > 0) ||
        left > lastLeft
      ) {
        this.setState({ left: lastLeft });
      }
    }

    if (this.validateSelection()) {
      this.checkSelectionChange(prevState);
    }
  }

  componentWillUnmount() {
    if (this.animationFrame != null) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.canvas.removeEventListener('wheel', this.handleWheel, {
      passive: false,
    });

    window.removeEventListener('mousemove', this.handleMouseDrag, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('resize', this.handleResize);

    this.stopDragTimer();
  }

  getTheme() {
    const { theme } = this.props;
    return Grid.getTheme(theme);
  }

  getGridPointFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return this.getGridPointFromXY(x, y);
  }

  getGridPointFromXY(x, y) {
    return GridUtils.getGridPointFromXY(x, y, this.metrics);
  }

  getMetricState(state = this.state) {
    const theme = this.getTheme();
    const { model, stateOverride } = this.props;
    const context = this.canvasContext;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const {
      left,
      top,
      leftOffset,
      topOffset,
      movedColumns,
      movedRows,
      isDraggingHorizontalScrollBar,
      isDraggingVerticalScrollBar,
    } = state;

    return {
      left,
      top,
      leftOffset,
      topOffset,
      width,
      height,
      context,
      theme,
      model,
      movedColumns,
      movedRows,
      isDraggingHorizontalScrollBar,
      isDraggingVerticalScrollBar,
      ...stateOverride,
    };
  }

  getCachedKeyHandlers = memoize(keyHandlers =>
    [...keyHandlers, ...this.keyHandlers].sort((a, b) => a.order - b.order)
  );

  getKeyHandlers() {
    const { keyHandlers } = this.props;
    return this.getCachedKeyHandlers(keyHandlers);
  }

  getCachedMouseHandlers = memoize(mouseHandlers =>
    [...mouseHandlers, ...this.mouseHandlers].sort((a, b) => a.order - b.order)
  );

  getMouseHandlers() {
    const { mouseHandlers } = this.props;
    return this.getCachedMouseHandlers(mouseHandlers);
  }

  getModelColumn(columnIndex) {
    return this.metrics?.modelColumns?.get(columnIndex);
  }

  getModelRow(rowIndex) {
    return this.metrics?.modelRows?.get(rowIndex);
  }

  toggleRowExpanded(row) {
    const { metrics } = this;
    const { modelRows } = metrics;

    const modelRow = modelRows.get(row);
    const { model } = this.props;
    // We only want to set expansion if the row is expandable
    // If it's not, still move the cursor to that position, as it may be outside of the current viewport and we don't know if it's expandable yet
    if (model.isRowExpandable(modelRow)) {
      model.setRowExpanded(modelRow, !model.isRowExpanded(modelRow));
    }
    this.clearSelectedRanges();
    this.commitSelection(); // Need to commit before moving in case we're selecting same row again
    this.moveCursorToPosition(0, row);
    this.commitSelection();

    this.isStuckToBottom = false;
  }

  /** Allows the selected range to be set programatically */
  setSelectedRanges(gridRanges) {
    const { model } = this.props;
    const { columnCount, rowCount } = model;
    const { cursorRow, cursorColumn, selectedRanges } = this.state;
    this.setState({
      selectedRanges: gridRanges,
      lastSelectedRanges: selectedRanges,
    });
    if (gridRanges.length > 0) {
      const range = GridRange.boundedRange(
        gridRanges[0],
        columnCount,
        rowCount
      );
      let newCursorRow = cursorRow;
      let newCursorColumn = cursorColumn;
      if (!range.containsCell(cursorColumn, cursorRow)) {
        ({ row: newCursorRow, column: newCursorColumn } = range.startCell());
      }

      this.setState({
        selectionStartColumn: range.startColumn,
        selectionStartRow: range.startRow,
        selectionEndColumn: range.endColumn,
        selectionEndRow: range.endRow,
        cursorColumn: newCursorColumn,
        cursorRow: newCursorRow,
      });
    }
  }

  initContext() {
    const { canvas } = this;
    const { canvasOptions } = this.props;

    this.canvasContext = canvas.getContext('2d', canvasOptions);
  }

  requestUpdateCanvas() {
    if (this.animationFrame != null) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;

      this.updateCanvas();
    });
  }

  updateCanvas() {
    const metrics = this.updateMetrics();

    const { onViewChanged } = this.props;
    onViewChanged(metrics);

    this.drawCanvas(metrics);
  }

  updateCanvasScale() {
    const { canvas, canvasContext } = this;
    const scale = Grid.getScale(canvasContext);
    // the parent wrapper has 100% width/height, and is used for determining size
    // we don't want to stretch the canvas to 100%, to avoid fractional pixels.
    // A wrapper element must be used for sizing, and canvas size must be
    // set manually to a floored value in css and a scaled value in width/height
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    canvas.style.width = `${Math.floor(width)}px`;
    canvas.style.height = `${Math.floor(height)}px`;
    canvas.width = Math.floor(width) * scale;
    canvas.height = Math.floor(height) * scale;
    canvasContext.scale(scale, scale);
  }

  updateMetrics(state = this.state) {
    this.prevMetrics = this.metrics;

    const { metricCalculator } = this;
    const metricState = this.getMetricState(state);
    this.metrics = metricCalculator.getMetrics(metricState);

    return this.metrics;
  }

  checkSelectionChange(prevState) {
    const { selectedRanges: oldSelectedRanges } = prevState;
    const { selectedRanges } = this.state;

    if (selectedRanges !== oldSelectedRanges) {
      const { onSelectionChanged } = this.props;
      onSelectionChanged(selectedRanges);
    }
  }

  validateSelection() {
    const { model } = this.props;
    const { selectedRanges } = this.state;
    const { columnCount, rowCount } = model;

    for (let i = 0; i < selectedRanges.length; i += 1) {
      const range = selectedRanges[i];
      if (
        (range.endColumn != null && range.endColumn >= columnCount) ||
        (range.endRow != null && range.endRow >= rowCount)
      ) {
        // Just clear the selection rather than trying to trim it.
        this.setState({ selectedRanges: [], lastSelectedRanges: [] });
        return false;
      }
    }
    return true;
  }

  clearSelectedRanges() {
    const { selectedRanges } = this.state;
    this.setState({ selectedRanges: [], lastSelectedRanges: selectedRanges });
  }

  /** Clears all but the last selected range */
  trimSelectedRanges() {
    const { selectedRanges } = this.state;
    if (selectedRanges.length > 0) {
      this.setState({
        selectedRanges: selectedRanges.slice(selectedRanges.length - 1),
      });
    }
  }

  beginSelection(column, row) {
    this.setState({
      selectionStartColumn: column,
      selectionStartRow: row,
      selectionEndColumn: column,
      selectionEndRow: row,
      cursorColumn: column,
      cursorRow: row,
    });
  }

  /**
   * Moves the selection to the cell specified
   * @param {number} column The column index to move the cursor to
   * @param {number} row The row index to move the cursor to
   * @param {boolean} extendSelection Whether to extend the current selection (eg. holding Shift)
   * @param {boolean} maximizePreviousRange When true, maximize/add to the previous range only, ignoring where the selection was started.
   */
  moveSelection(
    column,
    row,
    extendSelection = false,
    maximizePreviousRange = false
  ) {
    this.setState(state => {
      const { selectedRanges, selectionStartRow, selectionStartColumn } = state;
      const { theme } = this.props;
      const { autoSelectRow, autoSelectColumn } = theme;

      if (extendSelection && selectedRanges.length > 0) {
        const lastSelectedRange = selectedRanges[selectedRanges.length - 1];
        let left = null;
        let top = null;
        let right = null;
        let bottom = null;
        if (maximizePreviousRange) {
          left = autoSelectRow
            ? null
            : Math.min(column, lastSelectedRange.startColumn);
          top = autoSelectColumn
            ? null
            : Math.min(row, lastSelectedRange.startRow);
          right = autoSelectRow
            ? null
            : Math.max(column, lastSelectedRange.endColumn);
          bottom = autoSelectColumn
            ? null
            : Math.max(row, lastSelectedRange.endRow);
        } else {
          left = lastSelectedRange.startColumn;
          top = lastSelectedRange.startRow;

          if (selectionStartColumn != null || selectionStartRow != null) {
            if (!autoSelectRow) {
              left = selectionStartColumn;
            }
            if (!autoSelectColumn) {
              top = selectionStartRow;
            }
          }
          right = autoSelectRow ? null : column;
          bottom = autoSelectColumn ? null : row;
        }
        const selectedRange = GridRange.makeNormalized(
          left,
          top,
          right,
          bottom
        );

        if (lastSelectedRange.equals(selectedRange)) {
          return null;
        }

        const newRanges = [].concat(selectedRanges);
        newRanges[newRanges.length - 1] = selectedRange;
        return {
          selectedRanges: newRanges,
          selectionEndColumn: column,
          selectionEndRow: row,
        };
      }
      const newRanges = [].concat(selectedRanges);
      const selectedColumn = autoSelectRow ? null : column;
      const selectedRow = autoSelectColumn ? null : row;
      newRanges.push(
        GridRange.makeNormalized(
          selectedColumn,
          selectedRow,
          selectedColumn,
          selectedRow
        )
      );
      return {
        selectedRanges: newRanges,
        selectionEndColumn: column,
        selectionEndRow: row,
      };
    });
  }

  /**
   * Commits the last selected range to the selected ranges.
   * First checks if the last range is completely contained within another range, and if it
   * is then it blows those ranges apart.
   * Then it consolidates all the selected ranges, reducing them.
   */
  commitSelection() {
    this.setState(state => {
      const { theme } = this.props;
      const { autoSelectRow } = theme;
      const {
        selectedRanges,
        lastSelectedRanges,
        cursorRow,
        cursorColumn,
      } = state;

      if (
        selectedRanges.length === 1 &&
        (autoSelectRow
          ? GridRange.rowCount(selectedRanges) === 1
          : GridRange.cellCount(selectedRanges) === 1) &&
        GridRange.rangeArraysEqual(selectedRanges, lastSelectedRanges)
      ) {
        // If it's the exact same single selection, then deselect.
        // For if we click on one cell multiple times.
        return { selectedRanges: [], lastSelectedRanges: [] };
      }

      let newSelectedRanges = selectedRanges.slice();
      if (newSelectedRanges.length > 1) {
        // Check if the latest selection is entirely within a previously selected range
        // If that's the case, then deselect that section instead
        const lastRange = newSelectedRanges[newSelectedRanges.length - 1];
        for (let i = 0; i < newSelectedRanges.length - 1; i += 1) {
          const selectedRange = newSelectedRanges[i];
          if (selectedRange.contains(lastRange)) {
            // We found a match, now remove the two matching ranges, and add back
            // the remainder of the two
            const remainder = selectedRange.subtract(lastRange);
            newSelectedRanges.pop();
            newSelectedRanges.splice(i, 1);
            newSelectedRanges = newSelectedRanges.concat(remainder);
            break;
          }
        }

        newSelectedRanges = GridRange.consolidate(newSelectedRanges);
      }

      let newCursorColumn = cursorColumn;
      let newCursorRow = cursorRow;
      if (!GridRange.containsCell(newSelectedRanges, cursorColumn, cursorRow)) {
        const { model } = this.props;
        const { columnCount, rowCount } = model;
        const nextCursor = GridRange.nextCell(
          GridRange.boundedRanges(selectedRanges, columnCount, rowCount)
        );
        if (nextCursor != null) {
          ({ column: newCursorColumn, row: newCursorRow } = nextCursor);
        } else {
          newCursorColumn = null;
          newCursorRow = null;
        }
      }
      return {
        cursorRow: newCursorRow,
        cursorColumn: newCursorColumn,
        selectedRanges: newSelectedRanges,
        lastSelectedRanges: selectedRanges,
      };
    });
  }

  selectAll() {
    const { model, theme } = this.props;
    const { autoSelectRow, autoSelectColumn } = theme;

    const top = autoSelectColumn ? null : 0;
    const bottom = autoSelectColumn ? null : model.rowCount - 1;
    const left = autoSelectRow ? null : 0;
    const right = autoSelectRow ? null : model.columnCount - 1;
    this.setSelectedRanges([new GridRange(left, top, right, bottom)]);
  }

  moveCursor(deltaColumn, deltaRow, extendSelection) {
    const {
      cursorRow,
      cursorColumn,
      selectionEndColumn,
      selectionEndRow,
    } = this.state;
    const column = extendSelection ? selectionEndColumn : cursorColumn;
    const row = extendSelection ? selectionEndRow : cursorRow;
    if (row === null || column === null) {
      const { left, top } = this.state;
      this.moveCursorToPosition(left, top, extendSelection);
    } else {
      const { model } = this.props;
      const { columnCount, rowCount } = model;

      const left = clamp(column + deltaColumn, 0, columnCount - 1);
      const top = clamp(row + deltaRow, 0, rowCount - 1);
      this.moveCursorToPosition(left, top, extendSelection);
    }
  }

  /**
   * Move the cursor in the provided selection direction
   * @param {string} direction The direction to move the cursor in
   */
  moveCursorInDirection(direction = GridRange.SELECTION_DIRECTION.DOWN) {
    const { model } = this.props;
    const { columnCount, rowCount } = model;
    const { cursorRow, cursorColumn, selectedRanges } = this.state;
    let nextCursor = null;
    if (
      selectedRanges.length === 1 &&
      GridRange.cellCount(selectedRanges) === 1
    ) {
      // If we only have one cell selected, we want to update the cursor and we want to update the selected cells
      const gridRange = new GridRange(0, 0, columnCount - 1, rowCount - 1);
      nextCursor =
        gridRange.nextCell(cursorColumn, cursorRow, direction) ??
        gridRange.startCell(direction);
    } else {
      nextCursor = GridRange.nextCell(
        GridRange.boundedRanges(selectedRanges, columnCount, rowCount),
        cursorColumn,
        cursorRow,
        direction
      );
    }

    if (nextCursor != null) {
      const { column, row } = nextCursor;
      this.setState({
        cursorColumn: column,
        cursorRow: row,
      });

      if (!GridRange.containsCell(selectedRanges, column, row)) {
        this.setState({
          selectedRanges: [new GridRange(column, row, column, row)],
          selectionStartColumn: column,
          selectionStartRow: row,
          selectionEndColumn: column,
          selectionEndRow: row,
        });
      }

      this.moveViewToCell(nextCursor.column, nextCursor.row);
    }
  }

  /**
   * Move a cursor to the specified position in the grid.
   * @param {number|null} column The column index to move the cursor to
   * @param {number|null} row The row index to move the cursor to
   * @param {boolean} extendSelection Whether to extend the current selection (eg. holding Shift)
   * @param {boolean} keepCursorInView Whether to move the viewport so that the cursor is in view
   * @param {boolean} maximizePreviousRange With this and `extendSelection` true, it will maximize/add to the previous range only, ignoring where the selection was started
   */
  moveCursorToPosition(
    column,
    row,
    extendSelection = false,
    keepCursorInView = true,
    maximizePreviousRange = false
  ) {
    if (!extendSelection) {
      this.beginSelection(column, row);
    }

    this.moveSelection(column, row, extendSelection, maximizePreviousRange);

    if (keepCursorInView) {
      this.moveViewToCell(column, row);
    }
  }

  /**
   * Moves the view to make the specified cell visible
   *
   * @param {number|null} column The column index to bring into view
   * @param {number|null} row The row index to bring into view
   */
  moveViewToCell(column, row) {
    const { metricCalculator } = this;
    const {
      bottomVisible,
      rightVisible,
      topVisible,
      leftVisible,
    } = this.metrics;
    const metricState = this.getMetricState(this.state);
    let { top, left, topOffset, leftOffset } = this.state;

    if (row != null && !GridUtils.isFloatingRow(row, this.metrics)) {
      if (row < topVisible) {
        top = metricCalculator.getTopForTopVisible(metricState, row);
        topOffset = 0;
      } else if (row > bottomVisible) {
        top = metricCalculator.getTopForBottomVisible(metricState, row);
        topOffset = 0;
      }
    }

    if (column != null && !GridUtils.isFloatingColumn(column, this.metrics)) {
      if (column < leftVisible) {
        left = metricCalculator.getLeftForLeftVisible(metricState, column);
        leftOffset = 0;
      } else if (column > rightVisible) {
        left = metricCalculator.getLeftForRightVisible(metricState, column);
        leftOffset = 0;
      }
    }

    this.setViewState({ top, left, topOffset, leftOffset });
  }

  /**
   * Checks the `top` and `left` properties that are set and updates the isStuckToBottom/Right properties
   * Should be called when user interaction occurs
   * @param {object} viewState New state properties to set.
   * @param {boolean} forceUpdate Whether to force an update.
   */
  setViewState(viewState, forceUpdate = false) {
    const { isStickyBottom, isStickyRight } = this.props;
    const { top, left } = viewState;
    const { lastTop, lastLeft } = this.metrics;
    if (top != null) {
      this.isStuckToBottom = isStickyBottom && top >= lastTop;
    }
    if (left != null) {
      this.isStuckToRight = isStickyRight && left >= lastLeft;
    }

    this.setState(viewState);
    if (forceUpdate) {
      this.forceUpdate();
    }
  }

  /**
   * Start editing the data at the given index
   *
   * @param {number} column The visible column index to start editing
   * @param {number} row The visible row index to start editing
   * @param {boolean} isQuickEdit If this is a quick edit (the arrow keys can commit)
   * @param {number[]|null} selectionRange The tuple [start,end] selection range to select when editing
   * @param {string?} value The value to start with in the edit field. Leave undefined to use the current value.
   */
  startEditing(
    column,
    row,
    isQuickEdit = false,
    selectionRange = null,
    value = undefined
  ) {
    const { model } = this.props;
    const modelColumn = this.getModelColumn(column);
    const modelRow = this.getModelRow(row);
    const cell = {
      column,
      row,
      selectionRange,
      value:
        value !== undefined
          ? value
          : model.editValueForCell(modelColumn, modelRow),
      isQuickEdit,
    };
    this.setState({ editingCell: cell });
    this.moveViewToCell(column, row);
  }

  isValidForCell(column, row, value) {
    const { model } = this.props;

    const modelColumn = this.getModelColumn(column);
    const modelRow = this.getModelRow(row);
    return model.isValidForCell(modelColumn, modelRow, value);
  }

  setValueForCell(column, row, value) {
    const { model } = this.props;

    const modelColumn = this.getModelColumn(column);
    const modelRow = this.getModelRow(row);
    if (model.isValidForCell(modelColumn, modelRow, value)) {
      model.setValueForCell(modelColumn, modelRow, value);
    }
  }

  setValueForRanges(ranges, value) {
    const { model } = this.props;
    const { movedColumns, movedRows } = this.state;

    const modelRanges = GridUtils.getModelRanges(
      ranges,
      movedColumns,
      movedRows
    );
    model.setValueForRanges(modelRanges, value);
  }

  isSelected(row, column) {
    const { selectedRanges } = this.state;

    for (let i = 0; i < selectedRanges.length; i += 1) {
      const selectedRange = selectedRanges[i];
      const rowSelected =
        selectedRange.startRow === null ||
        (selectedRange.startRow <= row && row <= selectedRange.endRow);
      const columnSelected =
        selectedRange.startColumn === null ||
        (selectedRange.startColumn <= column &&
          column <= selectedRange.endColumn);
      if (rowSelected && columnSelected) {
        return true;
      }
    }

    return false;
  }

  addDocumentCursor(cursor = null) {
    if (this.documentCursor === Grid.getCursorClassName(cursor)) return;
    document.documentElement.classList.remove(this.documentCursor);
    this.documentCursor = Grid.getCursorClassName(cursor);
    document.documentElement.classList.add(this.documentCursor);
    document.documentElement.classList.add('grid-block-events');
  }

  removeDocumentCursor() {
    if (this.documentCursor) {
      document.documentElement.classList.remove(this.documentCursor);
      document.documentElement.classList.remove('grid-block-events');
      this.documentCursor = null;
    }
  }

  startDragTimer(event) {
    this.stopDragTimer();

    const mouseEvent = new MouseEvent('custom', event);

    this.dragTimer = setTimeout(() => {
      this.handleMouseDrag(mouseEvent);
    }, Grid.dragTimeout);
  }

  stopDragTimer() {
    if (this.dragTimer) {
      clearTimeout(this.dragTimer);
      this.dragTimer = null;
    }
  }

  /**
   * When scrolling you've have to re-draw the whole canvas. As a consequence, all these drawing methods
   * must be very quick.
   */
  drawCanvas(metrics = this.updateMetrics()) {
    const {
      left,
      top,
      cursorColumn,
      cursorRow,
      draggingColumn,
      draggingColumnOffset,
      draggingColumnSeparator,
      draggingRow,
      draggingRowOffset,
      draggingRowSeparator,
      editingCell,
      isDraggingHorizontalScrollBar,
      isDraggingVerticalScrollBar,
      isDragging,
      mouseX,
      mouseY,
      selectedRanges,
    } = this.state;
    const { model, stateOverride } = this.props;
    const { renderer } = this;
    const context = this.canvasContext;
    const theme = this.getTheme();
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const renderState = {
      left,
      top,
      width,
      height,
      context,
      theme,
      model,
      metrics,
      mouseX,
      mouseY,
      selectedRanges,
      draggingColumn,
      draggingColumnOffset,
      draggingColumnSeparator,
      draggingRow,
      draggingRowOffset,
      draggingRowSeparator,
      editingCell,
      isDraggingHorizontalScrollBar,
      isDraggingVerticalScrollBar,
      isDragging,
      cursorColumn,
      cursorRow,
      ...stateOverride,
    };

    context.save();

    renderer.drawCanvas(renderState);

    context.restore();
  }

  focus() {
    this.canvas.focus();
  }

  isFocused() {
    return document.activeElement === this.canvas;
  }

  handleClick(event) {
    const gridPoint = this.getGridPointFromEvent(event);

    const mouseHandlers = this.getMouseHandlers();
    for (let i = 0; i < mouseHandlers.length; i += 1) {
      const mouseHandler = mouseHandlers[i];
      if (mouseHandler.onClick(gridPoint, this, event)) {
        event.stopPropagation();
        event.preventDefault();
        break;
      }
    }

    this.canvas.focus();
  }

  handleContextMenu(event) {
    const gridPoint = this.getGridPointFromEvent(event);

    const mouseHandlers = this.getMouseHandlers();
    for (let i = 0; i < mouseHandlers.length; i += 1) {
      const mouseHandler = mouseHandlers[i];
      if (mouseHandler.onContextMenu(gridPoint, this, event)) {
        event.stopPropagation();
        event.preventDefault();
        break;
      }
    }
  }

  handleKeyDown(e) {
    const keyHandlers = this.getKeyHandlers();
    for (let i = 0; i < keyHandlers.length; i += 1) {
      const keyHandler = keyHandlers[i];
      const result = keyHandler.onDown(e, this);
      if (result) {
        e.stopPropagation();
        e.preventDefault();
        break;
      }
    }
  }

  /**
   * Notify all of the mouse handlers for this grid of a mouse event.
   * @param {String} functionName The name of the function in the mouse handler to call
   * @param {MouseEvent} event The mouse event to notify
   * @param {Boolean} updateCoordinates Whether to update the mouse coordinates
   * @param {Boolean} addCursorToDocument Whether to add a cursor overlay or not (for dragging)
   */
  notifyMouseHandlers(
    functionName,
    event,
    updateCoordinates = true,
    addCursorToDocument = false
  ) {
    const gridPoint = this.getGridPointFromEvent(event);
    const mouseHandlers = this.getMouseHandlers();
    let cursor = null;
    for (let i = 0; i < mouseHandlers.length; i += 1) {
      const mouseHandler = mouseHandlers[i];
      const result =
        mouseHandler[functionName] &&
        mouseHandler[functionName](gridPoint, this, event);
      if (result) {
        if (mouseHandler.cursor != null) {
          ({ cursor } = mouseHandler);
          if (addCursorToDocument) {
            this.addDocumentCursor(cursor);
          }
        }

        // result is bool or object, events are stopped by default
        if (result?.stopPropagation ?? true) event.stopPropagation();
        if (result?.preventDefault ?? true) event.preventDefault();
        break;
      }
    }

    this.setState({ cursor });

    if (updateCoordinates) {
      const { x, y } = gridPoint;
      this.setState({ mouseX: x, mouseY: y });
    }
  }

  handleMouseDown(event) {
    window.addEventListener('mousemove', this.handleMouseDrag, true);
    window.addEventListener('mouseup', this.handleMouseUp, true);

    if (event.button != null && event.button !== 0) {
      return;
    }

    this.notifyMouseHandlers(GridMouseHandler.FUNCTION_NAMES.DOWN, event);

    this.startDragTimer(event);
  }

  handleDoubleClick(event) {
    this.notifyMouseHandlers(
      GridMouseHandler.FUNCTION_NAMES.DOUBLE_CLICK,
      event
    );
  }

  handleMouseMove(event) {
    this.notifyMouseHandlers(GridMouseHandler.FUNCTION_NAMES.MOVE, event);
  }

  handleMouseLeave(event) {
    this.notifyMouseHandlers(
      GridMouseHandler.FUNCTION_NAMES.LEAVE,
      event,
      false
    );
    this.setState({ mouseX: null, mouseY: null });
  }

  handleMouseDrag(event) {
    this.setState({ isDragging: true });
    this.notifyMouseHandlers(
      GridMouseHandler.FUNCTION_NAMES.DRAG,
      event,
      true,
      true
    );

    this.stopDragTimer();
  }

  handleMouseUp(event) {
    window.removeEventListener('mousemove', this.handleMouseDrag, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);

    if (event.button != null && event.button !== 0) {
      return;
    }

    this.notifyMouseHandlers(GridMouseHandler.FUNCTION_NAMES.UP, event, false);

    this.stopDragTimer();

    this.removeDocumentCursor();
  }

  handleResize() {
    /**
     * We need to always redraw the canvas in the same frame as the updateCanvasScale
     * because it clears the canvas by nature of direct dom manipulation. However,
     * We also need to verify the state/metrics, which we currently have no way
     * of doing outside of a full componentDidUpdate() call, so we force the update.
     * Ideally, we could verify state/metrics without the forced update.
     */
    this.updateCanvasScale();
    this.updateCanvas();
    this.forceUpdate();
  }

  handleWheel(e) {
    this.notifyMouseHandlers(GridMouseHandler.FUNCTION_NAMES.WHEEL, e);

    if (e.defaultPrevented) {
      return;
    }

    let { deltaX, deltaY } = e;

    const { metricCalculator, metrics } = this;
    const metricState = this.getMetricState();

    const { lastTop, lastLeft } = metrics;
    let { top, left, topOffset, leftOffset } = metrics;

    const theme = this.getTheme();

    // Flip scroll direction if shiftKey is held on windows/linux.
    // On mac, deltaX/Y values are switched at the event level when shiftKey=true.
    // Guard on strictly Y only changing, to ignore trackpad diagonal motion,
    // through that guard may not be necessary, but it is difficult to determine for
    // all platforms/browser/scroll method combos.
    if (
      !GridUtils.isMacPlatform() &&
      e.shiftKey &&
      e.deltaX === 0 &&
      e.deltaY !== 0
    ) {
      deltaX = e.deltaY;
      deltaY = e.deltaX;
    }

    // Normalize other deltaMode values to pixel units
    // deltaMode 0, is already in pixel units
    if (e?.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      // Users can set OS to be in deltaMode page
      // scrolly by page units as pixels
      deltaX *= metrics.barWidth;
      deltaY *= metrics.barHeight;
    } else if (e?.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      // Firefox reports deltaMode line
      // Normalize distance travelled between browsers
      // but remain ~platform/browser combo consistent
      if (GridUtils.isMacPlatform()) {
        // for mac treat lines as a standard row height
        // on mac, firefox travels less distance then chrome per tick
        deltaX = Math.round(deltaX * metrics.rowHeight);
        deltaY = Math.round(deltaY * metrics.rowHeight);
      } else {
        // for windows convert to pixels using the same method as chrome
        // chrome goes 100 per 3 lines, and firefox would go 102 per 3 (17 lineheight * 3 lines * 2)
        // make the behaviour the same between as it's close enough
        deltaX = Math.round(deltaX * Grid.pixelsPerLine);
        deltaY = Math.round(deltaY * Grid.pixelsPerLine);
      }
    }

    // iterate through each column to determine column width and figure out how far to scroll
    // get column width of next column to scroll to, and subract it from the remaining distance to travel
    while (deltaX !== 0) {
      leftOffset += deltaX;
      deltaX = 0;

      // no scrolling needed, at directional edge
      if (
        (leftOffset > 0 && left >= lastLeft) ||
        (leftOffset < 0 && left <= 0)
      ) {
        leftOffset = 0;
        break;
      }

      if (leftOffset > 0) {
        // scroll right

        // get width of next column
        const columnWidth =
          metrics.visibleColumnWidths.get(left) ??
          metricCalculator.getVisibleColumnWidth(left, metricState);

        if (leftOffset >= columnWidth) {
          // remove width from balance and advance by 1 column
          deltaX = leftOffset - columnWidth;
          leftOffset = 0;
          left += 1;
        } else if (theme.scrollSnapToColumn) {
          // if there's still a balance to travel but its less then a column and snapping is on
          leftOffset = 0;
          left += 1;
        }
      } else if (leftOffset < 0) {
        // scroll left

        // get width of next column
        const columnWidth =
          metrics.visibleColumnWidths.get(left - 1) ??
          metricCalculator.getVisibleColumnWidth(left - 1, metricState);

        if (Math.abs(leftOffset) <= columnWidth && theme.scrollSnapToColumn) {
          // if there's still a balance to travel but its less then a column and snapping is on
          leftOffset = 0;
          left -= 1;
        } else {
          // remove width from balance and advance by 1 column
          deltaX = leftOffset + columnWidth;
          leftOffset = 0;
          left -= 1;
        }
      }
    }

    // iterate through each row to determine row height and figure out how far to scroll
    // get row height of next row to scroll to, and subract it from the remaining distance to travel
    while (deltaY !== 0) {
      topOffset += deltaY;
      deltaY = 0;

      // no scrolling needed, at directional edge
      if ((topOffset > 0 && top >= lastTop) || (topOffset < 0 && top <= 0)) {
        topOffset = 0;
        break;
      }

      if (topOffset > 0) {
        // scroll direction down

        // get height of next row
        const rowHeight =
          metrics.visibleRowHeights.get(top) ??
          metricCalculator.getVisibleRowHeight(top, metricState);

        if (topOffset >= rowHeight) {
          // remove height from balance and advance by 1 row
          deltaY = topOffset - rowHeight;
          topOffset = 0;
          top += 1;
        } else if (theme.scrollSnapToRow) {
          // if there's still a balance to travel but its less then a row and snapping is on
          topOffset = 0;
          top += 1;
        }
      } else if (topOffset < 0) {
        // scroll direction up

        // get height of next row
        const rowHeight =
          metrics.visibleRowHeights.get(top - 1) ??
          metricCalculator.getVisibleRowHeight(top - 1, metricState);

        if (Math.abs(topOffset) <= rowHeight && theme.scrollSnapToRow) {
          // if there's still a balance to travel but its less then a row and snapping is on
          topOffset = 0;
          top -= 1;
        } else {
          // remove height from balance and advance by 1 row
          deltaY = topOffset + rowHeight;
          topOffset = 0;
          top -= 1;
        }
      }
    }

    this.setViewState({ top, left, leftOffset, topOffset });

    e.stopPropagation();
    e.preventDefault();
  }

  handleEditCellCancel() {
    this.setState({ editingCell: null });
    this.focus();
  }

  handleEditCellChange(value) {
    this.setState(({ editingCell }) => ({
      editingCell: { ...editingCell, value },
    }));
  }

  handleEditCellCommit(
    value,
    { direction = GridRange.SELECTION_DIRECTION.DOWN, fillRange = false } = {}
  ) {
    const { cursorColumn: column, cursorRow: row, selectedRanges } = this.state;
    if (!this.isValidForCell(column, row, value)) {
      // Don't allow an invalid value to be commited, the editing cell should show an error
      if (direction == null) {
        // If they clicked off of the editing cell, just remove focus
        this.setState({ editingCell: null });
      }
      return;
    }

    if (fillRange) {
      this.setValueForRanges(selectedRanges, value);
    } else {
      this.setValueForCell(column, row, value);
    }

    if (direction != null) {
      this.moveCursorInDirection(direction);
    }

    this.setState({ editingCell: null });

    this.focus();
  }

  renderInputField() {
    const { model } = this.props;
    const { editingCell } = this.state;
    const { metrics } = this;
    if (editingCell == null || metrics == null) {
      return null;
    }
    const { selectionRange = null, value, isQuickEdit } = editingCell;
    const { cursorRow: row, cursorColumn: column } = this.state;
    const {
      gridX,
      gridY,
      visibleColumnXs,
      visibleRowYs,
      visibleColumnWidths,
      visibleRowHeights,
    } = metrics;

    const x = visibleColumnXs.get(column);
    const y = visibleRowYs.get(row);
    const w = visibleColumnWidths.get(column);
    const h = visibleRowHeights.get(row);
    const isVisible = x != null && y != null && w != null && h != null;

    // If the cell isn't visible, we still need to display an invisible cell for focus purposes
    const wrapperStyle = isVisible
      ? {
          position: 'absolute',
          left: gridX + x,
          top: gridY + y,
          width: w,
          height: h,
        }
      : { opacity: 0 };

    const modelColumn = this.getModelColumn(column);
    const modelRow = this.getModelRow(row);
    const inputStyle =
      modelColumn != null && modelRow != null
        ? {
            textAlign: model.textAlignForCell(modelColumn, modelRow),
          }
        : null;
    const isValid = model.isValidForCell(modelColumn, modelRow, value);

    return (
      <div style={wrapperStyle}>
        <CellInputField
          key={`${column},${row}`}
          selectionRange={selectionRange}
          className={classNames({ error: !isValid })}
          onCancel={this.handleEditCellCancel}
          onChange={this.handleEditCellChange}
          onDone={this.handleEditCellCommit}
          isQuickEdit={isQuickEdit}
          style={inputStyle}
          value={value}
        />
      </div>
    );
  }

  render() {
    const { cursor } = this.state;

    return (
      <>
        <canvas
          className={classNames('grid-canvas', Grid.getCursorClassName(cursor))}
          ref={canvas => {
            this.canvas = canvas;
          }}
          onClick={this.handleClick}
          onContextMenu={this.handleContextMenu}
          onDoubleClick={this.handleDoubleClick}
          onKeyDown={this.handleKeyDown}
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseLeave={this.handleMouseLeave}
          tabIndex="0"
        >
          Your browser does not support HTML canvas. Update your browser?
        </canvas>
        {this.renderInputField()}
      </>
    );
  }
}

Grid.propTypes = {
  canvasOptions: PropTypes.shape({}),
  isStickyBottom: PropTypes.bool,
  isStickyRight: PropTypes.bool,
  metricCalculator: PropTypes.instanceOf(GridMetricCalculator),
  model: PropTypes.instanceOf(GridModel).isRequired,
  keyHandlers: PropTypes.arrayOf(PropTypes.instanceOf(KeyHandler)),
  mouseHandlers: PropTypes.arrayOf(PropTypes.instanceOf(GridMouseHandler)),
  movedColumns: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number.isRequired,
      to: PropTypes.number.isRequired,
    })
  ),
  movedRows: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number.isRequired,
      to: PropTypes.number.isRequired,
    })
  ),
  onSelectionChanged: PropTypes.func,
  onMovedColumnsChanged: PropTypes.func,
  onMoveColumnComplete: PropTypes.func,
  onViewChanged: PropTypes.func,
  renderer: PropTypes.instanceOf(GridRenderer),
  stateOverride: PropTypes.shape({}),
  theme: PropTypes.shape({
    autoSelectColumn: PropTypes.bool,
    autoSelectRow: PropTypes.bool,
  }),
};

Grid.defaultProps = {
  canvasOptions: { alpha: false },
  isStickyBottom: false,
  isStickyRight: false,
  metricCalculator: null,
  keyHandlers: [],
  mouseHandlers: [],
  movedColumns: [],
  movedRows: [],
  onSelectionChanged: () => {},
  onMovedColumnsChanged: () => {},
  onMoveColumnComplete: () => {},
  onViewChanged: () => {},
  renderer: null,
  stateOverride: {},
  theme: {
    autoSelectColumn: false,
    autoSelectRow: false,
  },
};

export default Grid;
