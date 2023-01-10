/* eslint react/no-did-update-set-state: "off" */
import React, { CSSProperties, PureComponent, ReactNode } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import clamp from 'lodash.clamp';
import GridMetricCalculator, { GridMetricState } from './GridMetricCalculator';
import GridModel from './GridModel';
import GridMouseHandler, {
  GridMouseEvent,
  GridMouseHandlerFunctionName,
} from './GridMouseHandler';
import GridTheme, { GridTheme as GridThemeType } from './GridTheme';
import GridRange, { GridRangeIndex, SELECTION_DIRECTION } from './GridRange';
import GridRenderer, {
  EditingCell,
  EditingCellTextSelectionRange,
} from './GridRenderer';
import GridUtils, { GridPoint } from './GridUtils';
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
  GridSeparator,
} from './mouse-handlers';
import './Grid.scss';
import KeyHandler, { GridKeyboardEvent } from './KeyHandler';
import {
  EditKeyHandler,
  PasteKeyHandler,
  SelectionKeyHandler,
  TreeKeyHandler,
} from './key-handlers';
import CellInputField from './CellInputField';
import PasteError from './errors/PasteError';
import GridMetrics, {
  Coordinate,
  ModelIndex,
  MoveOperation,
  VisibleIndex,
} from './GridMetrics';
import { isExpandableGridModel } from './ExpandableGridModel';
import {
  assertIsEditableGridModel,
  EditOperation,
  isEditableGridModel,
} from './EditableGridModel';
import { EventHandlerResultOptions } from './EventHandlerResult';
import { assertIsDefined } from './errors';
import ThemeContext from './ThemeContext';
import { DraggingColumn } from './mouse-handlers/GridColumnMoveMouseHandler';

type LegacyCanvasRenderingContext2D = CanvasRenderingContext2D & {
  webkitBackingStorePixelRatio?: number;
  mozBackingStorePixelRatio?: number;
  msBackingStorePixelRatio?: number;
  oBackingStorePixelRatio?: number;
  backingStorePixelRatio?: number;
};

export type GridProps = typeof Grid.defaultProps & {
  // Options to set on the canvas
  canvasOptions?: CanvasRenderingContext2DSettings;

  // Whether the grid should stick to the bottom or the right once scrolled to the end
  // Only matters with ticking grids
  isStickyBottom?: boolean;
  isStickyRight?: boolean;

  // Whether the grid is currently stuck to the bottom or the right
  isStuckToBottom?: boolean;
  isStuckToRight?: boolean;

  // Calculate all the metrics required for drawing the grid
  metricCalculator?: GridMetricCalculator;

  // The model to pull data from
  model: GridModel;

  // Optional key and mouse handlers
  keyHandlers?: KeyHandler[];
  mouseHandlers?: GridMouseHandler[];

  // Initial state of moved columns or rows
  movedColumns?: MoveOperation[];
  movedRows?: MoveOperation[];

  // Callback for if an error occurs
  onError?: (e: Error) => void;

  // Callback when the selection within the grid changes
  onSelectionChanged?: (ranges: GridRange[]) => void;

  // Callback when the moved columns or rows have changed
  onMovedColumnsChanged?: (movedColumns: MoveOperation[]) => void;
  onMovedRowsChanged?: (movedRows: MoveOperation[]) => void;

  // Callback when a move operation is completed
  onMoveColumnComplete?: (movedColumns: MoveOperation[]) => void;
  onMoveRowComplete?: (movedRows: MoveOperation[]) => void;

  // Callback when the viewport has scrolled or changed
  onViewChanged?: (metrics: GridMetrics) => void;

  // Renderer for the grid canvas
  renderer?: GridRenderer;

  // Optional state override to pass in to the metric and render state
  // Can be used to add custom properties as well
  stateOverride?: Record<string, unknown>;

  theme?: Partial<GridThemeType>;
};

export type GridState = {
  // Top/left visible cell in the grid. Note that it's visible row/column index, not the model index (ie. if columns are re-ordered)
  top: VisibleIndex;
  left: VisibleIndex;

  // The scroll offset of the top/left cell. 0,0 means the cell is at the top left
  topOffset: number; // Should be less than the height of the row
  leftOffset: number; // Should be less than the width of the column

  // current column/row that user is dragging
  draggingColumn: DraggingColumn | null;
  draggingRow: VisibleIndex | null;

  // Offset when dragging a row
  draggingRowOffset: number | null;

  // When drawing header separators for resizing
  // Keeps hover style when mouse is in buffer before resize starts
  draggingColumnSeparator: GridSeparator | null;
  draggingRowSeparator: GridSeparator | null;

  // Dragging a scroll bar status
  isDraggingHorizontalScrollBar: boolean;
  isDraggingVerticalScrollBar: boolean;

  // Anything is performing a drag, for blocking hover rendering
  isDragging: boolean;

  // The coordinates of the mouse. May be outside of the canvas
  mouseX: number | null;
  mouseY: number | null;

  // Move operations the user has performed on this grids columns/rows
  movedColumns: MoveOperation[];
  movedRows: MoveOperation[];

  // Cursor (highlighted cell) location and active selected range
  cursorRow: VisibleIndex | null;
  cursorColumn: VisibleIndex | null;
  selectionStartRow: VisibleIndex | null;
  selectionStartColumn: VisibleIndex | null;
  selectionEndRow: VisibleIndex | null;
  selectionEndColumn: VisibleIndex | null;

  // Currently selected ranges and previously selected ranges
  // Store the previously selected ranges to determine if the new selection should
  // deselect again (if it's the same range)
  selectedRanges: GridRange[];
  lastSelectedRanges: GridRange[];

  // The mouse cursor style to use when hovering over the grid element
  cursor: string | null;

  // { column: number, row: number, selectionRange: [number, number], value: string | null, isQuickEdit?: boolean }
  // The cell that is currently being edited
  editingCell: EditingCell | null;

  // Whether we're stuck to the bottom or the right
  isStuckToBottom: boolean;
  isStuckToRight: boolean;
};

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
class Grid extends PureComponent<GridProps, GridState> {
  static contextType = ThemeContext;

  static defaultProps = {
    canvasOptions: { alpha: false } as CanvasRenderingContext2DSettings,
    isStickyBottom: false,
    isStickyRight: false,
    isStuckToBottom: false,
    isStuckToRight: false,
    keyHandlers: [] as KeyHandler[],
    mouseHandlers: [] as GridMouseHandler[],
    movedColumns: [] as MoveOperation[],
    movedRows: [] as MoveOperation[],
    onError: (): void => undefined,
    onSelectionChanged: (): void => undefined,
    onMovedColumnsChanged: (moveOperations: MoveOperation[]): void => undefined,
    onMoveColumnComplete: (): void => undefined,
    onMovedRowsChanged: (): void => undefined,
    onMoveRowComplete: (): void => undefined,
    onViewChanged: (): void => undefined,
    stateOverride: {} as Record<string, unknown>,
    theme: {
      autoSelectColumn: false,
      autoSelectRow: false,
    } as Partial<GridThemeType>,
  };

  // use same constant as chrome source for windows
  // https://github.com/chromium/chromium/blob/973af9d461b6b5dc60208c8d3d66adc27e53da78/ui/events/blink/web_input_event_builders_win.cc#L285
  static pixelsPerLine = 100 / 3;

  static dragTimeout = 1000;

  static getTheme = memoize(
    (
      contextTheme: Partial<GridThemeType>,
      userTheme: Partial<GridThemeType>
    ) => ({
      ...GridTheme,
      ...contextTheme,
      ...userTheme,
    })
  );

  /**
   * On some devices there may be different scaling required for high DPI. Get the scale required for the canvas.
   * @param context The canvas context
   * @returns The scale to use
   */
  static getScale(context: CanvasRenderingContext2D): number {
    const devicePixelRatio = window.devicePixelRatio || 1;

    // backingStorePixelRatio is deprecated, but check it just in case
    const legacyContext = context as LegacyCanvasRenderingContext2D;

    const backingStorePixelRatio =
      // Not worth converting to a massive if structure
      // Converting would reduce readability and maintainability
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      legacyContext.webkitBackingStorePixelRatio ??
      legacyContext.mozBackingStorePixelRatio ??
      legacyContext.msBackingStorePixelRatio ??
      legacyContext.oBackingStorePixelRatio ??
      legacyContext.backingStorePixelRatio ??
      1;
    return devicePixelRatio / backingStorePixelRatio;
  }

  /**
   * Get the class name from the cursor provided
   * @param cursor The grid cursor to use
   * @returns Class name with the grid-cursor prefix or null if no cursor provided
   */
  static getCursorClassName(cursor: string | null): string | null {
    return cursor != null && cursor !== '' ? `grid-cursor-${cursor}` : null;
  }

  // Need to disable react/sort-comp so I can put the fields here
  /* eslint-disable react/sort-comp */
  renderer: GridRenderer;

  metricCalculator: GridMetricCalculator;

  canvas: HTMLCanvasElement | null;

  canvasContext: CanvasRenderingContext2D | null;

  // We draw the canvas on the next animation frame, keep track of the next one
  animationFrame: number | null;

  // Keep track of previous metrics and new metrics for comparison
  prevMetrics: GridMetrics | null;

  metrics: GridMetrics | null;

  // Track the cursor that is currently added to the document
  // Add to document so that when dragging the cursor stays, even if mouse leaves the canvas
  // Note: on document, not body so that cursor styling can be combined with
  // blocked pointer events that would otherwise prevent cursor styling from showing
  documentCursor: string | null;

  dragTimer: ReturnType<typeof setTimeout> | null;

  keyHandlers: KeyHandler[];

  mouseHandlers: GridMouseHandler[];

  /* eslint-enable react/sort-comp */

  constructor(props: GridProps) {
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

    const {
      isStuckToBottom,
      isStuckToRight,
      metricCalculator,
      movedColumns,
      movedRows,
      renderer,
    } = props;

    this.renderer = renderer || new GridRenderer();
    this.metricCalculator = metricCalculator || new GridMetricCalculator();

    this.canvas = null;
    this.canvasContext = null;
    this.animationFrame = null;

    this.prevMetrics = null;
    this.metrics = null;

    // Track the cursor that is currently added to the document
    // Add to document so that when dragging the cursor stays, even if mouse leaves the canvas
    // Note: on document, not body so that cursor styling can be combined with
    // blocked pointer events that would otherwise prevent cursor styling from showing
    this.documentCursor = null;

    this.dragTimer = null;

    // specify handler ordering, such that any extensions can insert handlers in between
    this.keyHandlers = [
      new EditKeyHandler(400),
      new PasteKeyHandler(450),
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

      // Offset when dragging a row
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

      // Cursor (highlighted cell) location and active selected range
      cursorRow: null,
      cursorColumn: null,
      selectionStartRow: null,
      selectionStartColumn: null,
      selectionEndRow: null,
      selectionEndColumn: null,

      // Currently selected ranges and previously selected ranges
      // Store the previously selected ranges to determine if the new selection should
      // deselect again (if it's the same range)
      selectedRanges: [],
      lastSelectedRanges: [],

      // The mouse cursor style to use when hovering over the grid element
      cursor: null,

      // { column: number, row: number, selectionRange: [number, number], value: string | null, isQuickEdit?: boolean }
      // The cell that is currently being edited
      editingCell: null,

      isStuckToBottom,
      isStuckToRight,
    };
  }

  componentDidMount(): void {
    this.initContext();

    // Need to explicitly add wheel event to canvas so we can preventDefault/avoid passive listener issue
    // Otherwise React attaches listener at doc level and you can't prevent default
    // https://github.com/facebook/react/issues/14856
    this.canvas?.addEventListener('wheel', this.handleWheel, {
      passive: false,
    });
    window.addEventListener('resize', this.handleResize);

    this.updateCanvasScale();
    this.updateCanvas();

    // apply on mount, so that it works with a static model
    // https://github.com/deephaven/web-client-ui/issues/581
    const { isStuckToBottom, isStuckToRight } = this.props;
    if (isStuckToBottom) {
      this.scrollToBottom();
    }
    if (isStuckToRight) {
      this.scrollToRight();
    }
  }

  componentDidUpdate(prevProps: GridProps, prevState: GridState): void {
    const {
      isStickyBottom,
      isStickyRight,
      movedColumns,
      movedRows,
      onMovedColumnsChanged,
      onMoveColumnComplete,
      onMovedRowsChanged,
      onMoveRowComplete,
    } = this.props;

    const {
      isStickyBottom: prevIsStickyBottom,
      isStickyRight: prevIsStickyRight,
      movedColumns: prevPropMovedColumns,
      movedRows: prevPropMovedRows,
    } = prevProps;
    const {
      movedColumns: prevStateMovedColumns,
      movedRows: prevStateMovedRows,
    } = prevState;
    const {
      draggingColumn,
      draggingRow,
      movedColumns: currentStateMovedColumns,
      movedRows: currentStateMovedRows,
    } = this.state;

    if (prevPropMovedColumns !== movedColumns) {
      this.setState({ movedColumns });
    }

    if (prevPropMovedRows !== movedRows) {
      this.setState({ movedRows });
    }

    if (prevStateMovedColumns !== currentStateMovedColumns) {
      onMovedColumnsChanged(currentStateMovedColumns);
    }

    if (prevState.draggingColumn != null && draggingColumn == null) {
      onMoveColumnComplete(currentStateMovedColumns);
    }

    if (prevStateMovedRows !== currentStateMovedRows) {
      onMovedRowsChanged(currentStateMovedRows);
    }

    if (prevState.draggingRow != null && draggingRow == null) {
      onMoveRowComplete(currentStateMovedRows);
    }

    if (isStickyBottom !== prevIsStickyBottom) {
      this.setState({ isStuckToBottom: false });
    }

    if (isStickyRight !== prevIsStickyRight) {
      this.setState({ isStuckToRight: false });
    }

    this.updateMetrics();

    this.requestUpdateCanvas();

    if (!this.metrics || !this.prevMetrics) {
      return;
    }

    const { rowCount, columnCount, height, width } = this.metrics;
    const {
      rowCount: prevRowCount,
      columnCount: prevColumnCount,
      height: prevHeight,
      width: prevWidth,
    } = this.prevMetrics;

    if (prevRowCount !== rowCount || height !== prevHeight) {
      const { isStuckToBottom } = this.state;
      if (isStuckToBottom) {
        this.scrollToBottom();
      }
    }

    if (prevColumnCount !== columnCount || width !== prevWidth) {
      const { isStuckToRight } = this.state;
      if (isStuckToRight) {
        this.scrollToRight();
      }
    }

    if (this.validateSelection()) {
      this.checkSelectionChange(prevState);
    }
  }

  componentWillUnmount(): void {
    if (this.animationFrame != null) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.canvas?.removeEventListener('wheel', this.handleWheel);

    window.removeEventListener(
      'mousemove',
      (this.handleMouseDrag as unknown) as EventListenerOrEventListenerObject,
      true
    );
    window.removeEventListener(
      'mouseup',
      (this.handleMouseUp as unknown) as EventListenerOrEventListenerObject,
      true
    );
    window.removeEventListener('resize', this.handleResize);

    this.stopDragTimer();
  }

  getTheme(): GridThemeType {
    const { theme } = this.props;
    return Grid.getTheme(this.context, theme);
  }

  getGridPointFromEvent(event: GridMouseEvent): GridPoint {
    assertIsDefined(this.canvas);

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return this.getGridPointFromXY(x, y);
  }

  getGridPointFromXY(x: Coordinate, y: Coordinate): GridPoint {
    if (!this.metrics) throw new Error('metrics must be set');

    return GridUtils.getGridPointFromXY(x, y, this.metrics);
  }

  getMetricState(state = this.state): GridMetricState {
    const theme = this.getTheme();
    const { model, stateOverride } = this.props;
    if (!this.canvasContext || !this.canvas) {
      throw new Error('Canvas and context must be defined to get metrics');
    }
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
      draggingColumn,
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
      draggingColumn,
      ...stateOverride,
    };
  }

  getCachedKeyHandlers = memoize((keyHandlers: KeyHandler[]) =>
    [...keyHandlers, ...this.keyHandlers].sort((a, b) => a.order - b.order)
  );

  getKeyHandlers(): KeyHandler[] {
    const { keyHandlers } = this.props;
    return this.getCachedKeyHandlers(keyHandlers);
  }

  getCachedMouseHandlers = memoize((mouseHandlers: GridMouseHandler[]) =>
    [...mouseHandlers, ...this.mouseHandlers].sort((a, b) => a.order - b.order)
  );

  getMouseHandlers(): GridMouseHandler[] {
    const { mouseHandlers } = this.props;
    return this.getCachedMouseHandlers(mouseHandlers);
  }

  /**
   * Translate from the provided visible index to the model index
   * @param columnIndex The column index to get the model for
   * @returns The model index
   */
  getModelColumn(columnIndex: VisibleIndex): ModelIndex {
    const modelIndex = this.metrics?.modelColumns?.get(columnIndex);
    if (modelIndex === undefined) {
      throw new Error(`Unable to get ModelIndex for column ${columnIndex}`);
    }
    return modelIndex;
  }

  /**
   * Translate from the provided visible index to the model index
   * @param rowIndex The row index to get the model for
   * @returns The model index
   */
  getModelRow(rowIndex: VisibleIndex): ModelIndex {
    const modelIndex = this.metrics?.modelRows?.get(rowIndex);
    if (modelIndex === undefined) {
      throw new Error(`Unable to get ModelIndex for row ${rowIndex}`);
    }
    return modelIndex;
  }

  /**
   * Toggle a row between expanded and collapsed states
   * @param row The row to toggle expansion for
   */
  toggleRowExpanded(row: VisibleIndex): void {
    const modelRow = this.getModelRow(row);
    const { model } = this.props;
    // We only want to set expansion if the row is expandable
    // If it's not, still move the cursor to that position, as it may be outside of the current viewport and we don't know if it's expandable yet
    if (isExpandableGridModel(model) && model.isRowExpandable(modelRow)) {
      model.setRowExpanded(modelRow, !model.isRowExpanded(modelRow));
    }
    this.clearSelectedRanges();
    this.commitSelection(); // Need to commit before moving in case we're selecting same row again
    this.moveCursorToPosition(0, row);
    this.commitSelection();

    this.setState({ isStuckToBottom: false });
  }

  /**
   * Scrolls to bottom, if not already at bottom
   */
  scrollToBottom(): void {
    if (!this.metrics) return;
    const { bottomVisible, rowCount, top, lastTop } = this.metrics;
    if ((bottomVisible < rowCount - 1 && bottomVisible > 0) || top > lastTop) {
      this.setState({ top: lastTop });
    }
  }

  /**
   * Scrolls to right, if not already at right
   */
  scrollToRight(): void {
    if (!this.metrics) return;
    const { rightVisible, columnCount, left, lastLeft } = this.metrics;
    if (
      (rightVisible < columnCount - 1 && rightVisible > 0) ||
      left > lastLeft
    ) {
      this.setState({ left: lastLeft });
    }
  }

  /**
   * Allows the selected ranges to be set programatically
   * Will update the cursor and selection start/end based on the new ranges
   * @param gridRanges The new selected ranges to set
   */
  setSelectedRanges(gridRanges: GridRange[]): void {
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

  initContext(): void {
    const { canvas } = this;
    const { canvasOptions } = this.props;

    if (!canvas) throw new Error('Canvas not set');

    this.canvasContext = canvas.getContext('2d', canvasOptions);
  }

  requestUpdateCanvas(): void {
    if (this.animationFrame != null) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;

      if (!this.metrics) throw new Error('Metrics not set');

      this.updateCanvas(this.metrics);
    });
  }

  updateCanvas(metrics = this.updateMetrics()): void {
    this.updateCanvasScale();

    const { onViewChanged } = this.props;
    onViewChanged(metrics);

    this.drawCanvas(metrics);
  }

  updateCanvasScale(): void {
    const { canvas, canvasContext } = this;
    if (!canvas) throw new Error('canvas not set');
    if (!canvasContext) throw new Error('canvasContext not set');
    if (!canvas.parentElement) throw new Error('Canvas has no parent element');

    const scale = Grid.getScale(canvasContext);
    // the parent wrapper has 100% width/height, and is used for determining size
    // we don't want to stretch the canvas to 100%, to avoid fractional pixels.
    // A wrapper element must be used for sizing, and canvas size must be
    // set manually to a floored value in css and a scaled value in width/height
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvasContext.scale(scale, scale);
  }

  updateScrollBounds(): void {
    if (!this.metrics) throw new Error('metrics not set');
    const { left, top } = this.state;
    const { lastLeft, lastTop } = this.metrics;
    if (left > lastLeft) {
      this.setState({ left: lastLeft, leftOffset: 0 });
    }
    if (top > lastTop) {
      this.setState({ top: lastTop, topOffset: 0 });
    }
  }

  updateMetrics(state = this.state): GridMetrics {
    this.prevMetrics = this.metrics;

    const { metricCalculator } = this;
    const metricState = this.getMetricState(state);
    this.metrics = metricCalculator.getMetrics(metricState);
    this.updateScrollBounds();

    return this.metrics;
  }

  /**
   * Check if the selection state has changed, and call the onSelectionChanged callback if they have
   * @param prevState The previous grid state
   */
  checkSelectionChange(prevState: GridState): void {
    const { selectedRanges: oldSelectedRanges } = prevState;
    const { selectedRanges } = this.state;

    if (selectedRanges !== oldSelectedRanges) {
      const { onSelectionChanged } = this.props;
      onSelectionChanged(selectedRanges);
    }
  }

  /**
   * Validate the current selection, and reset if it is invalid
   * @returns True if the selection is valid, false if the selection was invalid and has been reset
   */
  validateSelection(): boolean {
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

  /**
   * Clears all selected ranges
   */
  clearSelectedRanges(): void {
    const { selectedRanges } = this.state;
    this.setState({ selectedRanges: [], lastSelectedRanges: selectedRanges });
  }

  /** Clears all but the last selected range */
  trimSelectedRanges(): void {
    const { selectedRanges } = this.state;
    if (selectedRanges.length > 0) {
      this.setState({
        selectedRanges: selectedRanges.slice(selectedRanges.length - 1),
      });
    }
  }

  /**
   * Begin a selection operation at the provided location
   * @param column Column where the selection is beginning
   * @param row Row where the selection is beginning
   */
  beginSelection(column: GridRangeIndex, row: GridRangeIndex): void {
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
   * @param column The column index to move the cursor to
   * @param row The row index to move the cursor to
   * @param extendSelection Whether to extend the current selection (eg. holding Shift)
   * @param maximizePreviousRange When true, maximize/add to the previous range only, ignoring where the selection was started.
   */
  moveSelection(
    column: GridRangeIndex,
    row: GridRangeIndex,
    extendSelection = false,
    maximizePreviousRange = false
  ): void {
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
          left =
            autoSelectRow !== undefined && autoSelectRow
              ? null
              : Math.min(column ?? 0, lastSelectedRange.startColumn ?? 0);
          top =
            autoSelectColumn !== undefined && autoSelectColumn
              ? null
              : Math.min(row ?? 0, lastSelectedRange.startRow ?? 0);
          right =
            autoSelectRow !== undefined && autoSelectRow
              ? null
              : Math.max(column ?? 0, lastSelectedRange.endColumn ?? 0);
          bottom =
            autoSelectColumn !== undefined && autoSelectColumn
              ? null
              : Math.max(row ?? 0, lastSelectedRange.endRow ?? 0);
        } else {
          left = lastSelectedRange.startColumn;
          top = lastSelectedRange.startRow;

          if (selectionStartColumn != null || selectionStartRow != null) {
            if (autoSelectRow === undefined || !autoSelectRow) {
              left = selectionStartColumn;
            }
            if (autoSelectColumn === undefined || !autoSelectColumn) {
              top = selectionStartRow;
            }
          }
          right = autoSelectRow !== undefined && autoSelectRow ? null : column;
          bottom =
            autoSelectColumn !== undefined && autoSelectColumn ? null : row;
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

        const newRanges = [...selectedRanges];
        newRanges[newRanges.length - 1] = selectedRange;
        return {
          selectedRanges: newRanges,
          selectionEndColumn: column,
          selectionEndRow: row,
        };
      }
      const newRanges = [...selectedRanges];
      const selectedColumn =
        autoSelectRow !== undefined && autoSelectRow ? null : column;
      const selectedRow =
        autoSelectColumn !== undefined && autoSelectColumn ? null : row;
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
  commitSelection(): void {
    this.setState((state: GridState) => {
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
        (autoSelectRow !== undefined && autoSelectRow
          ? GridRange.rowCount(selectedRanges) === 1
          : GridRange.cellCount(selectedRanges) === 1) &&
        GridRange.rangeArraysEqual(selectedRanges, lastSelectedRanges)
      ) {
        // If it's the exact same single selection, then deselect.
        // For if we click on one cell multiple times.
        return {
          selectedRanges: [],
          lastSelectedRanges: [],
          cursorColumn,
          cursorRow,
        };
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

  setFocusRow(focusedRow: number): void {
    if (!this.metrics || !this.prevMetrics) {
      return;
    }

    const { gridY, height, lastTop, userRowHeights, rowHeight } = this.metrics;

    const tableHeight = height - gridY;

    const halfViewportHeight =
      Math.round(tableHeight / 2) +
      (userRowHeights.get(focusedRow) ?? rowHeight);

    const metricState = this.getMetricState();
    const newTop = this.metricCalculator.getLastTop(
      metricState,
      focusedRow + 1,
      halfViewportHeight
    );
    this.setState({
      top: Math.min(lastTop, newTop),
      selectedRanges: [new GridRange(null, focusedRow, null, focusedRow)],
    });
    const { cursorColumn } = this.state;
    this.moveCursorToPosition(cursorColumn, focusedRow, false, false);
  }

  /**
   * Set the selection to the entire grid
   */
  selectAll(): void {
    const { model, theme } = this.props;
    const { autoSelectRow, autoSelectColumn } = theme;

    const top = autoSelectColumn !== undefined && autoSelectColumn ? null : 0;
    const bottom =
      autoSelectColumn !== undefined && autoSelectColumn
        ? null
        : model.rowCount - 1;
    const left = autoSelectRow !== undefined && autoSelectRow ? null : 0;
    const right =
      autoSelectRow !== undefined && autoSelectRow
        ? null
        : model.columnCount - 1;
    this.setSelectedRanges([new GridRange(left, top, right, bottom)]);
  }

  /**
   * Move the cursor in relation to the current cursor position
   * @param deltaColumn Number of columns to move the cursor
   * @param deltaRow Number of rows to move the cursor
   * @param extendSelection True if the current selection should be extended, false to start a new selection
   */
  moveCursor(
    deltaColumn: number,
    deltaRow: number,
    extendSelection: boolean
  ): void {
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
   * @param direction The direction to move the cursor in
   */
  moveCursorInDirection(direction = GridRange.SELECTION_DIRECTION.DOWN): void {
    const { model } = this.props;
    const { columnCount, rowCount } = model;
    const { cursorRow, cursorColumn, selectedRanges } = this.state;
    const ranges =
      selectedRanges.length > 0
        ? selectedRanges
        : [GridRange.makeCell(cursorColumn, cursorRow)];
    let nextCursor = null;
    if (ranges.length === 1 && GridRange.cellCount(ranges) === 1) {
      // If we only have one cell selected, we want to update the cursor and we want to update the selected cells
      const gridRange = new GridRange(0, 0, columnCount - 1, rowCount - 1);
      nextCursor =
        gridRange.nextCell(cursorColumn, cursorRow, direction) ??
        gridRange.startCell(direction);
    } else {
      nextCursor = GridRange.nextCell(
        GridRange.boundedRanges(ranges, columnCount, rowCount),
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
          selectedRanges: [GridRange.makeCell(column, row)],
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
   * @param column The column index to move the cursor to
   * @param row The row index to move the cursor to
   * @param extendSelection Whether to extend the current selection (eg. holding Shift)
   * @param keepCursorInView Whether to move the viewport so that the cursor is in view
   * @param maximizePreviousRange With this and `extendSelection` true, it will maximize/add to the previous range only, ignoring where the selection was started
   */
  moveCursorToPosition(
    column: GridRangeIndex,
    row: GridRangeIndex,
    extendSelection = false,
    keepCursorInView = true,
    maximizePreviousRange = false
  ): void {
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
   * @param column The column index to bring into view
   * @param row The row index to bring into view
   */
  moveViewToCell(column: GridRangeIndex, row: GridRangeIndex): void {
    if (!this.metrics) throw new Error('metrics not set');

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
   * @param viewState New state properties to set.
   * @param forceUpdate Whether to force an update.
   */
  setViewState(viewState: Partial<GridState>, forceUpdate = false): void {
    if (!this.metrics) throw new Error('metrics not set');

    const { isStickyBottom, isStickyRight } = this.props;
    const { top, left } = viewState;
    const { lastTop, lastLeft } = this.metrics;
    if (top != null) {
      this.setState({ isStuckToBottom: isStickyBottom && top >= lastTop });
    }
    if (left != null) {
      this.setState({ isStuckToRight: isStickyRight && left >= lastLeft });
    }

    this.setState(viewState as GridState);
    if (forceUpdate) {
      this.forceUpdate();
    }
  }

  /**
   * Start editing the data at the given index
   *
   * @param column The visible column index to start editing
   * @param row The visible row index to start editing
   * @param isQuickEdit If this is a quick edit (the arrow keys can commit)
   * @param selectionRange The tuple [start,end] text selection range of the value to select when editing
   * @param value The value to start with in the edit field. Leave undefined to use the current value.
   */
  startEditing(
    column: VisibleIndex,
    row: VisibleIndex,
    isQuickEdit = false,
    selectionRange?: EditingCellTextSelectionRange,
    value?: string
  ): void {
    const { model } = this.props;
    if (!isEditableGridModel(model)) throw new Error('model is not editable');

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

    this.setState({ editingCell: cell, cursorColumn: column, cursorRow: row });
    this.moveViewToCell(column, row);
  }

  /**
   * Check if a value is valid for a specific cell
   * @param column Column index of the cell to check
   * @param row Row index of the cell to check
   * @param value Value to check
   * @returns True if the value is valid for the provided cell, false otherwise
   */
  isValidForCell(
    column: VisibleIndex,
    row: VisibleIndex,
    value: string
  ): boolean {
    const { model } = this.props;

    const modelColumn = this.getModelColumn(column);
    const modelRow = this.getModelRow(row);
    return (
      isEditableGridModel(model) &&
      model.isValidForCell(modelColumn, modelRow, value)
    );
  }

  /**
   * Paste a value with the current selection
   * It first needs to validate that the pasted table is valid for the given selection.
   * Also may update selection if single cells are selected and a table is pasted.
   * @param value Table or a string that is being pasted
   */
  async pasteValue(value: string[][] | string): Promise<void> {
    const { model } = this.props;
    const { movedColumns, movedRows, selectedRanges } = this.state;

    try {
      assertIsEditableGridModel(model);

      if (
        !model.isEditable ||
        !selectedRanges.every(range => model.isEditableRange(range))
      ) {
        throw new PasteError("Can't paste in to read-only area.");
      }

      if (selectedRanges.length <= 0) {
        throw new PasteError('Select an area to paste to.');
      }

      if (typeof value === 'string') {
        // Just paste the value into all the selected cells
        const edits: EditOperation[] = [];

        const modelRanges = GridUtils.getModelRanges(
          selectedRanges,
          movedColumns,
          movedRows
        );
        GridRange.forEachCell(modelRanges, (column, row) => {
          edits.push({ column, row, text: value });
        });
        await model.setValues(edits);
        return;
      }

      // Otherwise it's a table of data
      const tableHeight = value.length;
      const tableWidth = value[0].length;
      const { columnCount, rowCount } = model;
      let ranges = selectedRanges;
      // If each cell is a single selection, we need to update the selection to map to the newly pasted data
      if (
        ranges.every(
          range =>
            GridRange.cellCount([range]) === 1 &&
            (range.startColumn ?? 0) + tableWidth <= columnCount &&
            (range.startRow ?? 0) + tableHeight <= rowCount
        )
      ) {
        // Remap the selected ranges
        ranges = ranges.map(
          range =>
            new GridRange(
              range.startColumn,
              range.startRow,
              (range.startColumn ?? 0) + tableWidth - 1,
              (range.startRow ?? 0) + tableHeight - 1
            )
        );
        this.setSelectedRanges(ranges);
      }

      if (
        !ranges.every(
          range =>
            GridRange.rowCount([range]) === tableHeight &&
            GridRange.columnCount([range]) === tableWidth
        )
      ) {
        throw new PasteError('Copy and paste area are not same size.');
      }

      const edits: EditOperation[] = [];
      ranges.forEach(range => {
        for (let x = 0; x < tableWidth; x += 1) {
          for (let y = 0; y < tableHeight; y += 1) {
            edits.push({
              column: (range.startColumn ?? 0) + x,
              row: (range.startRow ?? 0) + y,
              text: value[y][x],
            });
          }
        }
      });
      await model.setValues(edits);
    } catch (e) {
      const { onError } = this.props;
      onError(e instanceof Error ? e : new Error(`${e}`));
    }
  }

  /**
   * Set a value to a specific cell. If the value is not valid for that cell, do not set it
   * @param column Column index to set the value for
   * @param row Row index to set the value for
   * @param value Value to set at that cell
   * @returns true If the value was valid and attempted to be set, false is it was not valid
   */
  setValueForCell(
    column: VisibleIndex,
    row: VisibleIndex,
    value: string
  ): boolean {
    const { model } = this.props;
    assertIsEditableGridModel(model);

    const modelColumn = this.getModelColumn(column);
    const modelRow = this.getModelRow(row);
    if (model.isValidForCell(modelColumn, modelRow, value)) {
      model.setValueForCell(modelColumn, modelRow, value);
      return true;
    }
    return false;
  }

  /**
   * Set a value on all the ranges provided
   * @param ranges Ranges to set
   * @param value The value to set on all the ranges
   */
  setValueForRanges(ranges: GridRange[], value: string): void {
    const { model } = this.props;
    const { movedColumns, movedRows } = this.state;

    const modelRanges = GridUtils.getModelRanges(
      ranges,
      movedColumns,
      movedRows
    );
    if (isEditableGridModel(model)) {
      model.setValueForRanges(modelRanges, value);
    }
  }

  /**
   * Check if a given cell is within the current selection
   * @param row Row to check
   * @param column Column to check
   * @returns True if the cell is in the current selection, false otherwise
   */
  isSelected(row: VisibleIndex, column: VisibleIndex): boolean {
    const { selectedRanges } = this.state;

    for (let i = 0; i < selectedRanges.length; i += 1) {
      const selectedRange = selectedRanges[i];
      const rowSelected =
        selectedRange.startRow === null ||
        (selectedRange.startRow <= row && row <= (selectedRange.endRow ?? 0));
      const columnSelected =
        selectedRange.startColumn === null ||
        (selectedRange.startColumn <= column &&
          column <= (selectedRange.endColumn ?? 0));
      if (rowSelected && columnSelected) {
        return true;
      }
    }

    return false;
  }

  addDocumentCursor(cursor: string | null = null): void {
    if (this.documentCursor === Grid.getCursorClassName(cursor)) return;
    if (this.documentCursor != null) {
      document.documentElement.classList.remove(this.documentCursor);
    }
    this.documentCursor = Grid.getCursorClassName(cursor);
    if (this.documentCursor != null) {
      document.documentElement.classList.add(this.documentCursor);
    }
    document.documentElement.classList.add('grid-block-events');
  }

  removeDocumentCursor(): void {
    if (this.documentCursor != null) {
      document.documentElement.classList.remove(this.documentCursor);
      document.documentElement.classList.remove('grid-block-events');
      this.documentCursor = null;
    }
  }

  startDragTimer(event: React.MouseEvent): void {
    this.stopDragTimer();

    const mouseEvent = new MouseEvent('custom', event.nativeEvent);

    this.dragTimer = setTimeout(() => {
      this.handleMouseDrag(mouseEvent);
    }, Grid.dragTimeout);
  }

  stopDragTimer(): void {
    if (this.dragTimer) {
      clearTimeout(this.dragTimer);
      this.dragTimer = null;
    }
  }

  /**
   * Draw the grid with the metrics provided
   * When scrolling you've have to re-draw the whole canvas. As a consequence, all these drawing methods
   * must be very quick.
   * @param metrics Metrics to use for rendering the grid
   */
  drawCanvas(metrics = this.updateMetrics()): void {
    if (!this.canvas) throw new Error('canvas is not set');
    if (!this.canvasContext) throw new Error('context not set');

    const {
      cursorColumn,
      cursorRow,
      draggingColumn,
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

  /**
   * Set focus to this grid element
   */
  focus(): void {
    this.canvas?.focus();
  }

  /**
   * Check if this grid is currently focused
   * @returns True if the active element is this grid
   */
  isFocused(): boolean {
    return document.activeElement === this.canvas;
  }

  /**
   * Handle a mouse click event. Pass the event to the registered mouse handlers until one handles it.
   * Focuses the grid after the click.
   * @param event The mouse event
   */
  handleClick(event: React.MouseEvent): void {
    const gridPoint = this.getGridPointFromEvent(event);

    const mouseHandlers = this.getMouseHandlers();
    for (let i = 0; i < mouseHandlers.length; i += 1) {
      const mouseHandler = mouseHandlers[i];
      if (mouseHandler.onClick(gridPoint, this, event) !== false) {
        event.stopPropagation();
        event.preventDefault();
        break;
      }
    }

    this.canvas?.focus();
  }

  /**
   * Handle a mouse context menu event. Pass the event to the registered mouse handlers until one handles it.
   * @param event The mouse event triggering the context menu
   */
  handleContextMenu(event: React.MouseEvent): void {
    const gridPoint = this.getGridPointFromEvent(event);

    const mouseHandlers = this.getMouseHandlers();
    for (let i = 0; i < mouseHandlers.length; i += 1) {
      const mouseHandler = mouseHandlers[i];
      if (mouseHandler.onContextMenu(gridPoint, this, event) !== false) {
        event.stopPropagation();
        event.preventDefault();
        break;
      }
    }
  }

  /**
   * Handle a key down event from the keyboard. Pass the event to the registered keyboard handlers until one handles it.
   * @param event Keyboard event
   */
  handleKeyDown(event: GridKeyboardEvent): void {
    const keyHandlers = this.getKeyHandlers();
    for (let i = 0; i < keyHandlers.length; i += 1) {
      const keyHandler = keyHandlers[i];
      const result = keyHandler.onDown(event, this);
      if (result !== false) {
        const options = result as EventHandlerResultOptions;
        if (options?.stopPropagation ?? true) event.stopPropagation();
        if (options?.preventDefault ?? true) event.preventDefault();
        break;
      }
    }
  }

  /**
   * Notify all of the mouse handlers for this grid of a mouse event.
   * @param functionName The name of the function in the mouse handler to call
   * @param event The mouse event to notify
   * @param updateCoordinates Whether to update the mouse coordinates
   * @param addCursorToDocument Whether to add a cursor overlay or not (for dragging)
   */
  notifyMouseHandlers(
    functionName: GridMouseHandlerFunctionName,
    event: GridMouseEvent,
    updateCoordinates = true,
    addCursorToDocument = false
  ): void {
    const gridPoint = this.getGridPointFromEvent(event);
    const mouseHandlers = this.getMouseHandlers();
    let cursor = null;
    for (let i = 0; i < mouseHandlers.length; i += 1) {
      const mouseHandler = mouseHandlers[i];
      const result =
        mouseHandler[functionName] != null &&
        mouseHandler[functionName](gridPoint, this, event);
      if (result !== false) {
        if (mouseHandler.cursor != null) {
          ({ cursor } = mouseHandler);
          if (addCursorToDocument) {
            this.addDocumentCursor(cursor);
          }
        }

        // result is bool or object, events are stopped by default
        const options = result as EventHandlerResultOptions;
        if (options?.stopPropagation ?? true) event.stopPropagation();
        if (options?.preventDefault ?? true) event.preventDefault();
        break;
      }
    }

    this.setState({ cursor });

    if (updateCoordinates) {
      const { x, y } = gridPoint;
      this.setState({ mouseX: x, mouseY: y });
    }
  }

  handleMouseDown(event: React.MouseEvent): void {
    window.addEventListener('mousemove', this.handleMouseDrag, true);
    window.addEventListener('mouseup', this.handleMouseUp, true);

    if (event.button != null && event.button !== 0) {
      return;
    }

    this.notifyMouseHandlers('onDown', event);

    this.startDragTimer(event);
  }

  handleDoubleClick(event: React.MouseEvent): void {
    this.notifyMouseHandlers('onDoubleClick', event);
  }

  handleMouseMove(event: React.MouseEvent): void {
    this.notifyMouseHandlers('onMove', event);
  }

  handleMouseLeave(event: React.MouseEvent): void {
    this.notifyMouseHandlers('onLeave', event, false);
    this.setState({ mouseX: null, mouseY: null });
  }

  handleMouseDrag(event: MouseEvent): void {
    this.setState({ isDragging: true });
    this.notifyMouseHandlers('onDrag', event, true, true);

    this.stopDragTimer();
  }

  handleMouseUp(event: MouseEvent): void {
    window.removeEventListener('mousemove', this.handleMouseDrag, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);

    if (event.button != null && event.button !== 0) {
      return;
    }

    this.notifyMouseHandlers('onUp', event, false);

    this.stopDragTimer();

    this.removeDocumentCursor();
  }

  handleResize(): void {
    /**
     * We need to always redraw the canvas in the same frame as the updateCanvasScale
     * because it clears the canvas by nature of direct dom manipulation. However,
     * We also need to verify the state/metrics, which we currently have no way
     * of doing outside of a full componentDidUpdate() call, so we force the update.
     * Ideally, we could verify state/metrics without the forced update.
     */
    this.updateCanvasScale();
    this.updateCanvas();

    if (!this.metrics) throw new Error('metrics not set');

    this.forceUpdate();
  }

  handleWheel(event: WheelEvent): void {
    this.notifyMouseHandlers('onWheel', event);

    if (event.defaultPrevented) {
      return;
    }

    const { metricCalculator, metrics } = this;
    const metricState = this.getMetricState();

    if (!metrics) throw new Error('metrics not set');

    const {
      lastTop,
      lastLeft,
      columnCount,
      rowCount,
      scrollableContentWidth,
      scrollableViewportWidth,
      scrollableContentHeight,
      scrollableViewportHeight,
      hasHorizontalBar,
      hasVerticalBar,
    } = metrics;
    let { top, left, topOffset, leftOffset } = metrics;

    const theme = this.getTheme();

    let { deltaX, deltaY } = GridUtils.getScrollDelta(
      event,
      metrics.barWidth,
      metrics.barHeight,
      metrics.rowHeight,
      metrics.rowHeight
    );

    // iterate through each column to determine column width and figure out how far to scroll
    // get column width of next column to scroll to, and subract it from the remaining distance to travel
    while (hasHorizontalBar && deltaX !== 0) {
      leftOffset += deltaX;
      deltaX = 0;

      if (columnCount > 1) {
        // no scrolling needed, at directional edge
        if (
          (leftOffset > 0 && left >= lastLeft) ||
          (leftOffset < 0 && left <= 0)
        ) {
          leftOffset = 0;
          break;
        }
      } else {
        // single column at edge
        if (leftOffset <= 0) {
          leftOffset = 0;
          break;
        }

        const maxLeftOffset = scrollableContentWidth - scrollableViewportWidth;
        if (leftOffset >= maxLeftOffset) {
          leftOffset = maxLeftOffset;
          break;
        }
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
        } else if (theme.scrollSnapToColumn && columnCount > 1) {
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

        if (
          Math.abs(leftOffset) <= columnWidth &&
          theme.scrollSnapToColumn &&
          columnCount > 1
        ) {
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
    while (hasVerticalBar && deltaY !== 0) {
      topOffset += deltaY;
      deltaY = 0;

      if (rowCount > 1) {
        // no scrolling needed, at directional edge
        if ((topOffset > 0 && top >= lastTop) || (topOffset < 0 && top <= 0)) {
          topOffset = 0;
          break;
        }
      } else {
        // single row at edge
        if (topOffset <= 0) {
          topOffset = 0;
          break;
        }

        const maxTopOffset = scrollableContentHeight - scrollableViewportHeight;
        if (topOffset >= maxTopOffset) {
          topOffset = maxTopOffset;
          break;
        }
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
        } else if (theme.scrollSnapToRow && rowCount > 1) {
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

        if (
          Math.abs(topOffset) <= rowHeight &&
          theme.scrollSnapToRow &&
          rowCount > 1
        ) {
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

    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle cancelling the cell edit action
   */
  handleEditCellCancel(): void {
    this.setState({ editingCell: null });
    this.focus();
  }

  /**
   * Handle a change in the value in an editing cell
   * @param value New value set
   */
  handleEditCellChange(value: string): void {
    this.setState(({ editingCell }) => {
      try {
        assertIsDefined(editingCell);

        return {
          editingCell: { ...editingCell, value } as EditingCell,
        };
      } catch (e) {
        // This case should _never_ happen, since the editingCell shouldn't be null if this method is called
        const { onError } = this.props;
        onError(e instanceof Error ? e : new Error(`${e}`));
        return null;
      }
    });
  }

  /**
   * Commit an edit for the currently editing cell
   * @param value Value that was committed
   * @param options Options for committing
   */
  handleEditCellCommit(
    value: string,
    {
      direction = SELECTION_DIRECTION.DOWN,
      fillRange = false,
    }: { direction?: SELECTION_DIRECTION | null; fillRange?: boolean } = {}
  ): void {
    const { editingCell, selectedRanges } = this.state;
    if (!editingCell) throw new Error('editingCell not set');

    const { column, row } = editingCell;
    if (!this.isValidForCell(column, row, value)) {
      // Don't allow an invalid value to be commited, the editing cell should show an error
      if (direction === null) {
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

    if (direction !== null) {
      this.moveCursorInDirection(direction);
    }

    this.setState({ editingCell: null });

    this.focus();
  }

  renderInputField(): ReactNode {
    const { model } = this.props;
    const { editingCell } = this.state;
    const { metrics } = this;
    if (editingCell == null || metrics == null || !isEditableGridModel(model)) {
      return null;
    }
    const { selectionRange, value, isQuickEdit } = editingCell;
    const { column, row } = editingCell;
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

    // If the cell isn't visible, we still need to display an invisible cell for focus purposes
    const wrapperStyle: CSSProperties =
      x != null && y != null && w != null && h != null
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
    const inputStyle: CSSProperties | undefined =
      modelColumn != null && modelRow != null
        ? {
            textAlign: model.textAlignForCell(modelColumn, modelRow),
          }
        : undefined;
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

  render(): ReactNode {
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
          tabIndex={0}
        >
          Your browser does not support HTML canvas. Update your browser?
        </canvas>
        {this.renderInputField()}
      </>
    );
  }
}

export default Grid;
