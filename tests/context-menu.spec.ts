import { test, expect, Page } from '@playwright/test';
import {
  makeTableCommand,
  pasteInMonaco,
  TableTypes,
  waitForLoadingDone,
  generateVarName,
} from './utils';

test.describe.configure({ mode: 'serial' });

async function openAdvancedFilters(page: Page) {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });
  await page.getByRole('button', { name: 'Advanced Filters' }).click();
}

async function scrollUpIrisGrid(page: Page) {
  await page
    .locator('.iris-grid .grid-wrapper')
    .hover({ position: { x: 20, y: 20 } });
  await page.mouse.wheel(0, -100);
}

const tableName = generateVarName('t');
test.beforeEach(async ({ page }) => {
  await page.goto('');

  const consoleInput = page.locator('.console-input');

  const command = makeTableCommand(tableName, TableTypes.AllTypes);

  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');

  // Wait for the panel to show
  await expect(page.locator('.iris-grid-panel')).toHaveCount(1);

  // Wait until it's done loading
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );

  // Model is loaded, need to make sure table data is also loaded
  await waitForLoadingDone(page);

  const tableOperationsMenu = page.locator(
    'data-testid=btn-iris-grid-settings-button-table'
  );
  await tableOperationsMenu.click();

  // Wait for Table Options menu to show
  await expect(page.locator('.table-sidebar')).toHaveCount(1);
});

test.afterEach(async ({ page }) => {
  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const command = `del ${tableName}`;
  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');
});

test('toggle column visibility', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Hide Column' }).click();
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Show All Columns' }).click();
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('quick filter and clear', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Quick Filters' }).click();
  await page.keyboard.type('a999');

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Clear Column Filter' }).click();

  await page
    .locator('.iris-grid .grid-wrapper')
    .hover({ position: { x: 20, y: 20 } });
  await page.mouse.wheel(0, -100);

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('advanced filters', async ({ page }) => {
  await openAdvancedFilters(page);
  await page.getByLabel('Sort String Ascending').click();

  await page.getByRole('button', { name: 'Done' }).click();
  await waitForLoadingDone(page);
  await scrollUpIrisGrid(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await openAdvancedFilters(page);
  await page.getByLabel('Sort String Descending').click();

  await page.getByRole('button', { name: 'Done' }).click();
  await waitForLoadingDone(page);
  await scrollUpIrisGrid(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await openAdvancedFilters(page);
  await page.getByPlaceholder('Enter value').click();
  await page.keyboard.type('a999');

  await page.getByRole('button', { name: 'Done' }).click();
  await waitForLoadingDone(page);
  await scrollUpIrisGrid(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await openAdvancedFilters(page);
  await page.getByLabel('Remove Filter').click();

  await page.getByRole('button', { name: 'Done' }).click();
  await waitForLoadingDone(page);
  await scrollUpIrisGrid(page);

  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await openAdvancedFilters(page);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();

  await page.getByRole('button', { name: 'Done' }).click();
  await waitForLoadingDone(page);
  await scrollUpIrisGrid(page);

  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await openAdvancedFilters(page);
  await page.getByRole('button', { name: 'Select All' }).click();

  await page.getByRole('button', { name: 'Done' }).click();

  await waitForLoadingDone(page);
  await scrollUpIrisGrid(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('sort by', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Sort By' }).hover();

  await page.getByRole('button', { name: 'String Ascending' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Sort By' }).hover();
  await page.getByRole('button', { name: 'String Descending' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Sort By' }).hover();
  await page.getByRole('button', { name: 'Remove Sort' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('freeze column', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Freeze Column' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Unfreeze Column' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('reverse table', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 20 } });

  await page.getByRole('button', { name: 'Reverse Table' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('filter by value', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 60 } });

  await page.getByRole('button', { name: 'Filter by Value' }).hover();
  await page.getByRole('button', { name: 'text is exactly' }).click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 60 } });
  await page.getByRole('button', { name: 'Clear Column Filter' }).click();
});

test('go to', async ({ page }) => {
  await page
    .locator('.iris-grid .grid-wrapper')
    .click({ button: 'right', position: { x: 20, y: 60 } });

  await page.getByRole('button', { name: 'Go to' }).click();
  await page.getByLabel('filter-type-select').selectOption('Equals');

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page.getByTestId('decrement-go-to').click();
  await page.getByTestId('decrement-go-to').click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  await page.getByTestId('increment-go-to').click();

  await waitForLoadingDone(page);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('open custom context menu with another custom context menu open', async ({
  page,
}) => {
  await page.goto('');

  await page.getByText('Console').click({ button: 'right' });
  await expect(page.getByText('Close', { exact: true })).toHaveCount(1);

  await page
    .getByText('Command History')
    .click({ button: 'right', force: true });
  await expect(page.getByText('Close', { exact: true })).toHaveCount(1);

  await page.getByText('Console').click({ force: true });
});
