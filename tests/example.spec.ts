import { test, expect } from '@playwright/test';

test('print commands get logged', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  // create a locator
  const consoleInput = page.locator('.console-input');

  // Monaco editor doesn't have a native input, so need to just click into it and type on the page
  // https://github.com/microsoft/playwright/issues/14126
  await consoleInput.click();

  await page.keyboard.type('print("Hello World!")');
  await page.keyboard.press('Enter');

  // Expect the output to show up in the log
  await expect(page.locator('.console-history .log-message')).toHaveText(
    'Hello World!'
  );
});

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

test('can open a simple figure', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  // Enter a command that creates a table with three columns, showing x/y/z
  await page.keyboard.type(
    `from deephaven import empty_table\nt = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`
  );
  await page.keyboard.press('Enter');

  // Create a figure that uses the table we just created
  await page.keyboard.type(
    `from deephaven.plot.figure import Figure\nf = Figure().plot_xy(series_name="Test", t=t, x="x", y="y").show()`
  );
  await page.keyboard.press('Enter');

  // Expect the panel to be open with a loading spinner first
  await expect(page.locator('.iris-chart-panel .loading-spinner')).toHaveCount(
    1
  );

  // Wait until it's done loading
  await expect(page.locator('.iris-chart-panel .loading-spinner')).toHaveCount(
    0
  );

  // Now we should be able to check the snapshot on the plotly container
  await expect(
    page.locator('.iris-chart-panel .plotly.plot-container')
  ).toHaveScreenshot();
});
