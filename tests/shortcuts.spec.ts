import { test, expect } from '@playwright/test';
import { gotoPage } from './utils';

test('shortcut downloads logs', async ({ page }) => {
  await gotoPage(page, '');

  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('ControlOrMeta+Alt+Shift+KeyL');
  const download = await downloadPromise;

  expect(download).not.toBeNull();
});

test('shortcut downloads logs in full screen error', async ({ page }) => {
  // Go to embed-widget page without url parameter to trigger a full screen error
  await gotoPage(page, 'localhost:4010');

  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('ControlOrMeta+Alt+Shift+KeyL');
  const download = await downloadPromise;

  expect(download).not.toBeNull();
});
