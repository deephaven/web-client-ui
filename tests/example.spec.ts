import { test, expect } from '@playwright/test';
import shortid from 'shortid';

test('print commands get logged', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  // create a locator
  const consoleInput = page.locator('.console-input');

  // Monaco editor doesn't have a native input, so need to just click into it and type on the page
  // https://github.com/microsoft/playwright/issues/14126
  await consoleInput.click();

  const message = `Hello ${shortid()}!`;
  await page.keyboard.type(`print("${message}")`);
  await page.keyboard.press('Enter');

  // Expect the output to show up in the log
  await expect(page.locator('.console-history .log-message')).toHaveText(
    message
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

test('test creating a file, saving it, closing it, re-opening it, running it, then deleting it', async ({
  page,
}) => {
  // Go to http://localhost:4000/
  await page.goto('http://localhost:4000/');

  // Click text=File Explorer
  await page.locator('text=File Explorer').click();

  // Click [aria-label="New notebook"]
  await page.locator('[aria-label="New notebook"]').click();

  // Click .editor-container > div > .overflow-guard > .monaco-scrollable-element > .lines-content > .view-lines
  await page
    .locator(
      '.editor-container > div > .overflow-guard > .monaco-scrollable-element > .lines-content > .view-lines'
    )
    .click();

  const message = `Hello notebook ${shortid()}!`;

  await page.keyboard.type(`print("${message}")`);

  // Click the Save button
  await page.locator('[aria-label="Save notebook"]').click();

  // Generate a unique filename so it doesn't conflict with any previously created files
  const filename = `__playwright_test${shortid()}.py`;

  // Fill text=Save file asDirectory: // >> input[type="text"]
  await page
    .locator('text=Save file asDirectory: // >> input[type="text"]')
    .fill(filename);

  // Click button:has-text("Save")
  await page.locator('button:has-text("Save")').click();

  // Click close on the notebook file .lm_close_tab
  await page.locator('.lm_close_tab').click();

  // Click to re-open the file
  await page.locator(`text=${filename}`).click();

  // Click the Save button
  await page.locator('[aria-label="Run notebook"]').click();

  // Click close on the notebook file .lm_close_tab
  await page.locator('.lm_close_tab').click();

  // Expect the output to show up in the log
  // await expect(page.locator('.console-history .log-message')).toHaveText(
  //   'Hello Playwright!'
  // );

  // Right-click the file to open the menu, then delete it
  await page.locator(`text=${filename}`).click({
    button: 'right',
  });

  // Click button:has-text("DeleteDelete")
  await page.locator('button:has-text("DeleteDelete")').click();

  // Click button:has-text("Delete")
  await page.locator('button:has-text("Delete")').click();
});
