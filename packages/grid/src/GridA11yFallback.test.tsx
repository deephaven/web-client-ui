import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridA11yFallback from './GridA11yFallback';
import type GridMetrics from './GridMetrics';
import MockGridModel from './MockGridModel';

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 30;
const ROW_HEADER_WIDTH = 30;

const MODEL = new MockGridModel({ rowCount: 100, columnCount: 3 });
const SUMMARY = 'Grid with 100 rows and 3 columns.';

/** Make metrics for a viewport laid out left to right and top to bottom */
function makeMetrics({
  columns = [0, 1],
  rows = [0, 1],
}: { columns?: number[]; rows?: number[] } = {}): GridMetrics {
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
  getMetrics = () => makeMetrics(),
  revision = 0,
}: {
  getMetrics?: () => GridMetrics | null;
  revision?: number;
} = {}) {
  const { rerender, ...rest } = render(
    <GridA11yFallback
      model={MODEL}
      getMetrics={getMetrics}
      revision={revision}
    />
  );

  return {
    ...rest,
    /** Rerender with the same metrics getter, as the grid does when it updates */
    rerender: (nextRevision: number) =>
      rerender(
        <GridA11yFallback
          model={MODEL}
          getMetrics={getMetrics}
          revision={nextRevision}
        />
      ),
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

it('exposes the revision of the most recent grid update', () => {
  const { container, rerender } = renderFallback();
  const fallback = container.firstElementChild;

  expect(fallback).toHaveAttribute('data-grid-a11y-revision', '0');

  rerender(1);
  expect(fallback).toHaveAttribute('data-grid-a11y-revision', '1');
});

it('describes the new contents each time the grid updates', async () => {
  let metrics = makeMetrics();
  const { rerender } = renderFallback({ getMetrics: () => metrics });

  await describeContents();
  expect(screen.getByText('0,0')).toBeInTheDocument();

  metrics = makeMetrics({ rows: [2, 3] });
  rerender(1);

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
  renderFallback({ getMetrics: () => null });

  await describeContents();

  expect(screen.queryByRole('table')).toBeNull();
});
