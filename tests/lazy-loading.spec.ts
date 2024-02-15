import { test, expect } from '@playwright/test';

test('does not load heavy dependencies by default', async ({ page }) => {
  page.on('request', request => {
    expect(request.url()).not.toMatch('assets/plotly');
    expect(request.url()).not.toMatch('assets/mathjax');
  });
  await page.goto('');
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
});
