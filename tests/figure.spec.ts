import { test, expect } from '@playwright/test';
import { generateVarName, typeInMonaco } from './utils';

test('can open a simple figure', async ({ page }) => {
  await page.goto('http://localhost:4000/');

  const consoleInput = page.locator('.console-input');
  await consoleInput.click();

  const figureName = generateVarName();

  // Create a figure that uses the table we just created
  const command = `from deephaven import empty_table\rfrom deephaven.plot.figure import Figure\r${figureName} = Figure().plot_xy(series_name="Test", t=empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"]), x="x", y="y").show()\r`;
  await typeInMonaco(page, command);
  await page.keyboard.press('Enter');

  // Expect the panel to be open with a loading spinner first
  await expect(page.locator('.iris-chart-panel')).toHaveCount(1);

  // Wait until it's done loading
  await expect(page.locator('.iris-chart-panel .loading-spinner')).toHaveCount(
    0
  );

  // Now we should be able to check the snapshot on the plotly container
  await expect(
    page.locator('.iris-chart-panel .plotly.plot-container')
  ).toHaveScreenshot();
});
