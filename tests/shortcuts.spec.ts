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
  await gotoPage(page, 'http://localhost:4010/');

  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('ControlOrMeta+Alt+Shift+KeyL');
  const download = await downloadPromise;

  expect(download).not.toBeNull();
});

test('shortcut downloads logs in embeded-widget', async ({ page }) => {
  test.slow(true, 'Extend timeout to prevent a failure before page loads');

  // The embed-widgets page and the table itself have separate loading spinners,
  // causing a strict mode violation intermittently when using the goToPage helper
  await page.goto('http://localhost:4010?name=all_types');
  await expect(
    page.getByRole('progressbar', {
      name: 'Loading...',
      exact: true,
    })
  ).toHaveCount(0);

  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('ControlOrMeta+Alt+Shift+KeyL');
  const download = await downloadPromise;

  expect(download).not.toBeNull();
});
