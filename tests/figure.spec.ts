import { test, expect, Page, Locator } from '@playwright/test';
import { generateVarName, pasteInMonaco } from './utils';

let page: Page;
let consoleInput: Locator;

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('');

  consoleInput = page.locator('.console-input');
});

test.afterEach(async () => {
  await page.close();
});

test('can open a simple figure', async () => {
  const figureName = generateVarName();

  // Create a figure that uses the table we just created
  const command = `from deephaven import empty_table
from deephaven.plot.figure import Figure
${figureName} = Figure().plot_xy(series_name="Test", t=empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"]), x="x", y="y").show()`;

  await pasteInMonaco(consoleInput, command);

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

test('can set point shape and size', async () => {
  const tableName = generateVarName();
  const figureName = generateVarName();
  const command = `from deephaven import empty_table
from deephaven.plot import Figure
import math

math_funcs = ["sin", "cos"]
shapes = ["SQUARE", "CIRCLE", "UP_TRIANGLE", "DOWN_TRIANGLE", "RIGHT_TRIANGLE", "LEFT_TRIANGLE", "DIAMOND"]
# Unsupported shapes: ["ELLIPSE", "HORIZONTAL_RECTANGLE", "VERTICAL_RECTANGLE"]

# Create a generic table that has enough columns to display all the shapes
# Re-uses some of the funcs
${tableName} = empty_table(50).update(["x=i*0.1"])
for i in range(len(shapes)):
    ${tableName} = ${tableName}.update([f"y{i}=Math.{math_funcs[i % len(math_funcs)]}(x+{math.floor(i / len(math_funcs))})"])

# Generate the table and figure based on the shapes created
${figureName} = Figure()
for i in range(len(shapes)):
    ${figureName} = ${figureName}.plot_xy(series_name=shapes[i], t=${tableName}, x="x", y=f"y{i}").point(shape=shapes[i], size=len(shapes) - i, visible=True)

${figureName} = ${figureName}.show();`;

  await pasteInMonaco(consoleInput, command);
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
