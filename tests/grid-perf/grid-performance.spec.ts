/* eslint-disable no-await-in-loop -- benchmark input must be sequential */
import { test, type Locator, type Page } from '@playwright/test';
import { gotoPage, openTable, waitForLoadingDone } from '../utils';
import {
  logResults,
  scrollGrid,
  scrollGridHorizontal,
  startFPSMeasurement,
  stopFPSMeasurement,
  verifyHorizontalScrollRange,
} from './utils';

/**
 * Performance benchmark tests for the Grid component using the main app.
 * Tests FPS during scrolling with real table data from a Deephaven server.
 *
 * These tests use existing tables from the test environment:
 * - simple_table: Small table (100 rows, 2 columns)
 * - perf_all_types_big: Many column types, 1,000,000 rows
 * - perf_long_strings: ~500 character string cells, 1,000,000 rows
 * - perf_huge_strings: ~25,000 character string cells, 1,000,000 rows
 *
 * The long string tables force text measurement and truncation work that the
 * other application mode tables have no columns wide enough to trigger.
 *
 * For benchmarks that need Grid props toggled or row and column counts the
 * test data does not reach, see grid-perf-app.spec.ts which uses a standalone
 * test app.
 */

/** Horizontal distance the horizontal scroll benchmarks travel each way */
const HORIZONTAL_SCROLL_DISTANCE = 6000;

/**
 * Locates the most recently opened grid if multiple exist
 */
function getGrid(page: Page): Locator {
  return page.locator('.iris-grid-panel .iris-grid').last();
}

/**
 * Performance tests are skipped by default as they can be flaky in CI due to
 * resource constraints. To run these tests explicitly:
 *
 *   npm run e2e:performance
 */
test.describe('grid scroll performance benchmarks', () => {
  // Skip by default - these tests are flaky in CI due to resource constraints
  test.skip(
    !process.env.RUN_PERF_TESTS,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  // Run tests serially to avoid resource contention
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');
  });

  test.describe('simple_table performance', () => {
    test.beforeEach(async ({ page }) => {
      // simple_table is a 100-row table with 2 columns
      await openTable(page, 'simple_table');
      await waitForLoadingDone(page);
    });

    test('scroll performance - simple_table', async ({ page }) => {
      await startFPSMeasurement(page);

      // Scroll down and back up
      await scrollGrid(page, getGrid(page), 2000);
      await scrollGrid(page, getGrid(page), -2000);
      await scrollGrid(page, getGrid(page), 1500);
      await scrollGrid(page, getGrid(page), -1000);

      const result = await stopFPSMeasurement(page);
      logResults('Simple Table Scroll', result, { minFps: 30 });
    });
  });

  test.describe('perf_all_types_big table performance', () => {
    test.beforeEach(async ({ page }) => {
      // perf_all_types_big has many different column types and 1,000,000 rows
      // so scrolling actually exercises snapshot fetching and rendering
      await openTable(page, 'perf_all_types_big');
      await waitForLoadingDone(page);
    });

    test('scroll performance - perf_all_types_big', async ({ page }) => {
      await startFPSMeasurement(page);

      // Scroll down significantly and back
      await scrollGrid(page, getGrid(page), 5000);
      await scrollGrid(page, getGrid(page), -3000);
      await scrollGrid(page, getGrid(page), 2000);
      await scrollGrid(page, getGrid(page), -4000);

      const result = await stopFPSMeasurement(page);
      logResults('All Types Big Table Scroll', result, { minFps: 30 });
    });

    test('rapid scroll performance', async ({ page }) => {
      // Ensure the pointer is over the grid so wheel events target it
      await getGrid(page).hover();

      await startFPSMeasurement(page);

      // Rapid small scrolls (simulates fast mouse wheel)
      for (let i = 0; i < 50; i += 1) {
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(8); // ~120fps input rate
      }

      const result = await stopFPSMeasurement(page);
      logResults('Rapid Scroll', result, { minFps: 24 });
    });
  });

  test.describe('long string table performance', () => {
    test.beforeEach(async ({ page }) => {
      await openTable(page, 'perf_long_strings');
      await waitForLoadingDone(page);
    });

    test('scroll performance - long strings', async ({ page }) => {
      await startFPSMeasurement(page);

      await scrollGrid(page, getGrid(page), 5000);
      await scrollGrid(page, getGrid(page), -3000);
      await scrollGrid(page, getGrid(page), 2000);
      await scrollGrid(page, getGrid(page), -4000);

      const result = await stopFPSMeasurement(page);
      logResults('Long Strings Scroll', result, { minFps: 24 });
    });

    test('horizontal scroll performance - long strings', async ({ page }) => {
      const grid = getGrid(page);
      await verifyHorizontalScrollRange(page, grid, HORIZONTAL_SCROLL_DISTANCE);

      await startFPSMeasurement(page);

      // Columns are wider than the viewport, so horizontal scrolling changes
      // which part of each cell is truncated on every frame
      await scrollGridHorizontal(page, grid, HORIZONTAL_SCROLL_DISTANCE);
      await scrollGridHorizontal(page, grid, -HORIZONTAL_SCROLL_DISTANCE);

      const result = await stopFPSMeasurement(page);
      logResults('Long Strings Horizontal Scroll', result, { minFps: 24 });
    });

    test('rapid scroll performance - long strings', async ({ page }) => {
      const box = await getGrid(page).boundingBox();
      if (!box) throw new Error('Grid not found');

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

      await startFPSMeasurement(page);

      // Rapid small scrolls (simulates fast mouse wheel)
      for (let i = 0; i < 50; i += 1) {
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(8); // ~120fps input rate
      }

      const result = await stopFPSMeasurement(page);
      logResults('Long Strings Rapid Scroll', result, { minFps: 20 });
    });
  });

  test.describe('huge string table performance', () => {
    test.beforeEach(async ({ page }) => {
      await openTable(page, 'perf_huge_strings');
      await waitForLoadingDone(page);
    });

    test('scroll performance - huge strings', async ({ page }) => {
      await startFPSMeasurement(page);

      await scrollGrid(page, getGrid(page), 5000);
      await scrollGrid(page, getGrid(page), -3000);
      await scrollGrid(page, getGrid(page), 2000);
      await scrollGrid(page, getGrid(page), -4000);

      const result = await stopFPSMeasurement(page);
      logResults('Huge Strings Scroll', result, { minFps: 20 });
    });

    test('horizontal scroll performance - huge strings', async ({ page }) => {
      const grid = getGrid(page);
      await verifyHorizontalScrollRange(page, grid, HORIZONTAL_SCROLL_DISTANCE);

      await startFPSMeasurement(page);

      await scrollGridHorizontal(page, grid, HORIZONTAL_SCROLL_DISTANCE);
      await scrollGridHorizontal(page, grid, -HORIZONTAL_SCROLL_DISTANCE);

      const result = await stopFPSMeasurement(page);
      logResults('Huge Strings Horizontal Scroll', result, { minFps: 20 });
    });

    test('rapid scroll performance - huge strings', async ({ page }) => {
      const box = await getGrid(page).boundingBox();
      if (!box) throw new Error('Grid not found');

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

      await startFPSMeasurement(page);

      // Rapid small scrolls (simulates fast mouse wheel)
      for (let i = 0; i < 50; i += 1) {
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(8); // ~120fps input rate
      }

      const result = await stopFPSMeasurement(page);
      logResults('Huge Strings Rapid Scroll', result, { minFps: 15 });
    });
  });
});

test.describe('grid performance stress tests', () => {
  // Skip by default - these tests are flaky in CI due to resource constraints
  test.skip(
    !process.env.RUN_PERF_TESTS,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  // Run tests serially to avoid resource contention
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');
  });

  test('sustained scrolling performance', async ({ page }) => {
    await openTable(page, 'simple_table');
    await waitForLoadingDone(page);

    // Ensure the pointer is over the grid so wheel events target it
    await getGrid(page).hover();

    await startFPSMeasurement(page);

    // Sustained scrolling for 3 seconds
    const startTime = Date.now();
    const duration = 3000;
    let direction = 1;

    while (Date.now() - startTime < duration) {
      await page.mouse.wheel(0, 300 * direction);
      await page.waitForTimeout(16);

      // Reverse direction occasionally
      if (Math.random() < 0.1) {
        direction *= -1;
      }
    }

    const result = await stopFPSMeasurement(page);
    logResults('Sustained Scroll (3s)', result, { minFps: 30 });
  });

  test('horizontal and vertical scroll combined', async ({ page }) => {
    await openTable(page, 'perf_all_types_big');
    await waitForLoadingDone(page);

    const grid = getGrid(page);
    const box = await grid.boundingBox();
    if (!box) throw new Error('Grid not found');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    await startFPSMeasurement(page);

    // Combined horizontal and vertical scrolling
    for (let i = 0; i < 20; i += 1) {
      await page.mouse.wheel(500, 500);
      await page.waitForTimeout(32);
      await page.mouse.wheel(-300, 300);
      await page.waitForTimeout(32);
    }

    const result = await stopFPSMeasurement(page);
    logResults('Combined H+V Scroll', result, { minFps: 28 });
  });
});
