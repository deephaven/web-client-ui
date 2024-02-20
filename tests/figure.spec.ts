import { test, expect } from '@playwright/test';
import { openPlot } from './utils';

test('can open a simple figure', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await openPlot(page, 'simple_plot');
  // Now we should be able to check the snapshot on the plotly container
  await expect(
    page.locator('.iris-chart-panel .plotly.plot-container')
  ).toHaveScreenshot();
});

test('can set point shape and size', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
  await openPlot(page, 'trig_figure');
  // Now we should be able to check the snapshot on the plotly container
  await expect(
    page.locator('.iris-chart-panel .plotly.plot-container')
  ).toHaveScreenshot();
});
