import { test, expect } from '@playwright/test';
import {
  waitForLoadingDone,
  gotoPage,
  pasteInMonaco,
  generateId,
} from './utils';

test.beforeEach(async ({ page }) => {
  await gotoPage(page, '');

  // Fail quickly if console errors are detected
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(msg.text());
    }
  });
  page.on('pageerror', error => {
    throw error;
  });
});

test('stuck to bottom scroll growing table', async ({ page }) => {
  // Need to generate a new shrink grow table for each test
  const id = generateId();
  const tableName = `_${id}_shrink_grow_table`;
  const growFunction = `func_${id}`;
  const consoleInput = page.locator('.console-input');

  await pasteInMonaco(
    consoleInput,
    `${tableName}, _, ${growFunction} = create_shrink_grow_table()`
  );
  await page.keyboard.press('Enter');
  await waitForLoadingDone(page);

  // Open the newly created table
  const openButton = page.getByRole('button', { name: tableName, exact: true });
  await openButton.click();
  await waitForLoadingDone(page);

  const gridCanvas = page.locator('.iris-grid .grid-wrapper');
  await gridCanvas.click({ position: { x: 10, y: 80 } });
  // Scroll to end of table to get stuck at bottom
  await page.mouse.wheel(0, 1000);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Add more rows to the table and take another screenshot
  await pasteInMonaco(consoleInput, `${growFunction}()`);
  await page.keyboard.press('Enter');

  // No reliable way to know when the added rows have loaded, so just wait
  await page.waitForTimeout(2000);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('stuck to bottom scroll shrinking and growing table', async ({ page }) => {
  // Need to generate a new shrink grow table for each test
  const id = generateId();
  const tableName = `_${id}_shrink_grow_table`;
  const growFunction = `grow_${id}`;
  const shrinkFunction = `shrink_${id}`;
  const consoleInput = page.locator('.console-input');

  await pasteInMonaco(
    consoleInput,
    `${tableName}, ${shrinkFunction}, ${growFunction} = create_shrink_grow_table()`
  );
  await page.keyboard.press('Enter');
  await waitForLoadingDone(page);

  // Open the newly created table
  const openButton = page.getByRole('button', { name: tableName, exact: true });
  await openButton.click();
  await waitForLoadingDone(page);

  const gridCanvas = page.locator('.iris-grid .grid-wrapper');
  await gridCanvas.click({ position: { x: 10, y: 80 } });
  // Scroll to end of table to get stuck at bottom
  await page.mouse.wheel(0, 1000);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Shrink the table and take another screenshot
  await pasteInMonaco(consoleInput, `${shrinkFunction}()`);
  await page.keyboard.press('Enter');

  // No reliable way to know when the removed rows have loaded, so just wait
  await page.waitForTimeout(2000);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Add more rows to the table and take another screenshot
  await pasteInMonaco(consoleInput, `${growFunction}()`);
  await page.keyboard.press('Enter');

  // No reliable way to know when the added rows have loaded, so just wait
  await page.waitForTimeout(2000);
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});
