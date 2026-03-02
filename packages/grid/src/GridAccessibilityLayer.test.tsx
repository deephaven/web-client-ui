import React from 'react';
import { render, screen } from '@testing-library/react';
import GridAccessibilityLayer, {
  type GridAccessibilityLayerProps,
} from './GridAccessibilityLayer';
import type GridMetrics from './GridMetrics';
import MockGridModel from './MockGridModel';

function makeMockMetrics(
  overrides: Partial<GridMetrics> = {}
): GridMetrics | null {
  const allColumns = [0, 1, 2];
  const allRows = [0, 1, 2];

  return {
    gridX: 30,
    gridY: 20,
    allColumns,
    allRows,
    visibleColumns: allColumns,
    visibleRows: allRows,
    floatingColumns: [],
    floatingRows: [],
    allColumnXs: new Map([
      [0, 0],
      [1, 100],
      [2, 200],
    ]),
    allRowYs: new Map([
      [0, 0],
      [1, 20],
      [2, 40],
    ]),
    allColumnWidths: new Map([
      [0, 100],
      [1, 100],
      [2, 100],
    ]),
    allRowHeights: new Map([
      [0, 20],
      [1, 20],
      [2, 20],
    ]),
    modelColumns: new Map([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    modelRows: new Map([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    rowHeaderWidth: 30,
    columnHeaderHeight: 20,
    rowHeight: 20,
    columnWidth: 100,
    rowCount: 3,
    columnCount: 3,
    rowFooterWidth: 0,
    floatingTopRowCount: 0,
    floatingBottomRowCount: 0,
    floatingLeftColumnCount: 0,
    floatingRightColumnCount: 0,
    firstRow: 0,
    firstColumn: 0,
    treePaddingX: 0,
    treePaddingY: 0,
    left: 0,
    top: 0,
    bottom: 2,
    right: 2,
    topOffset: 0,
    leftOffset: 0,
    topVisible: 0,
    leftVisible: 0,
    bottomVisible: 2,
    rightVisible: 2,
    bottomViewport: 2,
    rightViewport: 2,
    width: 500,
    height: 500,
    maxX: 300,
    maxY: 60,
    lastLeft: 0,
    lastTop: 0,
    barHeight: 0,
    barTop: 0,
    barWidth: 0,
    barLeft: 0,
    handleHeight: 0,
    handleWidth: 0,
    hasHorizontalBar: false,
    hasVerticalBar: false,
    verticalBarWidth: 0,
    horizontalBarHeight: 0,
    scrollX: 0,
    scrollY: 0,
    scrollableContentWidth: 300,
    scrollableContentHeight: 60,
    scrollableViewportWidth: 500,
    scrollableViewportHeight: 500,
    visibleRowHeights: new Map([
      [0, 20],
      [1, 20],
      [2, 20],
    ]),
    visibleColumnWidths: new Map([
      [0, 100],
      [1, 100],
      [2, 100],
    ]),
    floatingTopHeight: 0,
    floatingBottomHeight: 0,
    floatingLeftWidth: 0,
    floatingRightWidth: 0,
    visibleRowYs: new Map([
      [0, 0],
      [1, 20],
      [2, 40],
    ]),
    visibleColumnXs: new Map([
      [0, 0],
      [1, 100],
      [2, 200],
    ]),
    visibleRowTreeBoxes: new Map(),
    movedRows: [],
    movedColumns: [],
    fontWidthsLower: new Map(),
    fontWidthsUpper: new Map(),
    userColumnWidths: new Map(),
    userRowHeights: new Map(),
    calculatedRowHeights: new Map(),
    calculatedColumnWidths: new Map(),
    contentColumnWidths: new Map(),
    contentRowHeights: new Map(),
    columnHeaderMaxDepth: 1,
    ...overrides,
  };
}

function renderAccessibilityLayer(
  propsOverrides: Partial<GridAccessibilityLayerProps> = {}
): ReturnType<typeof render> {
  const model = new MockGridModel({ rowCount: 3, columnCount: 3 });
  const metrics = makeMockMetrics();

  return render(
    <GridAccessibilityLayer
      metrics={metrics}
      model={model}
      {...propsOverrides}
    />
  );
}

describe('GridAccessibilityLayer', () => {
  it('renders nothing when metrics is null', () => {
    const { container } = renderAccessibilityLayer({ metrics: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders the accessibility layer container with grid role', () => {
    renderAccessibilityLayer();
    const layer = screen.getByTestId('grid-accessibility-layer');
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute('role', 'grid');
  });

  it('renders data cells with correct data-testid attributes', () => {
    renderAccessibilityLayer();

    // Check that cells exist for the 3x3 grid
    expect(screen.getByTestId('grid-cell-0-0')).toBeInTheDocument();
    expect(screen.getByTestId('grid-cell-1-1')).toBeInTheDocument();
    expect(screen.getByTestId('grid-cell-2-2')).toBeInTheDocument();
  });

  it('renders data cells with gridcell role and aria attributes', () => {
    renderAccessibilityLayer();

    const cell = screen.getByTestId('grid-cell-0-0');
    expect(cell).toHaveAttribute('role', 'gridcell');
    expect(cell).toHaveAttribute('aria-colindex', '1');
    expect(cell).toHaveAttribute('aria-rowindex', '1');
  });

  it('renders column headers with correct data-testid attributes', () => {
    renderAccessibilityLayer();

    expect(screen.getByTestId('grid-column-header-0-0')).toBeInTheDocument();
    expect(screen.getByTestId('grid-column-header-1-0')).toBeInTheDocument();
    expect(screen.getByTestId('grid-column-header-2-0')).toBeInTheDocument();
  });

  it('renders column headers with columnheader role', () => {
    renderAccessibilityLayer();

    const header = screen.getByTestId('grid-column-header-0-0');
    expect(header).toHaveAttribute('role', 'columnheader');
    expect(header).toHaveAttribute('aria-colindex', '1');
  });

  it('renders row headers when rowHeaderWidth is greater than 0', () => {
    renderAccessibilityLayer();

    expect(screen.getByTestId('grid-row-header-0')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-header-1')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-header-2')).toBeInTheDocument();
  });

  it('does not render row headers when rowHeaderWidth is 0', () => {
    const metrics = makeMockMetrics({ rowHeaderWidth: 0 });
    renderAccessibilityLayer({ metrics });

    expect(screen.queryByTestId('grid-row-header-0')).not.toBeInTheDocument();
  });

  it('renders row headers with rowheader role', () => {
    renderAccessibilityLayer();

    const header = screen.getByTestId('grid-row-header-0');
    expect(header).toHaveAttribute('role', 'rowheader');
    expect(header).toHaveAttribute('aria-rowindex', '1');
  });

  it('cells contain text from model.textForCell', () => {
    renderAccessibilityLayer();

    // MockGridModel returns text like "0,0" for cell at column 0, row 0
    const cell = screen.getByTestId('grid-cell-0-0');
    expect(cell.textContent).toBe('0,0');

    const cell11 = screen.getByTestId('grid-cell-1-1');
    expect(cell11.textContent).toBe('1,1');
  });

  it('cells are positioned correctly using metrics', () => {
    renderAccessibilityLayer();

    const cell = screen.getByTestId('grid-cell-0-0');
    // gridX = 30, allColumnXs[0] = 0, so left = 30
    // gridY = 20, allRowYs[0] = 0, so top = 20
    expect(cell).toHaveStyle({
      position: 'absolute',
      left: '30px',
      top: '20px',
      width: '100px',
      height: '20px',
    });
  });

  it('cells have pointer-events: none to allow clicks through to canvas', () => {
    renderAccessibilityLayer();

    const cell = screen.getByTestId('grid-cell-0-0');
    expect(cell).toHaveStyle({ pointerEvents: 'none' });
  });

  it('includes aria-rowcount and aria-colcount on the container', () => {
    renderAccessibilityLayer();

    const layer = screen.getByTestId('grid-accessibility-layer');
    expect(layer).toHaveAttribute('aria-rowcount', '3');
    expect(layer).toHaveAttribute('aria-colcount', '3');
  });

  it('follows WAI-ARIA grid pattern with rowgroups and rows', () => {
    renderAccessibilityLayer();

    const layer = screen.getByTestId('grid-accessibility-layer');

    // Should have rowgroup elements
    const rowGroups = layer.querySelectorAll('[role="rowgroup"]');
    expect(rowGroups.length).toBeGreaterThanOrEqual(1);

    // Should have row elements
    const rows = layer.querySelectorAll('[role="row"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('places data cells inside row elements', () => {
    renderAccessibilityLayer();

    const cell = screen.getByTestId('grid-cell-0-0');
    const parentRow = cell.closest('[role="row"]');
    expect(parentRow).not.toBeNull();
  });

  it('places column headers inside row elements', () => {
    renderAccessibilityLayer();

    const header = screen.getByTestId('grid-column-header-0-0');
    const parentRow = header.closest('[role="row"]');
    expect(parentRow).not.toBeNull();
  });

  it('places row headers inside row elements with data cells', () => {
    renderAccessibilityLayer();

    const rowHeader = screen.getByTestId('grid-row-header-0');
    const parentRow = rowHeader.closest('[role="row"]');
    expect(parentRow).not.toBeNull();

    // The row should also contain data cells
    const cellInSameRow = parentRow?.querySelector(
      '[data-testid="grid-cell-0-0"]'
    );
    expect(cellInSameRow).toBeInTheDocument();
  });

  it('adds aria-rowindex to row elements', () => {
    renderAccessibilityLayer();

    const rows = screen.getAllByRole('row');
    // Filter to data rows (those with aria-rowindex)
    const dataRows = rows.filter(row => row.hasAttribute('aria-rowindex'));
    expect(dataRows.length).toBe(3); // 3 data rows

    expect(dataRows[0]).toHaveAttribute('aria-rowindex', '1');
    expect(dataRows[1]).toHaveAttribute('aria-rowindex', '2');
    expect(dataRows[2]).toHaveAttribute('aria-rowindex', '3');
  });
});
