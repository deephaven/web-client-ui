import { test, expect, type Page } from '@playwright/test';
import {
  waitForLoadingDone,
  openTableOption,
  openTable,
  gotoPage,
} from './utils';

// Scroll the table by scrolling the mouse wheel, whilst moving the mouse up and down to test hovering functionality
async function scrollTableWhileMovingMouse(page: Page) {
  const gridCanvas = page.locator('.iris-grid .grid-wrapper');
  const box = await gridCanvas.boundingBox();
  if (!box) throw new Error('No bounding box found for grid canvas');

  let mouseY = box.y + 120;
  const mouseX = box.x + 20;
  const mouseStep = 40;

  const scrollDeltas = [
    1000, -600, 1600, -1200, 2000, -2000, 1000, -400, 1400, -1000,
  ];

  for (let i = 0; i < scrollDeltas.length; i += 1) {
    mouseY += i % 2 === 0 ? -mouseStep : mouseStep;
    // eslint-disable-next-line no-await-in-loop
    await page.mouse.move(mouseX, mouseY);

    let remaining = Math.abs(scrollDeltas[i]);
    const direction = Math.sign(scrollDeltas[i]);
    const scrollStep = 100;

    while (remaining > 0) {
      const step = Math.min(scrollStep, remaining);
      // eslint-disable-next-line no-await-in-loop
      await page.mouse.wheel(0, step * direction);
      remaining -= step;
    }
  }
}

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

test('scroll with keyboard shortcuts', async ({ page }) => {
  // Use simple_table for its scrollable number of rows
  await openTable(page, 'simple_table');

  const gridCanvas = page.locator('.iris-grid .grid-wrapper');
  await gridCanvas.click({ position: { x: 10, y: 80 } });
  await waitForLoadingDone(page);

  // Down
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Up
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Page Down
  await page.keyboard.press('PageDown');
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Page Up
  await page.keyboard.press('PageUp');
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // End
  await page.keyboard.press('ControlOrMeta+ArrowDown');
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();

  // Home
  await page.keyboard.press('ControlOrMeta+ArrowUp');
  await expect(page.locator('.iris-grid-column')).toHaveScreenshot();
});

test('scroll while moving mouse over rows', async ({ page }) => {
  // Use simple_table for its scrollable number of rows
  await openTable(page, 'simple_table');

  const gridCanvas = page.locator('.iris-grid .grid-wrapper');
  await gridCanvas.click({ position: { x: 10, y: 80 } });
  await waitForLoadingDone(page);

  await scrollTableWhileMovingMouse(page);
});

test('scroll expanded rollup while moving mouse over rows', async ({
  page,
}) => {
  // Use simple_table for its scrollable number of rows
  await openTable(page, 'simple_table');

  await test.step('Open Rollup Rows option', async () => {
    const tableOperationsMenu = page.locator(
      'data-testid=btn-iris-grid-settings-button-table'
    );
    await tableOperationsMenu.click();
    // Wait for Table Options menu to show
    await expect(page.locator('.table-sidebar')).toHaveCount(1);
    await openTableOption(page, 'Rollup Rows');

    await test.step('Rollup column', async () => {
      const yColumn = page.getByRole('button', { name: 'y', exact: true });
      expect(yColumn).toBeTruthy();
      await yColumn.dblclick();
      await waitForLoadingDone(page);
    });

    await test.step('Expand constituent with non-aggregated columns visible', async () => {
      const gridCanvas = page.locator('.iris-grid .grid-wrapper');
      await gridCanvas.click({ position: { x: 10, y: 80 } });
      await waitForLoadingDone(page);
    });

    await test.step('Scroll while moving mouse over rows', async () => {
      await scrollTableWhileMovingMouse(page);
    });
  });
});
