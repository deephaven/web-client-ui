import { test, expect } from '@playwright/test';
import { gotoPage, importLayout } from './utils';

test('can open the WebGL test page and display all plots correctly', async ({
  page,
}) => {
  await gotoPage(page, '');
  await importLayout(page, 'webgl-plots-test.json');

  await expect(page.locator('.chart-panel-container')).not.toHaveCount(0);
  await expect(
    page.locator('.chart-panel-container .loading-spinner')
  ).toHaveCount(0);

  await expect(page.locator('.dashboard-container')).toHaveScreenshot();
});
