import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://dev-grizzly.int.illumon.com:8123/iriside');
  await page.locator('input[name="username"]').fill('iris');
  await page.locator('input[name="username"]').press('Tab');
  await page.getByTestId('btn-login').click();
  await page.getByRole('button', { name: 'Connect' }).click();
  await page.getByText('Command History').click();
  await page.getByText('File Explorer').click();
  await expect(page.getByTestId('tab-pane-active')).toContainText(
    'test1.groovy'
  );
});
