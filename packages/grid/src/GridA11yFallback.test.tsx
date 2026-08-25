import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridA11yFallback, { type GridA11yViewport } from './GridA11yFallback';
import type GridMetrics from './GridMetrics';
import MockGridModel from './MockGridModel';

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 30;
const ROW_HEADER_WIDTH = 30;

const MODEL = new MockGridModel({ rowCount: 100, columnCount: 3 });
const SUMMARY = 'Grid with 100 rows and 3 columns.';
const VIEWPORT: GridA11yViewport = {
  top: 0,
  left: 0,
  topOffset: 0,
  leftOffset: 0,
};

/** Make metrics for a viewport laid out left to right and top to bottom */
function makeMetrics(): GridMetrics {
  const columns = [0, 1];
  const rows = [0, 1];
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
    allColumnWidths,
    allColumnXs,
    allRowHeights,
    allRowYs,
    modelColumns,
    modelRows,
    gridX: ROW_HEADER_WIDTH,
    gridY: HEADER_HEIGHT,
    columnHeaderHeight: HEADER_HEIGHT,
    topVisible: rows[0],
    bottomVisible: rows[rows.length - 1],
  } as unknown as GridMetrics;
}

function renderFallback({
  metrics = makeMetrics(),
  viewport = VIEWPORT,
}: { metrics?: GridMetrics | null; viewport?: GridA11yViewport } = {}) {
  return render(
    <GridA11yFallback
      model={MODEL}
      getMetrics={() => metrics}
      viewport={viewport}
    />
  );
}

async function describeContents() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: 'Describe the grid contents' })
  );
}

it('renders the summary without describing the contents', () => {
  renderFallback();

  expect(screen.getByText(SUMMARY)).toBeInTheDocument();
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

it('increments the revision each time the contents are described', async () => {
  const { container } = renderFallback();
  const fallback = container.firstElementChild;

  expect(fallback).toHaveAttribute('data-grid-a11y-revision', '0');

  await describeContents();
  expect(fallback).toHaveAttribute('data-grid-a11y-revision', '1');

  await describeContents();
  expect(fallback).toHaveAttribute('data-grid-a11y-revision', '2');
});

it('discards the snapshot once the grid scrolls away from it', async () => {
  const { rerender } = renderFallback();

  await describeContents();
  expect(screen.getByRole('table')).toBeInTheDocument();

  rerender(
    <GridA11yFallback
      model={MODEL}
      getMetrics={makeMetrics}
      viewport={{ ...VIEWPORT, top: 5 }}
    />
  );

  expect(screen.queryByRole('table')).toBeNull();
});

it('describes nothing when the grid has not drawn yet', async () => {
  renderFallback({ metrics: null });

  await describeContents();

  expect(screen.queryByRole('table')).toBeNull();
});
