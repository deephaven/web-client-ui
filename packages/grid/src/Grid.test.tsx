import React, { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';
import Grid from './Grid';
import GridRange from './GridRange';
import GridRenderer from './GridRenderer';
import GridTheme, { GridTheme as GridThemeType } from './GridTheme';
import GridUtils from './GridUtils';
import MockGridModel from './MockGridModel';
import MockGridData from './MockGridData';
import { VisibleIndex } from './GridMetrics';
import GridModel from './GridModel';

function makeMockContext(): CanvasRenderingContext2D {
  // Just return a partial mock
  return {
    arc: jest.fn(),
    beginPath: jest.fn(),
    clip: jest.fn(),
    closePath: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fill: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    lineTo: jest.fn(),
    measureText: jest.fn(str => ({ width: str.length * 10 }) as TextMetrics),
    moveTo: jest.fn(),
    rect: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    stroke: jest.fn(),
    strokeRect: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    createPattern: jest.fn(),
  } as unknown as CanvasRenderingContext2D;
}

// We only use the '2d' mode of getContext. Defining the type in TS is tricky,
// so just use any here and call it a day.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
HTMLCanvasElement.prototype.getContext = jest.fn(makeMockContext) as any;

const defaultTheme = { ...GridTheme, autoSizeColumns: false } as GridThemeType;

const VIEW_SIZE = 5000;

const DEFAULT_PASTE_DATA = 'TEST_PASTE_DATA';

function makeMockCanvas() {
  return {
    clientWidth: VIEW_SIZE,
    clientHeight: VIEW_SIZE,
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
    offsetLeft: 0,
    offsetTop: 0,
    getContext: makeMockContext,
    parentElement: {
      getBoundingClientRect: () => ({
        width: VIEW_SIZE,
        height: VIEW_SIZE,
      }),
    },
    style: {},
    focus: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

function makeMockWrapper() {
  return {
    focus: jest.fn(),
    getBoundingClientRect: () => ({ width: VIEW_SIZE, height: VIEW_SIZE }),
  };
}

function createNodeMock(element: ReactElement) {
  if (element.type === 'canvas') {
    return makeMockCanvas();
  }
  if (element?.props?.className?.includes('grid-wrapper') === true) {
    return makeMockWrapper();
  }

  return null;
}

function makeGridComponent(
  model: GridModel = new MockGridModel(),
  theme: GridThemeType = defaultTheme
): Grid {
  const testRenderer = TestRenderer.create(
    <Grid model={model} theme={theme} />,
    {
      createNodeMock,
    }
  );
  return testRenderer.getInstance() as unknown as Grid;
}

function getClientX(
  columnIndex: VisibleIndex,
  theme: GridThemeType = defaultTheme
) {
  const { rowHeaderWidth, columnWidth } = theme;
  return rowHeaderWidth + columnWidth * columnIndex + 1;
}

function getClientY(
  rowIndex: VisibleIndex,
  theme: GridThemeType = defaultTheme
) {
  const { columnHeaderHeight, rowHeight } = theme;
  return columnHeaderHeight + rowHeight * rowIndex + 1;
}

function mouseEvent(
  column: VisibleIndex,
  row: VisibleIndex,
  fn: React.MouseEventHandler,
  type: string,
  extraArgs?: MouseEventInit,
  clientX = getClientX(column),
  clientY = getClientY(row)
) {
  const mouseArgs = { clientX, clientY, ...extraArgs };
  fn(new MouseEvent(type, mouseArgs) as unknown as React.MouseEvent);
}

function mouseDown(
  column: VisibleIndex,
  row: VisibleIndex,
  component: Grid,
  extraMouseArgs?: MouseEventInit,
  clientX?: number,
  clientY?: number
) {
  mouseEvent(
    column,
    row,
    component.handleMouseDown,
    'mousedown',
    extraMouseArgs,
    clientX,
    clientY
  );
}

function mouseMove(
  column: VisibleIndex,
  row: VisibleIndex,
  component: Grid,
  extraMouseArgs?: MouseEventInit,
  clientX?: number,
  clientY?: number
) {
  mouseEvent(
    column,
    row,
    component.handleMouseDrag as unknown as React.MouseEventHandler,
    'mousemove',
    extraMouseArgs,
    clientX,
    clientY
  );
}

function mouseUp(
  column: VisibleIndex,
  row: VisibleIndex,
  component: Grid,
  extraMouseArgs?: MouseEventInit,
  clientX?: number,
  clientY?: number
) {
  mouseEvent(
    column,
    row,
    component.handleMouseUp as unknown as React.MouseEventHandler,
    'mouseup',
    extraMouseArgs,
    clientX,
    clientY
  );
}

function mouseClick(
  column: VisibleIndex,
  row: VisibleIndex,
  component: Grid,
  extraMouseArgs?: MouseEventInit,
  clientX?: number,
  clientY?: number
) {
  mouseDown(column, row, component, extraMouseArgs, clientX, clientY);
  mouseUp(column, row, component, extraMouseArgs, clientX, clientY);
}

function mouseDoubleClick(
  column: VisibleIndex,
  row: VisibleIndex,
  component: Grid,
  extraMouseArgs?: MouseEventInit,
  clientX?: number,
  clientY?: number
) {
  mouseEvent(
    column,
    row,
    component.handleDoubleClick,
    'dblclick',
    extraMouseArgs,
    clientX,
    clientY
  );
}

function keyDown(key: string, component: Grid, extraArgs?: KeyboardEventInit) {
  const args = { key, ...extraArgs };
  component.handleKeyDown(
    new KeyboardEvent('keydown', args) as unknown as React.KeyboardEvent
  );
}

function arrowDown(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('ArrowDown', component, extraArgs);
}

function arrowUp(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('ArrowUp', component, extraArgs);
}

function arrowLeft(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('ArrowLeft', component, extraArgs);
}

function arrowRight(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('ArrowRight', component, extraArgs);
}

function pageUp(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('PageUp', component, extraArgs);
}

function pageDown(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('PageDown', component, extraArgs);
}

function home(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('Home', component, extraArgs);
}

function end(component: Grid, extraArgs?: KeyboardEventInit) {
  keyDown('End', component, extraArgs);
}

function paste(component: Grid, data = DEFAULT_PASTE_DATA) {
  component.pasteValue(data);
}

it('renders mock data model without crashing', () => {
  makeGridComponent(new MockGridModel());
});

it('handles mouse down in top left to update selection', () => {
  const component = makeGridComponent();

  mouseClick(0, 0, component);

  expect(component.state.cursorRow).toBe(0);
  expect(component.state.cursorColumn).toBe(0);
});

it('handles mouse down in middle of grid to update selection', () => {
  const component = makeGridComponent();
  mouseClick(3, 5, component);

  expect(component.state.cursorRow).toBe(5);
  expect(component.state.cursorColumn).toBe(3);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(3, 5, 3, 5));
});

it('handles mouse down in the very bottom right of last cell to update selection', () => {
  const model = new MockGridModel({ rowCount: 10, columnCount: 10 });
  const theme = defaultTheme;
  const { columnWidth, rowHeight } = theme;
  const component = makeGridComponent(model, theme);

  const column = 9;
  const row = 9;
  mouseClick(
    column,
    row,
    component,
    {},
    getClientX(column) + columnWidth - 1,
    getClientY(row) + rowHeight - 1
  );

  expect(component.state.cursorColumn).toBe(column);
  expect(component.state.cursorRow).toBe(row);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(column, row, column, row)
  );
});

it('clicking a selected cell should deselect it', () => {
  const component = makeGridComponent();

  mouseClick(3, 5, component);
  expect(component.state.selectedRanges.length).toBe(1);

  mouseClick(3, 5, component);

  expect(component.state.cursorRow).toBe(null);
  expect(component.state.cursorColumn).toBe(null);
  expect(component.state.selectedRanges.length).toBe(0);
});

it('ctrl clicking a selected cell should deselect it', () => {
  const component = makeGridComponent();

  mouseClick(3, 5, component);
  expect(component.state.selectedRanges.length).toBe(1);

  mouseClick(3, 5, component, { ctrlKey: true });

  expect(component.state.cursorRow).toBe(null);
  expect(component.state.cursorColumn).toBe(null);
  expect(component.state.selectedRanges.length).toBe(0);
});

it('handles mouse drag down to update selection', () => {
  const component = makeGridComponent();
  mouseDown(3, 5, component);

  mouseMove(8, 7, component);

  expect(component.state.selectionEndRow).toBe(7);
  expect(component.state.selectionEndColumn).toBe(8);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(3, 5, 8, 7));

  mouseMove(5, 6, component);

  expect(component.state.selectionEndRow).toBe(6);
  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(3, 5, 5, 6));
});

it('handles mouse drag from floating section to non-floating section to scroll and update selection', () => {
  const rowCount = 100000;
  const floatingBottomRowCount = 5;
  // After the first move event it should just scroll to where the mouse is, then if user keeps dragging it'll update
  const midDragRow = rowCount - floatingBottomRowCount - 1;
  const endRow = rowCount - 10;
  const lastRow = rowCount - 1;
  const model = new MockGridModel({ floatingBottomRowCount: 5, rowCount });
  const component = makeGridComponent(model);
  const { columnHeaderHeight } = defaultTheme;
  mouseDown(
    3,
    lastRow,
    component,
    {},
    getClientX(3),
    VIEW_SIZE - columnHeaderHeight - 1
  );
  mouseMove(8, 3, component);
  expect(component.state.selectionEndRow).toBe(midDragRow);
  expect(component.state.selectionEndColumn).toBe(8);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(3, midDragRow, 8, lastRow)
  );

  component.updateMetrics();

  mouseMove(
    5,
    endRow,
    component,
    {},
    getClientX(5),
    getClientY(endRow) -
      getClientY(component.state.top) +
      columnHeaderHeight +
      1
  );

  expect(component.state.selectionEndRow).toBe(endRow);
  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(3, endRow, 5, lastRow)
  );
});

it('handles mouse drag up to update selection', () => {
  const component = makeGridComponent();

  mouseDown(3, 5, component);

  mouseMove(1, 2, component);

  expect(component.state.selectionEndRow).toBe(2);
  expect(component.state.selectionEndColumn).toBe(1);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(1, 2, 3, 5));

  mouseMove(2, 3, component);

  expect(component.state.selectionEndRow).toBe(3);
  expect(component.state.selectionEndColumn).toBe(2);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(2, 3, 3, 5));
});

it('handles mouse shift click to extend selection', () => {
  const component = makeGridComponent();

  mouseClick(5, 5, component);

  mouseClick(8, 7, component, { shiftKey: true });

  expect(component.state.selectionEndRow).toBe(7);
  expect(component.state.selectionEndColumn).toBe(8);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 5, 8, 7));

  mouseClick(3, 2, component, { shiftKey: true });

  expect(component.state.selectionEndRow).toBe(2);
  expect(component.state.selectionEndColumn).toBe(3);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(3, 2, 5, 5));

  mouseClick(10, 12, component, { shiftKey: true });

  expect(component.state.selectionEndRow).toBe(12);
  expect(component.state.selectionEndColumn).toBe(10);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(5, 5, 10, 12)
  );
});

it('handles mouse ctrl click to add to selection', () => {
  const component = makeGridComponent();

  mouseClick(5, 5, component);

  mouseClick(8, 7, component, { ctrlKey: true });

  expect(component.state.cursorColumn).toBe(8);
  expect(component.state.cursorRow).toBe(7);
  expect(component.state.selectedRanges.length).toBe(2);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 5, 5, 5));
  expect(component.state.selectedRanges[1]).toEqual(new GridRange(8, 7, 8, 7));
});

it('deselects when ctrl clicking within a selected range', () => {
  const component = makeGridComponent();
  mouseDown(5, 5, component);
  mouseMove(10, 10, component);
  mouseUp(10, 10, component);

  mouseClick(8, 7, component, { ctrlKey: true });

  // Cursor should reset to the start range
  expect(component.state.cursorColumn).toBe(5);
  expect(component.state.cursorRow).toBe(5);
  expect(component.state.selectedRanges.length).toBe(4);
  expect(component.state.selectedRanges).toEqual([
    new GridRange(5, 5, 10, 6),
    new GridRange(5, 7, 7, 7),
    new GridRange(9, 7, 10, 7),
    new GridRange(5, 8, 10, 10),
  ]);
});

it('handles ctrl+shift click to extend range in both direcitons', () => {
  const component = makeGridComponent();

  mouseClick(5, 5, component);

  mouseClick(8, 7, component, { ctrlKey: true, shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(8);
  expect(component.state.selectionEndRow).toBe(7);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 5, 8, 7));

  mouseClick(2, 3, component, { ctrlKey: true, shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(2);
  expect(component.state.selectionEndRow).toBe(3);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(2, 3, 8, 7));

  mouseClick(10, 12, component, { ctrlKey: true, shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(10);
  expect(component.state.selectionEndRow).toBe(12);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(2, 3, 10, 12)
  );
});

it('handles double clicking a cell to edit', async () => {
  const model = new MockGridModel({ isEditable: true });
  const component = makeGridComponent(model);
  const column = 5;
  const row = 7;
  const value = 'TEST';

  expect(component.state.editingCell).toBeNull();

  mouseDoubleClick(column, row, component);

  expect(component.state.cursorColumn).toBe(column);
  expect(component.state.cursorRow).toBe(row);
  expect(component.state.editingCell).not.toBeNull();
  expect(component.state.editingCell?.column).toBe(column);
  expect(component.state.editingCell?.row).toBe(row);

  component.handleEditCellCommit(value);

  expect(model.textForCell(column, row)).toBe(value);

  // Cursor should have moved down by one after committing the value
  expect(component.state.cursorColumn).toBe(column);
  expect(component.state.cursorRow).toBe(row + 1);
});

it('handles keyboard arrow to update selection with no previous selection', () => {
  const component = makeGridComponent();

  arrowDown(component);

  expect(component.state.cursorRow).toBe(0);
  expect(component.state.cursorColumn).toBe(0);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(0, 0, 0, 0));
});

it('handles keyboard arrow to move selection down/right', () => {
  const component = makeGridComponent();

  arrowDown(component);
  arrowDown(component);
  arrowDown(component);
  arrowRight(component);

  expect(component.state.cursorColumn).toBe(1);
  expect(component.state.cursorRow).toBe(2);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(1, 2, 1, 2));
});

it('handles keyboard arrow to extend selection down/up', () => {
  const component = makeGridComponent();

  mouseClick(5, 5, component);

  arrowDown(component, { shiftKey: true });
  arrowDown(component, { shiftKey: true });
  arrowRight(component, { shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(6);
  expect(component.state.selectionEndRow).toBe(7);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 5, 6, 7));

  arrowUp(component, { shiftKey: true });
  arrowUp(component, { shiftKey: true });
  arrowUp(component, { shiftKey: true });
  arrowUp(component, { shiftKey: true });
  arrowLeft(component, { shiftKey: true });
  arrowLeft(component, { shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(4);
  expect(component.state.selectionEndRow).toBe(3);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(4, 3, 5, 5));
});

it('handles keyboard pageDown to move cursor and/or selection down', () => {
  const model = new MockGridModel({ rowCount: 800, columnCount: 10 });
  const component = makeGridComponent(model);

  // Try moving the selected row one page down.
  // Click on row 4, hit the pageDown key.
  mouseClick(1, 4, component);
  pageDown(component);
  expect(component.state.selectionEndRow).toBe(252);
  expect(component.state.cursorRow).toBe(252);

  // Try selecting a range with shift+pageDown
  pageDown(component, { shiftKey: true });
  expect(component.state.selectionStartRow).toBe(252);
  expect(component.state.selectionEndRow).toBe(500);

  // Try increasing the selection with another shift+pageDown.
  pageDown(component, { shiftKey: true });
  expect(component.state.selectionStartRow).toBe(252);
  expect(component.state.selectionEndRow).toBe(748);

  // Try changing the selected row with an arrow key.
  arrowUp(component);
  expect(component.state.selectionStartRow).toBe(251);
  expect(component.state.selectionEndRow).toBe(251);
  expect(component.state.cursorRow).toBe(251);

  // Move another 3 pages down. Try selecting beyond the table row limit.
  pageDown(component, { shiftKey: true });
  pageDown(component, { shiftKey: true });
  pageDown(component, { shiftKey: true });
  expect(component.state.selectionStartRow).toBe(251);
  expect(component.state.selectionEndRow).toBe(799);
});

it('handles keyboard pageUp to move cursor and/or selection up', () => {
  const model = new MockGridModel({ rowCount: 800, columnCount: 10 });
  const component = makeGridComponent(model);

  // Setup - start at the bottom of the table.
  mouseClick(1, 245, component);
  pageDown(component);
  pageDown(component);
  pageDown(component);

  // Try moving the selected row one page up.
  pageUp(component);
  expect(component.state.selectionEndRow).toBe(551);
  expect(component.state.cursorRow).toBe(551);

  // Try selecting a range with shift+pageUp
  pageUp(component, { shiftKey: true });
  expect(component.state.selectionStartRow).toBe(551);
  expect(component.state.selectionEndRow).toBe(303);

  // Try increasing the selection with another shift+pageUp.
  pageUp(component, { shiftKey: true });
  expect(component.state.selectionStartRow).toBe(551);
  expect(component.state.selectionEndRow).toBe(55);

  // Try changing the selected row with an arrow key.
  arrowDown(component);
  expect(component.state.selectionStartRow).toBe(552);
  expect(component.state.selectionEndRow).toBe(552);
  expect(component.state.cursorRow).toBe(552);

  // Move another page up. Try selecting beyond the first table row.
  pageUp(component, { shiftKey: true });
  pageUp(component, { shiftKey: true });
  pageUp(component, { shiftKey: true });
  expect(component.state.selectionStartRow).toBe(552);
  expect(component.state.selectionEndRow).toBe(0);
});

it('handles ctrl+shift keyboard arrows to extend selection to beginning/end', () => {
  const model = new MockGridModel();
  const { columnCount, rowCount } = model;
  const component = makeGridComponent(model);

  mouseClick(5, 5, component);

  arrowUp(component, { shiftKey: true, ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(0);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 0, 5, 5));

  arrowDown(component, { shiftKey: true, ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(rowCount - 1);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(5, 0, 5, rowCount - 1)
  );

  arrowRight(component, { shiftKey: true, ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(columnCount - 1);
  expect(component.state.selectionEndRow).toBe(rowCount - 1);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(5, 0, columnCount - 1, rowCount - 1)
  );
});

it('handles Home/End to go to beginning/end column', () => {
  const model = new MockGridModel();
  const { columnCount } = model;
  const component = makeGridComponent(model);

  mouseClick(5, 5, component);

  home(component);

  expect(component.state.selectionEndColumn).toBe(0);
  expect(component.state.selectionEndRow).toBe(5);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(0, 5, 0, 5));

  end(component);

  expect(component.state.selectionEndColumn).toBe(columnCount - 1);
  expect(component.state.selectionEndRow).toBe(5);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(columnCount - 1, 5, columnCount - 1, 5)
  );
});

it('handles Shift+Home/End to extend selection to beginning/end column', () => {
  const model = new MockGridModel();
  const { columnCount, rowCount } = model;
  const component = makeGridComponent(model);

  mouseClick(5, 5, component);

  home(component, { shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(0);
  expect(component.state.selectionEndRow).toBe(5);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(0, 5, 5, 5));

  end(component, { shiftKey: true });

  expect(component.state.selectionEndColumn).toBe(columnCount - 1);
  expect(component.state.selectionEndRow).toBe(5);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(0, 5, columnCount - 1, 5)
  );

  end(component, { shiftKey: true, ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(rowCount - 1);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(0, 5, columnCount - 1, rowCount - 1)
  );
});

it('handles Ctrl+Home/End to go to beginning/end row', () => {
  const model = new MockGridModel();
  const { rowCount } = model;
  const component = makeGridComponent(model);

  mouseClick(5, 5, component);

  home(component, { ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(0);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 0, 5, 0));

  end(component, { ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(rowCount - 1);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(5, rowCount - 1, 5, rowCount - 1)
  );
});

it('handles Ctrl+Shift+Home/End to go to beginning/end row and extend selection', () => {
  const model = new MockGridModel();
  const { rowCount } = model;
  const component = makeGridComponent(model);

  mouseClick(5, 5, component);

  home(component, { shiftKey: true, ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(0);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(new GridRange(5, 0, 5, 5));

  end(component, { shiftKey: true, ctrlKey: true });

  expect(component.state.selectionEndColumn).toBe(5);
  expect(component.state.selectionEndRow).toBe(rowCount - 1);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(5, 0, 5, rowCount - 1)
  );
});

it('handles escape to clear current ranges', () => {
  const component = makeGridComponent();

  arrowDown(component);

  expect(component.state.selectedRanges.length).toBe(1);

  keyDown('Escape', component);

  expect(component.state.selectedRanges.length).toBe(0);
});

it('selects all with ctrl+a', () => {
  const model = new MockGridModel();
  const { columnCount, rowCount } = model;
  const component = makeGridComponent(model);

  keyDown('a', component, { ctrlKey: true });

  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(0, 0, columnCount - 1, rowCount - 1)
  );
});

it('auto selects the row with the autoselect row option set', () => {
  const model = new MockGridModel();
  const theme = { ...defaultTheme, autoSelectRow: true };
  const component = makeGridComponent(model, theme);

  arrowDown(component);

  expect(component.state.cursorColumn).toBe(0);
  expect(component.state.cursorRow).toBe(0);
  expect(component.state.selectedRanges.length).toBe(1);
  expect(component.state.selectedRanges[0]).toEqual(
    new GridRange(null, 0, null, 0)
  );
});

describe('mac specific shortcut tests', () => {
  const { isMacPlatform } = GridUtils;

  beforeAll(() => {
    GridUtils.isMacPlatform = jest.fn(() => true);
  });

  afterAll(() => {
    GridUtils.isMacPlatform = isMacPlatform;
  });

  it('handles mouse meta click to add to selection', () => {
    const component = makeGridComponent();

    mouseClick(5, 5, component);

    mouseClick(8, 7, component, { metaKey: true });

    expect(component.state.cursorColumn).toBe(8);
    expect(component.state.cursorRow).toBe(7);
    expect(component.state.selectedRanges.length).toBe(2);
    expect(component.state.selectedRanges[0]).toEqual(
      new GridRange(5, 5, 5, 5)
    );
    expect(component.state.selectedRanges[1]).toEqual(
      new GridRange(8, 7, 8, 7)
    );
  });
});

describe('truncate to width', () => {
  const context = makeMockContext();

  function expectTruncate(
    str: string,
    expectedResult: string,
    width = 100,
    fontWidth = 10
  ) {
    expect(GridRenderer.truncateToWidth(context, str, width, fontWidth)).toBe(
      expectedResult
    );
  }

  it('handles the empty string', () => {
    expectTruncate('', '');
  });

  it('handles zero width', () => {
    expectTruncate('TEST', '', 0);
  });

  it('returns str if not truncated', () => {
    expectTruncate('TEST', 'TEST');
  });

  it('returns truncated string if truncated', () => {
    expectTruncate('TEST_TEST_TEST', 'TEST_TEST…');
  });

  it('handles long strings', () => {
    expectTruncate(MockGridData.LOREM_IPSUM, 'Lorem ips…');
    expectTruncate(MockGridData.JSON, '{"command…');
  });

  it('handles narrow width', () => {
    expectTruncate(MockGridData.LOREM_IPSUM, 'L…', 20);
    expectTruncate(MockGridData.LOREM_IPSUM, '…', 10);
    expectTruncate(MockGridData.LOREM_IPSUM, '…', 5);
  });
});

describe('paste tests', () => {
  describe('non-editable', () => {
    it('does nothing if table is not editable', () => {
      const model = new MockGridModel();
      model.setValues = jest.fn();

      const component = makeGridComponent(model);
      paste(component);
      expect(model.setValues).not.toHaveBeenCalled();
    });
  });

  describe('editable', () => {
    let model: MockGridModel;
    let component: Grid;

    beforeEach(() => {
      model = new MockGridModel({ isEditable: true });
      model.setValues = jest.fn();

      component = makeGridComponent(model);
    });

    it('does nothing if no selection', () => {
      paste(component);
      expect(model.setValues).not.toHaveBeenCalled();
    });

    it('modifies a single cell if only one selection', () => {
      mouseClick(5, 7, component);
      paste(component);
      expect(model.setValues).toHaveBeenCalledTimes(1);
      expect(model.setValues).toHaveBeenCalledWith([
        expect.objectContaining({
          column: 5,
          row: 7,
          text: DEFAULT_PASTE_DATA,
        }),
      ]);
    });

    it('does the whole selected range', () => {
      mouseClick(5, 7, component);
      mouseClick(3, 2, component, { shiftKey: true });
      paste(component);
      expect(model.setValues).toHaveBeenCalledTimes(1);
    });
  });
});
