import { test, expect } from '@playwright/test';
import { generateVarName } from './utils';

test('can open a simple figure', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const tableName = generateVarName();
  const figureName = generateVarName();

  // Enter a command that creates a table with three columns, showing x/y/z
  await page.keyboard.type(
    `from deephaven import empty_table\n${tableName} = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])`
  );
  await page.keyboard.press('Enter');

  // Create a figure that uses the table we just created
  await page.keyboard.type(`from deephaven.plot.figure import Figure`);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type(
    `${figureName} = Figure().plot_xy(series_name="Test", t=${tableName}, x="x", y="y").show()`
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
