import { expect, type Locator } from '@playwright/test';
import type { GridA11yAttributes, GridA11yRect } from '@deephaven/grid';

/**
 * Attributes on the grid's accessibility snapshot.
 * Declared here rather than imported so this package does not pull the grid
 * runtime into the test process. The `satisfies` check fails to compile if the
 * grid ever renames one.
 */
const ATTRIBUTES = {
  revision: 'data-grid-a11y-revision',
  describe: 'data-grid-a11y-describe',
  snapshot: 'data-grid-a11y-snapshot',
  column: 'data-grid-column',
  row: 'data-grid-row',
  header: 'data-grid-header',
  rect: 'data-grid-rect',
} as const satisfies GridA11yAttributes;

const CANVAS_SELECTOR = 'canvas.grid-canvas';

/** A column, either by visible index or by its column header text */
export type ColumnRef = number | string;

/** Click options passed through to Playwright, minus the position we compute */
export type GridClickOptions = Omit<
  NonNullable<Parameters<Locator['click']>[0]>,
  'position'
>;

/** The result of looking up a cell or column header in the grid */
type GridQueryResult = {
  /** The resolved visible column index, or null if the column could not be resolved */
  column: number | null;
  /** The bounds of the cell/header, or null if it is not in the viewport */
  rect: GridA11yRect | null;
  /** The text of the cell/header, or null if it is not in the viewport */
  text: string | null;
};

/**
 * Resolve the grid canvas from the provided locator.
 * Accepts either the canvas itself or any element containing it, so callers can
 * pass a panel/wrapper locator such as `.iris-grid`.
 * @param grid Locator for the grid canvas or an element containing it
 * @returns Locator for the grid canvas
 */
export async function resolveGridCanvas(grid: Locator): Promise<Locator> {
  const canvas = grid.locator(CANVAS_SELECTOR);
  return (await canvas.count()) > 0 ? canvas : grid;
}

/**
 * Escape a value for use in a CSS attribute selector.
 * @param value The value to escape
 * @returns The escaped value
 */
function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Parse the `x,y,width,height` of a rect attribute.
 * @param value The attribute value, or null if there was no attribute
 * @returns The rect, or null if there was nothing to parse
 */
function parseRect(value: string | null): GridA11yRect | null {
  if (value == null) {
    return null;
  }
  const [x, y, width, height] = value.split(',').map(Number);
  return { x, y, width, height };
}

/**
 * Turn the grid's accessibility snapshot on and wait for it to render.
 * The snapshot is off by default, and once on the grid keeps it in sync with
 * the viewport, so this only clicks when the snapshot is not already showing.
 * @param canvas Locator for the grid canvas
 * @returns Locator for the rendered snapshot
 */
async function showSnapshot(canvas: Locator): Promise<Locator> {
  const fallback = canvas.locator(`[${ATTRIBUTES.revision}]`);
  if ((await fallback.count()) === 0) {
    throw new Error(
      'No Deephaven grid found. Ensure the locator resolves to a grid canvas.'
    );
  }

  const snapshot = canvas.locator(`[${ATTRIBUTES.snapshot}]`);
  if ((await snapshot.count()) === 0) {
    // The button is canvas fallback content, so it is never painted and cannot be clicked
    await canvas.locator(`[${ATTRIBUTES.describe}]`).dispatchEvent('click');
    await expect.poll(async () => snapshot.count()).toBeGreaterThan(0);
  }

  return snapshot;
}

/**
 * Resolve a column reference to a visible column index.
 * @param snapshot Locator for the rendered snapshot
 * @param column Column to resolve, by visible index or header text
 * @returns The visible column index, or null if the header is not in the viewport
 */
async function resolveColumn(
  snapshot: Locator,
  column: ColumnRef
): Promise<number | null> {
  if (typeof column === 'number') {
    return column;
  }

  const header = snapshot.locator(
    `[${ATTRIBUTES.header}="${escapeAttributeValue(column)}"]`
  );
  if ((await header.count()) === 0) {
    return null;
  }
  const index = await header.first().getAttribute(ATTRIBUTES.column);
  return index == null ? null : Number(index);
}

/**
 * Build the error thrown when a query could not be resolved.
 * @param result The failed query result
 * @param column The requested column
 * @param description Description of what was being looked up
 * @returns The error to throw
 */
function makeQueryError(
  result: GridQueryResult,
  column: ColumnRef,
  description: string
): Error {
  if (result.column == null) {
    return new Error(
      `No column with header "${column}" is currently in the viewport.`
    );
  }
  return new Error(`${description} is not currently in the viewport.`);
}

/**
 * Look up the text and bounds of a cell.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column to look up, by visible index or header text
 * @param row Visible row index to look up
 * @returns The query result
 */
async function queryCell(
  grid: Locator,
  column: ColumnRef,
  row: number
): Promise<GridQueryResult> {
  const canvas = await resolveGridCanvas(grid);
  const snapshot = await showSnapshot(canvas);

  const columnIndex = await resolveColumn(snapshot, column);
  if (columnIndex == null) {
    return { column: null, rect: null, text: null };
  }

  const cell = snapshot.locator(
    `[${ATTRIBUTES.row}="${row}"][${ATTRIBUTES.column}="${columnIndex}"]`
  );
  if ((await cell.count()) === 0) {
    return { column: columnIndex, rect: null, text: null };
  }

  const [rect, text] = await Promise.all([
    cell.getAttribute(ATTRIBUTES.rect),
    cell.textContent(),
  ]);
  return { column: columnIndex, rect: parseRect(rect), text: text ?? '' };
}

/**
 * Look up the text and bounds of a column header.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column to look up, by visible index or header text
 * @returns The query result
 */
async function queryColumnHeader(
  grid: Locator,
  column: ColumnRef
): Promise<GridQueryResult> {
  const canvas = await resolveGridCanvas(grid);
  const snapshot = await showSnapshot(canvas);

  const columnIndex = await resolveColumn(snapshot, column);
  if (columnIndex == null) {
    return { column: null, rect: null, text: null };
  }

  const header = snapshot.locator(
    `[${ATTRIBUTES.header}][${ATTRIBUTES.column}="${columnIndex}"]`
  );
  if ((await header.count()) === 0) {
    return { column: columnIndex, rect: null, text: null };
  }

  const [rect, text] = await Promise.all([
    header.getAttribute(ATTRIBUTES.rect),
    header.getAttribute(ATTRIBUTES.header),
  ]);
  return { column: columnIndex, rect: parseRect(rect), text };
}

/**
 * Wait until the grid has rendered and its contents can be read.
 * @param grid Locator for the grid canvas or an element containing it
 */
export async function waitForGrid(grid: Locator): Promise<void> {
  const canvas = await resolveGridCanvas(grid);
  await expect
    .poll(async () => {
      const snapshot = await showSnapshot(canvas);
      return snapshot.locator(`[${ATTRIBUTES.row}]`).count();
    })
    .toBeGreaterThan(0);
}

/**
 * Get the grid's one line summary, e.g. for asserting the size or the selection.
 * @param grid Locator for the grid canvas or an element containing it
 * @returns The summary, e.g. `Grid with 100 rows and 3 columns. 2 cells selected.`
 */
export async function getGridSummary(grid: Locator): Promise<string> {
  const canvas = await resolveGridCanvas(grid);
  const summary = await canvas.locator('p').first().textContent();
  return summary ?? '';
}

/**
 * Get the text of every column header currently in the viewport, in visible order.
 * @param grid Locator for the grid canvas or an element containing it
 * @returns The visible column header names
 */
export async function getColumnHeaderNames(grid: Locator): Promise<string[]> {
  const canvas = await resolveGridCanvas(grid);
  const snapshot = await showSnapshot(canvas);
  const headers = await snapshot
    .locator(`[${ATTRIBUTES.header}]`)
    .evaluateAll(
      (elements, attribute) =>
        elements.map(element => element.getAttribute(attribute) ?? ''),
      ATTRIBUTES.header
    );
  return headers;
}

/**
 * Get the visible row indexes currently in the viewport.
 * @param grid Locator for the grid canvas or an element containing it
 * @returns The visible row indexes, in visible order
 */
export async function getVisibleRows(grid: Locator): Promise<number[]> {
  const canvas = await resolveGridCanvas(grid);
  const snapshot = await showSnapshot(canvas);
  const rows = await snapshot
    .locator(`tbody tr [${ATTRIBUTES.row}]:first-child`)
    .evaluateAll(
      (elements, attribute) =>
        elements.map(element => Number(element.getAttribute(attribute))),
      ATTRIBUTES.row
    );
  return rows;
}

/**
 * Get the text rendered in a cell.
 * Returns null when the grid has not rendered or the cell is not in the
 * viewport, so it can be polled while data loads.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column of the cell, by visible index or header text
 * @param row Visible row index of the cell
 * @returns The cell text, or null if it is not available
 */
export async function getCellText(
  grid: Locator,
  column: ColumnRef,
  row: number
): Promise<string | null> {
  const { text } = await queryCell(grid, column, row);
  return text;
}

/**
 * Get the bounds of a cell, relative to the top left of the grid canvas.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column of the cell, by visible index or header text
 * @param row Visible row index of the cell
 * @returns The bounds of the cell
 */
export async function getCellRect(
  grid: Locator,
  column: ColumnRef,
  row: number
): Promise<GridA11yRect> {
  const result = await queryCell(grid, column, row);
  if (result.rect == null) {
    throw makeQueryError(result, column, `Cell (${column}, ${row})`);
  }
  return result.rect;
}

/**
 * Get the centre of a cell in page coordinates, e.g. for `page.mouse` actions.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column of the cell, by visible index or header text
 * @param row Visible row index of the cell
 * @returns The page coordinates of the centre of the cell
 */
export async function getCellLocation(
  grid: Locator,
  column: ColumnRef,
  row: number
): Promise<{ x: number; y: number }> {
  const canvas = await resolveGridCanvas(grid);
  const rect = await getCellRect(canvas, column, row);
  const box = await canvas.boundingBox();
  if (box == null) {
    throw new Error('Grid canvas is not visible.');
  }
  return {
    x: box.x + rect.x + rect.width / 2,
    y: box.y + rect.y + rect.height / 2,
  };
}

/**
 * Click the centre of a cell.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column of the cell, by visible index or header text
 * @param row Visible row index of the cell
 * @param options Playwright click options, e.g. `{ modifiers: ['Shift'] }`
 */
export async function clickCell(
  grid: Locator,
  column: ColumnRef,
  row: number,
  options?: GridClickOptions
): Promise<void> {
  const canvas = await resolveGridCanvas(grid);
  const rect = await getCellRect(canvas, column, row);
  await canvas.click({
    ...options,
    position: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
  });
}

/**
 * Get the text of a column header.
 * Returns null when the grid has not rendered or the column is not in the
 * viewport, so it can be polled while data loads.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column to look up, by visible index or header text
 * @returns The column header text, or null if it is not available
 */
export async function getColumnHeaderText(
  grid: Locator,
  column: ColumnRef
): Promise<string | null> {
  const { text } = await queryColumnHeader(grid, column);
  return text;
}

/**
 * Click the centre of a column header.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column to click, by visible index or header text
 * @param options Playwright click options, e.g. `{ modifiers: ['Shift'] }` to add a sort
 */
export async function clickColumnHeader(
  grid: Locator,
  column: ColumnRef,
  options?: GridClickOptions
): Promise<void> {
  const canvas = await resolveGridCanvas(grid);
  const result = await queryColumnHeader(canvas, column);
  if (result.rect == null) {
    throw makeQueryError(result, column, `Column header "${column}"`);
  }
  const { rect } = result;
  await canvas.click({
    ...options,
    position: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
  });
}

/**
 * Assert the text rendered in a cell, retrying until it matches or times out.
 * @param grid Locator for the grid canvas or an element containing it
 * @param column Column of the cell, by visible index or header text
 * @param row Visible row index of the cell
 * @param expected The expected cell text
 */
export async function expectCellText(
  grid: Locator,
  column: ColumnRef,
  row: number,
  expected: string
): Promise<void> {
  const canvas = await resolveGridCanvas(grid);
  await expect
    .poll(() => getCellText(canvas, column, row), {
      message: `Expected cell (${column}, ${row}) to be "${expected}"`,
    })
    .toBe(expected);
}

/**
 * Assert the visible column headers, retrying until they match or time out.
 * @param grid Locator for the grid canvas or an element containing it
 * @param expected The expected column header names, in visible order
 */
export async function expectColumnHeaderNames(
  grid: Locator,
  expected: string[]
): Promise<void> {
  const canvas = await resolveGridCanvas(grid);
  await expect
    .poll(() => getColumnHeaderNames(canvas), {
      message: `Expected column headers to be ${JSON.stringify(expected)}`,
    })
    .toEqual(expected);
}
