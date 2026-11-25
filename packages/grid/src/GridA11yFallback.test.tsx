/* eslint class-methods-use-this: "off" */
import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridA11yFallback, { type GridDrawListener } from './GridA11yFallback';
import type GridMetrics from './GridMetrics';
import { type ModelIndex } from './GridMetrics';
import GridModel from './GridModel';
import { type GridRenderState } from './GridRendererTypes';
import MockGridModel from './MockGridModel';

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 30;
const ROW_HEADER_WIDTH = 30;

const MODEL = new MockGridModel({ rowCount: 100, columnCount: 3 });
const SUMMARY = 'Grid with 100 rows and 3 columns.';

/** Groups columns 1 and 2 under `A`, and all three under `All` */
class GroupedGridModel extends GridModel {
  get rowCount(): number {
    return 100;
  }

  get columnCount(): number {
    return 3;
  }

  get columnHeaderMaxDepth(): number {
    return 3;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return `${column},${row}`;
  }

  // Grouping falls back to comparing header text when the model declares no group objects
  textForColumnHeader(column: ModelIndex, depth = 0): string | undefined {
    if (depth === 2) {
      return 'All';
    }
    if (depth === 1) {
      return column === 0 ? undefined : 'A';
    }
    return `${column}`;
  }
}

/** Make metrics for a viewport laid out left to right and top to bottom */
function makeMetrics({
  columns = [0, 1],
  rows = [0, 1],
  columnHeaderMaxDepth = 1,
}: {
  columns?: number[];
  rows?: number[];
  columnHeaderMaxDepth?: number;
} = {}): GridMetrics {
  const allColumnWidths = new Map<number, number>();
  const allColumnXs = new Map<number, number>();
  const modelColumns = new Map<number, number>();
  columns.forEach((column, index) => {
    allColumnWidths.set(column, COLUMN_WIDTH);
    allColumnXs.set(column, index * COLUMN_WIDTH);
    modelColumns.set(column, column);
  });

  const allRowHeights = new Map<number, number>();
  const allRowYs = new Map<number, number>();
  const modelRows = new Map<number, number>();
  rows.forEach((row, index) => {
    allRowHeights.set(row, ROW_HEIGHT);
    allRowYs.set(row, index * ROW_HEIGHT);
    modelRows.set(row, row);
  });

  return {
    visibleColumns: columns,
    visibleRows: rows,
    floatingColumns: [],
    floatingRows: [],
    allColumnWidths,
    allColumnXs,
    allRowHeights,
    allRowYs,
    modelColumns,
    modelRows,
    gridX: ROW_HEADER_WIDTH,
    gridY: columnHeaderMaxDepth * HEADER_HEIGHT,
    columnHeaderHeight: HEADER_HEIGHT,
    columnHeaderMaxDepth,
    width: ROW_HEADER_WIDTH + 400,
    height: columnHeaderMaxDepth * HEADER_HEIGHT + 200,
    verticalBarWidth: 0,
    horizontalBarHeight: 0,
    floatingLeftWidth: 0,
    floatingRightWidth: 0,
    floatingTopHeight: 0,
    floatingBottomHeight: 0,
    topVisible: rows[0],
    bottomVisible: rows[rows.length - 1],
  } as unknown as GridMetrics;
}

function renderFallback({
  model = MODEL,
  metrics = makeMetrics(),
}: {
  model?: GridModel;
  metrics?: GridMetrics | null;
} = {}) {
  // The grid replays its most recent draw to each new listener, then notifies
  // them again on every draw after that
  let currentMetrics = metrics;
  const listeners = new Set<GridDrawListener>();
  const notifyListeners = () => {
    if (currentMetrics == null) {
      return;
    }
    const renderState = {
      model,
      metrics: currentMetrics,
      selectedRanges: [],
    } as unknown as GridRenderState;
    listeners.forEach(listener => listener(renderState));
  };
  const registerDrawListener = (listener: GridDrawListener) => {
    listeners.add(listener);
    notifyListeners();
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    ...render(<GridA11yFallback registerDrawListener={registerDrawListener} />),
    /** Draw the canvas again, as the grid does when it updates */
    draw: (nextMetrics = currentMetrics) => {
      currentMetrics = nextMetrics;
      act(notifyListeners);
    },
  };
}

async function describeContents() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Describe the grid contents' })
  );
}

async function hideContents() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Hide the grid contents' })
  );
}

it('describes nothing until the contents are requested', () => {
  renderFallback();

  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByRole('table')).toBeNull();
});

it('keeps the describe button out of the tab order', () => {
  renderFallback();

  expect(
    screen.getByRole('button', { name: 'Describe the grid contents' })
  ).toHaveAttribute('tabindex', '-1');
});

it('renders the snapshot as a table of headers and cells', async () => {
  renderFallback();

  await describeContents();

  const table = screen.getByRole('table');

  // The counts describe the whole grid, while the table only holds the viewport
  expect(table).toHaveAttribute('aria-rowcount', '101');
  expect(table).toHaveAttribute('aria-colcount', '3');

  expect(
    within(table)
      .getAllByRole('columnheader')
      .map(header => header.textContent)
  ).toEqual(['0', '1']);
  expect(within(table).getAllByRole('columnheader')[0]).toHaveAttribute(
    'scope',
    'col'
  );
});

it('locates each cell by its column, row, and position on screen', async () => {
  renderFallback();

  await describeContents();

  const cell = screen.getByText('1,0');
  expect(cell).toHaveAttribute('data-grid-column', '1');
  expect(cell).toHaveAttribute('data-grid-row', '0');
  expect(cell).toHaveAttribute('data-grid-rect', '130,30,100,20');
});

it('announces the description of the viewport', async () => {
  renderFallback();

  await describeContents();

  expect(screen.getByRole('status')).toHaveTextContent(
    `${SUMMARY} Showing rows 1 to 2, columns 0, 1.`
  );
});

it('describes the new contents each time the grid draws', async () => {
  const { draw } = renderFallback();

  await describeContents();
  expect(screen.getByText('0,0')).toBeInTheDocument();

  draw(makeMetrics({ rows: [2, 3] }));

  expect(screen.queryByText('0,0')).toBeNull();
  expect(screen.getByText('0,2')).toBeInTheDocument();
});

it('stops describing the contents when toggled off', async () => {
  renderFallback();

  await describeContents();
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Hide the grid contents' })
  ).toHaveAttribute('aria-pressed', 'true');

  await hideContents();
  expect(screen.queryByRole('table')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Describe the grid contents' })
  ).toHaveAttribute('aria-pressed', 'false');
});

it('describes nothing when the grid has not drawn yet', async () => {
  renderFallback({ metrics: null });

  await describeContents();

  expect(screen.queryByRole('table')).toBeNull();
});

it('numbers a single header row before the body rows', async () => {
  renderFallback();

  await describeContents();

  const rows = within(screen.getByRole('table')).getAllByRole('row');
  expect(rows.map(row => row.getAttribute('aria-rowindex'))).toEqual([
    '1',
    '2',
    '3',
  ]);
  expect(screen.getByText('0', { selector: 'th' })).toHaveAttribute(
    'data-grid-depth',
    '0'
  );
});

it('describes column header groups above the bottom level headers', async () => {
  renderFallback({
    model: new GroupedGridModel(),
    metrics: makeMetrics({ columns: [0, 1, 2], columnHeaderMaxDepth: 3 }),
  });

  await describeContents();

  const table = screen.getByRole('table');
  expect(table).toHaveAttribute('aria-rowcount', '103');

  const headerRows = within(table).getAllByRole('row').slice(0, 3);
  expect(headerRows.map(row => row.getAttribute('aria-rowindex'))).toEqual([
    '1',
    '2',
    '3',
  ]);
  // The bottom level headers stay last, as cells belong to them
  expect(
    within(headerRows[2])
      .getAllByRole('columnheader')
      .map(header => header.textContent)
  ).toEqual(['0', '1', '2']);

  const all = screen.getByText('All');
  expect(all).toHaveAttribute('scope', 'col');
  expect(all).toHaveAttribute('colspan', '3');
  expect(all).toHaveAttribute('data-grid-header-group', 'All');
  expect(all).toHaveAttribute('data-grid-depth', '2');
  expect(all).toHaveAttribute('data-grid-column', '0');
  expect(all).toHaveAttribute('data-grid-rect', '30,0,300,30');
  // Groups are not bottom level headers, so must not be mistaken for them
  expect(all).not.toHaveAttribute('data-grid-header');

  // Column 0 has no group at depth 1, so an empty cell keeps `A` over its columns
  const groupCells = headerRows[1].children;
  expect(groupCells).toHaveLength(2);
  expect(groupCells[0].tagName).toBe('TD');
  expect(groupCells[0]).toHaveAttribute('colspan', '1');
  expect(groupCells[1]).toHaveTextContent('A');
  expect(groupCells[1]).toHaveAttribute('colspan', '2');
  expect(groupCells[1]).toHaveAttribute('data-grid-rect', '130,30,200,30');

  expect(screen.getByText('0,0').closest('tr')).toHaveAttribute(
    'aria-rowindex',
    '4'
  );
});
