import { test, expect } from '@playwright/test';
import { gotoPage, openTable, getColumnSeparatorPosition } from './utils';

test('probe late leave', async ({ page }) => {
  await gotoPage(page, '');
  await openTable(page, 'simple_table_header_group');
  const p = await getColumnSeparatorPosition(page, 2, 1);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x - 20, p.y, { steps: 50 });
  // Emulate WebKit delivering the pointer-events boundary change late
  await page.evaluate(() => {
    const c = document.querySelector('.iris-grid canvas') as HTMLElement;
    c.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.documentElement }));
  });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot(
    'nested-group-separator-depth-1-resized.png'
  );
});
