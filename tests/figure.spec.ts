import { test, expect } from '@playwright/test';
import { openTableOrPlot } from './utils';

test('can open a simple figure', async ({ page }) => {
  await openTableOrPlot(page, 'plot', 'simple_plot');
  // Now we should be able to check the snapshot on the plotly container
  await expect(
    page.locator('.iris-chart-panel .plotly.plot-container')
  ).toHaveScreenshot();
});

test('can set point shape and size', async ({ page }) => {
  await openTableOrPlot(page, 'plot', 'trig_figure');
  // Now we should be able to check the snapshot on the plotly container
  await expect(
    page.locator('.iris-chart-panel .plotly.plot-container')
  ).toHaveScreenshot();
});
