import { test, expect } from '@playwright/test';
import {
  clickCell,
  clickColumnHeader,
  expectCellText,
  expectColumnHeaderNames,
  getCellText,
  getColumnHeaderNames,
  getGridSummary,
  getVisibleRows,
  waitForGrid,
} from '@deephaven/playwright-grid';
import { gotoPage, openTable, waitForLoadingDone } from './utils';

/**
 * Content based versions of the table tests that would otherwise be pinned by a
 * screenshot. These read the grid through its accessibility snapshot, so a
 * failure points at the actual value that changed rather than at a pixel diff.
 */

const GRID = '.iris-grid-panel .iris-grid';

/** simple_table is `x=i`, so every value in a row is derived from the row index */
const DOUBLE_PATTERN = /^-?\d+\.\d+$/;

test.beforeEach(async ({ page }) => {
  await gotoPage(page, '');
});

test('can open a simple table', async ({ page }) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const grid = page.locator(GRID);
  await waitForGrid(grid);

  await expectColumnHeaderNames(grid, ['x', 'y', 'z']);

  // x=i, so the first rows are the row indexes themselves
  await expectCellText(grid, 'x', 0, '0');
  await expectCellText(grid, 'x', 1, '1');
  await expectCellText(grid, 'x', 2, '2');

  // y and z are sin/cos of the row index, formatted as doubles
  expect(await getCellText(grid, 'y', 1)).toMatch(DOUBLE_PATTERN);
  expect(await getCellText(grid, 'z', 1)).toMatch(DOUBLE_PATTERN);

  expect(await getGridSummary(grid)).toBe('Grid with 100 rows and 3 columns.');
});

test('can make a non-contiguous table row selection', async ({ page }) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const grid = page.locator(GRID);
  await waitForGrid(grid);

  // ctrl+click every other row for 5 rows, addressing cells by name instead of pixel offset
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 5; i += 1) {
    await clickCell(grid, 'x', i * 2, { modifiers: ['ControlOrMeta'] });
  }
  /* eslint-enable no-await-in-loop */

  expect(await getGridSummary(grid)).toBe(
    'Grid with 100 rows and 3 columns. 5 rows selected.'
  );
});

test('can open a table with column header groups', async ({ page }) => {
  await openTable(page, 'simple_table_header_group');
  await waitForLoadingDone(page);

  const grid = page.locator(GRID);
  await waitForGrid(grid);

  // Grouping changes the headers above the columns, not the columns themselves
  await expectColumnHeaderNames(grid, ['x', 'y', 'z']);
  await expectCellText(grid, 'x', 0, '0');
});

test('can open a table with column header groups and hidden columns', async ({
  page,
}) => {
  await openTable(page, 'simple_table_header_group_hide');
  await waitForLoadingDone(page);

  const grid = page.locator(GRID);
  await waitForGrid(grid);

  await expectColumnHeaderNames(grid, ['x']);
  await expectCellText(grid, 'x', 0, '0');
});

test('sorts a column by clicking its header', async ({ page }) => {
  await openTable(page, 'simple_table');
  await waitForLoadingDone(page);

  const grid = page.locator(GRID);
  await waitForGrid(grid);
  await expectCellText(grid, 'x', 0, '0');

  // One click sorts ascending, which x already is, so a second click reverses it
  await clickColumnHeader(grid, 'x');
  await waitForLoadingDone(page);
  await expectCellText(grid, 'x', 0, '0');

  await clickColumnHeader(grid, 'x');
  await waitForLoadingDone(page);
  await expectCellText(grid, 'x', 0, '99');
});

test.describe('scrolling', () => {
  test('shows later rows after scrolling down with the mouse', async ({
    page,
  }) => {
    await openTable(page, 'simple_table');
    await waitForLoadingDone(page);

    const grid = page.locator(GRID);
    await waitForGrid(grid);
    await expectCellText(grid, 'x', 0, '0');

    const before = await getVisibleRows(grid);
    expect(before[0]).toBe(0);

    await page.locator('.iris-grid .grid-wrapper').hover();
    await page.mouse.wheel(0, 500);
    await waitForLoadingDone(page);

    const after = await getVisibleRows(grid);
    expect(after[0]).toBeGreaterThan(0);

    // x=i, so each visible row must still show its own index
    const rows = after.slice(0, 5);
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < rows.length; i += 1) {
      await expectCellText(grid, 'x', rows[i], `${rows[i]}`);
    }
    /* eslint-enable no-await-in-loop */
  });

  test('shows the last row after scrolling to the end with the keyboard', async ({
    page,
  }) => {
    await openTable(page, 'simple_table');
    await waitForLoadingDone(page);

    const grid = page.locator(GRID);
    await waitForGrid(grid);

    await page.locator('.iris-grid .grid-wrapper').click({
      position: { x: 10, y: 80 },
    });
    await waitForLoadingDone(page);

    await page.keyboard.press('ControlOrMeta+ArrowDown');
    await waitForLoadingDone(page);

    // simple_table has 100 rows, so the last row is index 99
    await expectCellText(grid, 'x', 99, '99');
    expect(await getColumnHeaderNames(grid)).toEqual(['x', 'y', 'z']);

    await page.keyboard.press('ControlOrMeta+ArrowUp');
    await waitForLoadingDone(page);

    await expectCellText(grid, 'x', 0, '0');
  });

  test('keeps rows and columns aligned after paging down', async ({ page }) => {
    await openTable(page, 'simple_table');
    await waitForLoadingDone(page);

    const grid = page.locator(GRID);
    await waitForGrid(grid);

    await page.locator('.iris-grid .grid-wrapper').click({
      position: { x: 10, y: 80 },
    });
    await waitForLoadingDone(page);

    await page.keyboard.press('PageDown');
    await waitForLoadingDone(page);

    const rows = await getVisibleRows(grid);
    expect(rows[0]).toBeGreaterThan(0);

    // Headers must not shift when only the rows scroll
    await expectColumnHeaderNames(grid, ['x', 'y', 'z']);
    await expectCellText(grid, 'x', rows[0], `${rows[0]}`);
  });
});
