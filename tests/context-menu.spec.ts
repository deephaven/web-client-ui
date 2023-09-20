import { test, expect } from '@playwright/test';

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
});
