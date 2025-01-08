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
  await gotoPage(page, 'localhost:4010/iframe/widget');

  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('ControlOrMeta+Alt+Shift+KeyL');
  const download = await downloadPromise;

  expect(download).not.toBeNull();
});
