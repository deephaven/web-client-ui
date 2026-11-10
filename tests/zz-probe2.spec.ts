import { test, expect } from '@playwright/test';
import { gotoPage, openTable } from './utils';

test('probe viewport update without data update', async ({ page }) => {
  await gotoPage(page, '');
  await openTable(page, 'multiselect_string');
  await expect(page.locator('.iris-grid-loading-status-bar')).toHaveCount(0);
  await page.evaluate(() => {
    const el = document.querySelector('.iris-grid') as any;
    const key = Object.keys(el).find(k => k.startsWith('__reactFiber'))!;
    let f = el[key];
    while (f && !(f.stateNode && f.stateNode.handleViewportUpdated)) f = f.return;
    // A viewport change whose data update lands before the 500ms viewport-loading throttle fires
    f.stateNode.handleViewportUpdated();
  });
  await page.waitForTimeout(1500); // probe only: let the 500ms throttle fire
  console.log('PROBE status:', await page.locator('.iris-grid-loading-status').allTextContents());
  await expect(page.locator('.iris-grid-loading-status-bar')).toHaveCount(0);
});
