import { test, expect, type Page } from '@playwright/test';
import { gotoPage, openTable } from './utils';

async function waitForLoadingDone(page: Page) {
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);
}

test.describe('grid accessibility layer', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');
    await openTable(page, 'simple_table');
    await waitForLoadingDone(page);
  });

  test('renders accessibility layer container', async ({ page }) => {
    const accessibilityLayer = page.getByTestId('grid-accessibility-layer');
    await expect(accessibilityLayer).toBeVisible();
    await expect(accessibilityLayer).toHaveAttribute('role', 'grid');
  });

  test('renders data cells with correct test ids', async ({ page }) => {
    // Check that data cells are rendered with expected test IDs
    const cell00 = page.getByTestId('grid-cell-0-0');
    const cell10 = page.getByTestId('grid-cell-1-0');
    const cell01 = page.getByTestId('grid-cell-0-1');

    await expect(cell00).toBeAttached();
    await expect(cell10).toBeAttached();
    await expect(cell01).toBeAttached();
  });

  test('data cells have correct ARIA attributes', async ({ page }) => {
    const cell = page.getByTestId('grid-cell-0-0');

    await expect(cell).toHaveAttribute('role', 'gridcell');
    await expect(cell).toHaveAttribute('aria-colindex', '1');
    await expect(cell).toHaveAttribute('aria-rowindex', '1');
  });

  test('renders column headers with correct test ids', async ({ page }) => {
    // Column headers at depth 0
    const header0 = page.getByTestId('grid-column-header-0-0');
    const header1 = page.getByTestId('grid-column-header-1-0');

    await expect(header0).toBeAttached();
    await expect(header1).toBeAttached();
  });

  test('column headers have correct ARIA attributes', async ({ page }) => {
    const header = page.getByTestId('grid-column-header-0-0');

    await expect(header).toHaveAttribute('role', 'columnheader');
    await expect(header).toHaveAttribute('aria-colindex', '1');
  });

  test('column headers contain column names', async ({ page }) => {
    // simple_table has columns x and y
    const headerX = page.getByTestId('grid-column-header-0-0');
    const headerY = page.getByTestId('grid-column-header-1-0');

    await expect(headerX).toContainText('x');
    await expect(headerY).toContainText('y');
  });

  test('data cells contain cell values', async ({ page }) => {
    // First row should contain values from the simple_table
    const cell00 = page.getByTestId('grid-cell-0-0');

    // The cell should have some numeric content (from simple_table)
    const text = await cell00.textContent();
    expect(text).toBeTruthy();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('can find cells by text content', async ({ page }) => {
    // Find a cell containing a specific value
    // simple_table contains sin/cos values, look for column header
    const xHeader = page.locator('[data-testid^="grid-column-header"]', {
      hasText: 'x',
    });

    await expect(xHeader).toBeAttached();
  });

  test('accessibility layer does not block canvas interactions', async ({
    page,
  }) => {
    const grid = page.locator('.iris-grid-panel .iris-grid');
    const canvas = grid.locator('canvas.grid-canvas');

    // Click on the grid - should select a cell
    await grid.click({ position: { x: 50, y: 50 } });

    // The canvas should receive focus, not blocked by the accessibility layer
    // The accessibility layer has pointer-events: none
    await expect(canvas).toBeFocused();
  });

  test('row headers are rendered when rowHeaderWidth is greater than 0', async ({
    page,
  }) => {
    // Note: simple_table has rowHeaderWidth = 0, so row headers are not rendered
    // This test verifies the condition - row headers only appear when rowHeaderWidth > 0
    const rowHeader0 = page.getByTestId('grid-row-header-0');

    // In simple_table, row headers should NOT be present since rowHeaderWidth is 0
    await expect(rowHeader0).not.toBeAttached();
  });

  test('can click on third row cell using accessibility layer position', async ({
    page,
  }) => {
    // Get the cell in the third row (row index 2, zero-based)
    const thirdRowCell = page.getByTestId('grid-cell-0-2');
    await expect(thirdRowCell).toBeAttached();

    // Get the bounding box of the accessibility element to find its position
    const boundingBox = await thirdRowCell.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox === null) return;

    // Click at the center of the cell position on the canvas
    await page.mouse.click(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );

    // Take a screenshot to verify the third row is selected
    await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot(
      'third-row-cell-selected.png'
    );
  });
});

test.describe('grid accessibility layer with column groups', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');
    await openTable(page, 'simple_table_header_group');
  });

  test('renders column headers at multiple depths', async ({ page }) => {
    // Depth 0 - base column headers
    const headerDepth0 = page.getByTestId('grid-column-header-0-0');
    await expect(headerDepth0).toBeAttached();

    // Depth 1 - column group headers (if table has groups)
    const headerDepth1 = page.getByTestId('grid-column-header-0-1');
    await expect(headerDepth1).toBeAttached();
  });
});
