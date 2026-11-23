import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoPage, openTable, waitForLoadingDone } from './utils';

/**
 * Verifies the accessibility contract of the grid's canvas fallback content.
 * Uses raw locators rather than @deephaven/playwright-grid, since the helper
 * package is a consumer of the very contract these tests are pinning down.
 */

const ATTRIBUTES = {
  describe: 'data-grid-a11y-describe',
  snapshot: 'data-grid-a11y-snapshot',
  column: 'data-grid-column',
  row: 'data-grid-row',
  header: 'data-grid-header',
  headerGroup: 'data-grid-header-group',
  depth: 'data-grid-depth',
  rect: 'data-grid-rect',
};

type Rect = { x: number; y: number; width: number; height: number };

async function getRect(locator: Locator): Promise<Rect> {
  const value = await locator.getAttribute(ATTRIBUTES.rect);
  const [x, y, width, height] = (value ?? '').split(',').map(Number);
  if (![x, y, width, height].every(Number.isFinite)) {
    throw new Error(`Invalid ${ATTRIBUTES.rect} "${value}" on ${locator}`);
  }
  return { x, y, width, height };
}

function getCanvas(page: Page): Locator {
  return page.locator('.iris-grid-panel .iris-grid canvas.grid-canvas');
}

/** The fallback content is never painted, so the button cannot be clicked for real */
async function describeContents(canvas: Locator): Promise<Locator> {
  const button = canvas.locator(`button[${ATTRIBUTES.describe}]`);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveText('Describe the grid contents');
  await button.dispatchEvent('click');

  const snapshot = canvas.locator(`[${ATTRIBUTES.snapshot}]`);
  await expect(snapshot).toHaveCount(1);
  await expect(button).toHaveText('Hide the grid contents');
  return snapshot;
}

test.beforeEach(async ({ page }) => {
  await gotoPage(page, '');
});

test('describes nothing until the contents are requested', async ({ page }) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const canvas = getCanvas(page);
  await expect(canvas.locator(`[${ATTRIBUTES.snapshot}]`)).toHaveCount(0);
  await expect(canvas.locator('p')).toHaveCount(0);
});

test('offers a button to describe the grid contents, out of the tab order', async ({
  page,
}) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const button = getCanvas(page).locator(`button[${ATTRIBUTES.describe}]`);
  await expect(button).toHaveCount(1);
  await expect(button).toHaveText('Describe the grid contents');
  await expect(button).toHaveAttribute('tabindex', '-1');
});

test('describes the visible contents as an accessible table', async ({
  page,
}) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const canvas = getCanvas(page);
  await expect(canvas.locator(`[${ATTRIBUTES.snapshot}]`)).toHaveCount(0);

  const snapshot = await describeContents(canvas);

  const table = snapshot.locator('table');
  await expect(table).toHaveAttribute('aria-rowcount', '101');
  await expect(table).toHaveAttribute('aria-colcount', '3');

  // Column headers use native table semantics rather than ARIA roles
  await expect(table.locator('th')).toHaveText(['x', 'y', 'z']);
  await expect(table.locator('th').first()).toHaveAttribute('scope', 'col');

  // How many rows fit depends on the size of the window
  await expect(snapshot.locator('p[role="status"]')).toHaveText(
    /^Grid with 100 rows and 3 columns\. Showing rows 1 to \d+, columns x, y, z\.$/
  );
});

test('describes a grid with no rows', async ({ page }) => {
  await openTable(page, 'simple_table_empty');
  await waitForLoadingDone(page);

  const snapshot = await describeContents(getCanvas(page));

  const table = snapshot.locator('table');
  await expect(table).toHaveAttribute('aria-rowcount', '1');
  await expect(table).toHaveAttribute('aria-colcount', '3');

  // The columns still exist and are still on screen, there is just nothing in them
  await expect(table.locator('th')).toHaveText(['x', 'y', 'z']);
  await expect(table.locator('tbody tr')).toHaveCount(0);

  await expect(snapshot.locator('p[role="status"]')).toHaveText(
    'Grid with 0 rows and 3 columns. Showing no rows, columns x, y, z.'
  );
});

test('locates each cell by its column, row, and position on screen', async ({
  page,
}) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const snapshot = await describeContents(getCanvas(page));

  const firstColumn = snapshot.locator(
    `[${ATTRIBUTES.row}="0"][${ATTRIBUTES.column}="0"]`
  );
  await expect(firstColumn).toHaveText('0');
  await expect(firstColumn).toHaveAttribute(
    ATTRIBUTES.rect,
    /^\d+,\d+,\d+,\d+$/
  );

  // Rows are described in visible order, starting at the top of the viewport
  const rowIndexes = await snapshot
    .locator(`tbody tr td:first-child`)
    .evaluateAll(cells =>
      cells.map(cell => Number(cell.getAttribute('data-grid-row')))
    );
  expect(rowIndexes.length).toBeGreaterThan(0);
  expect(rowIndexes).toEqual(rowIndexes.map((_, i) => i));
});

test('reports the position of a cell relative to the canvas', async ({
  page,
}) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const canvas = getCanvas(page);
  const snapshot = await describeContents(canvas);

  const cell = snapshot.locator(
    `[${ATTRIBUTES.row}="0"][${ATTRIBUTES.column}="0"]`
  );
  const rect = (await cell.getAttribute(ATTRIBUTES.rect)) ?? '';
  const [x, y, width, height] = rect.split(',').map(Number);

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (box == null) return;

  // The cell must sit inside the canvas, below the column headers
  // x can be 0, as the grid has no row headers to offset it
  expect(x).toBeGreaterThanOrEqual(0);
  expect(y).toBeGreaterThan(0);
  expect(x + width).toBeLessThanOrEqual(box.width);
  expect(y + height).toBeLessThanOrEqual(box.height);
});

test('keeps the description in sync as the grid scrolls', async ({ page }) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const canvas = getCanvas(page);
  const snapshot = await describeContents(canvas);
  const status = snapshot.locator('p[role="status"]');
  await expect(status).toHaveText(/Showing rows 1 to \d+/);

  await page.locator('.iris-grid .grid-wrapper').hover();
  await page.mouse.wheel(0, 500);

  await expect
    .poll(async () => {
      const text = (await status.textContent()) ?? '';
      return Number(/Showing rows (\d+)/.exec(text)?.[1] ?? 0);
    })
    .toBeGreaterThan(1);
});

test('summarizes the current selection', async ({ page }) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const canvas = getCanvas(page);

  const snapshot = await describeContents(canvas);
  const status = snapshot.locator('p[role="status"]');
  const firstCell = snapshot.locator(
    `[${ATTRIBUTES.row}="0"][${ATTRIBUTES.column}="0"]`
  );
  const secondCell = snapshot.locator(
    `[${ATTRIBUTES.row}="2"][${ATTRIBUTES.column}="0"]`
  );
  const [first, second] = await Promise.all([
    firstCell.getAttribute(ATTRIBUTES.rect),
    secondCell.getAttribute(ATTRIBUTES.rect),
  ]);

  const toPosition = (rect: string | null) => {
    const [x, y, width, height] = (rect ?? '').split(',').map(Number);
    return { x: x + width / 2, y: y + height / 2 };
  };

  // Clicking a cell in a table selects the whole row
  await canvas.click({ position: toPosition(first) });
  await expect(status).toHaveText(
    /^Grid with 100 rows and 3 columns\. 1 row selected\. /
  );

  await canvas.click({
    position: toPosition(second),
    modifiers: ['ControlOrMeta'],
  });
  await expect(status).toHaveText(
    /^Grid with 100 rows and 3 columns\. 2 rows selected\. /
  );
});

test('leaves hidden columns out of the description', async ({ page }) => {
  await openTable(page, 'simple_table_header_group_hide');
  await waitForLoadingDone(page);

  const snapshot = await describeContents(getCanvas(page));

  // y and z are hidden by the layout hints, so they are not on screen to describe
  await expect(snapshot.locator(`[${ATTRIBUTES.header}]`)).toHaveText(['x']);
});

test('describes grouped column headers above the bottom level headers', async ({
  page,
}) => {
  await openTable(page, 'simple_table_header_group');
  await waitForLoadingDone(page);

  const snapshot = await describeContents(getCanvas(page));
  const table = snapshot.locator('table');

  // Cells belong to the bottom level headers, so those stay the only `data-grid-header` cells
  await expect(snapshot.locator(`[${ATTRIBUTES.header}]`)).toHaveText([
    'x',
    'y',
    'z',
  ]);
  await expect(table.locator('thead tr:last-child th')).toHaveText([
    'x',
    'y',
    'z',
  ]);
  await expect(table).toHaveAttribute('aria-rowcount', '103');

  const all = snapshot.locator(`[${ATTRIBUTES.headerGroup}="All"]`);
  const yAndZ = snapshot.locator(`[${ATTRIBUTES.headerGroup}="YandZ"]`);
  await expect(all).toHaveAttribute(ATTRIBUTES.depth, '2');
  await expect(all).toHaveAttribute('colspan', '3');
  await expect(yAndZ).toHaveAttribute(ATTRIBUTES.depth, '1');
  await expect(yAndZ).toHaveAttribute('colspan', '2');
  await expect(yAndZ).toHaveAttribute(ATTRIBUTES.column, '1');

  const [allRect, yAndZRect, x, y, z] = await Promise.all([
    getRect(all),
    getRect(yAndZ),
    getRect(snapshot.locator(`[${ATTRIBUTES.header}="x"]`)),
    getRect(snapshot.locator(`[${ATTRIBUTES.header}="y"]`)),
    getRect(snapshot.locator(`[${ATTRIBUTES.header}="z"]`)),
  ]);

  // Each header row sits directly above the next
  expect(allRect.y + allRect.height).toBe(yAndZRect.y);
  expect(yAndZRect.y + yAndZRect.height).toBe(y.y);

  // Groups span the headers of their children
  expect(yAndZRect.x).toBe(y.x);
  expect(yAndZRect.x + yAndZRect.width).toBe(z.x + z.width);
  expect(allRect.x).toBe(x.x);
  expect(allRect.x + allRect.width).toBeGreaterThanOrEqual(z.x + z.width);
});

test('leaves out groups whose columns are all hidden', async ({ page }) => {
  await openTable(page, 'simple_table_header_group_hide');
  await waitForLoadingDone(page);

  const snapshot = await describeContents(getCanvas(page));

  await expect(snapshot.locator(`[${ATTRIBUTES.headerGroup}]`)).toHaveText([
    'All',
  ]);
});

test('reports column headers where they are painted when the filter bar is shown', async ({
  page,
}) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  // Open the options first, in case the sidebar resizes the grid
  await page.locator('data-testid=btn-iris-grid-settings-button-table').click();
  const quickFiltersItem = page.locator('data-testid=menu-item-Quick Filters');
  await expect(quickFiltersItem).toBeVisible();

  const canvas = getCanvas(page);
  const snapshot = await describeContents(canvas);
  const header = snapshot.locator(`[${ATTRIBUTES.header}="x"]`);
  const cell = snapshot.locator(
    `[${ATTRIBUTES.row}="0"][${ATTRIBUTES.column}="0"]`
  );
  const [headerBefore, cellBefore] = await Promise.all([
    getRect(header),
    getRect(cell),
  ]);

  await quickFiltersItem.click();
  await expect(quickFiltersItem.locator('.btn.btn-switch.active')).toHaveCount(
    1
  );

  // The filter bar is drawn between the headers and the cells, pushing only the cells down
  let cellAfter = cellBefore;
  await expect
    .poll(async () => {
      cellAfter = await getRect(cell);
      return cellAfter.y;
    })
    .toBeGreaterThan(cellBefore.y);
  const headerAfter = await getRect(header);
  expect(headerAfter).toEqual(headerBefore);
  expect(headerAfter.y + headerAfter.height).toBeLessThan(cellAfter.y);
});
