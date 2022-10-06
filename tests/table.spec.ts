import { test, expect } from '@playwright/test';

test('can open a simple table', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  // Enter a command that creates a table with three columns, showing x/y/z
  await page.keyboard.type(
    `from deephaven import empty_table\nt = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`
  );
  await page.keyboard.press('Enter');

  // Expect the panel to be open with a loading spinner first
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    1
  );

  // Wait until it's done loading
  await expect(page.locator('.iris-grid-panel .loading-spinner')).toHaveCount(
    0
  );

  // Model is loaded, need to make sure table data is also loaded
  await expect(
    page.locator('.iris-grid .iris-grid-loading-status')
  ).toHaveCount(0);

  // Now we should be able to check the snapshot
  await expect(page.locator('.iris-grid-panel .iris-grid')).toHaveScreenshot();
});
