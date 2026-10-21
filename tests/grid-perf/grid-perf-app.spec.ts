/* eslint-disable no-await-in-loop -- benchmark input must be sequential */
import { test } from '@playwright/test';
import {
  combinedScroll,
  DISPLAY_PROFILES,
  logResults,
  scrollGrid,
  startFPSMeasurement,
  stopFPSMeasurement,
  verifyDisplayProfile,
} from './utils';

/**
 * Grid Performance Tests using the standalone perf app.
 *
 * These tests use the perf app in `tests/grid-perf/app`, which provides a
 * standalone Grid component with MockGridModel data, allowing proper testing of
 * Grid props without needing a Deephaven server.
 *
 * Prerequisites:
 *   1. Install the perf app: cd tests/grid-perf/app && npm install
 *   2. Start the perf app: cd tests/grid-perf/app && npm run dev
 *   3. Run tests (from the repo root): npm run e2e:grid-performance
 *
 * The perf app supports query params:
 *   - rows: Number of rows (default: 1000000)
 *   - cols: Number of columns (default: 100)
 */

const PERF_APP_URL = 'http://localhost:4020';

test.describe('grid perf app - stress tests', () => {
  test.skip(
    !process.env.RUN_PERF_TESTS,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  test('scroll performance - 1M rows', async ({ page }) => {
    await page.goto(`${PERF_APP_URL}/?rows=1000000&cols=100`);
    await page.waitForSelector('canvas');

    await startFPSMeasurement(page);

    const canvas = page.locator('canvas').first();
    await scrollGrid(page, canvas, 5000);
    await scrollGrid(page, canvas, -3000);
    await scrollGrid(page, canvas, 4000);
    await scrollGrid(page, canvas, -5000);

    const result = await stopFPSMeasurement(page);
    logResults('1M Rows Scroll', result, { minFps: 30 });
  });

  test('scroll performance - many columns', async ({ page }) => {
    await page.goto(`${PERF_APP_URL}/?rows=100000&cols=500`);
    await page.waitForSelector('canvas');

    await startFPSMeasurement(page);

    await combinedScroll(page, page.locator('canvas').first());

    const result = await stopFPSMeasurement(page);
    logResults('500 Columns Scroll', result, { minFps: 28 });
  });

  test('sustained scrolling - 3 seconds', async ({ page }) => {
    await page.goto(`${PERF_APP_URL}/?rows=1000000&cols=100`);
    await page.waitForSelector('canvas');

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Grid canvas not found');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    await startFPSMeasurement(page);

    const startTime = Date.now();
    const duration = 3000;
    let direction = 1;

    while (Date.now() - startTime < duration) {
      await page.mouse.wheel(0, 300 * direction);
      await page.waitForTimeout(16);

      if (Math.random() < 0.1) {
        direction *= -1;
      }
    }

    const result = await stopFPSMeasurement(page);
    logResults('Sustained Scroll (3s)', result, { minFps: 30 });
  });
});

/**
 * Runs representative benchmarks at 4K resolutions and OS scaling factors.
 * Run only these with `npm run e2e:grid-performance -- --grep "display scaling"`.
 */
test.describe('grid perf app - display scaling', () => {
  test.skip(
    !process.env.RUN_PERF_TESTS,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  DISPLAY_PROFILES.forEach(profile => {
    test.describe(`display scaling - ${profile.name}`, () => {
      test.use({
        viewport: profile.viewport,
        deviceScaleFactor: profile.deviceScaleFactor,
      });

      test('scroll performance - 1M rows', async ({ page }) => {
        await page.goto(`${PERF_APP_URL}/?rows=1000000&cols=100`);
        await page.waitForSelector('canvas');
        await verifyDisplayProfile(page, page.locator('body'), profile);

        await startFPSMeasurement(page);

        const canvas = page.locator('canvas').first();
        await scrollGrid(page, canvas, 5000);
        await scrollGrid(page, canvas, -3000);
        await scrollGrid(page, canvas, 4000);
        await scrollGrid(page, canvas, -5000);

        const result = await stopFPSMeasurement(page);
        logResults(`1M Rows Scroll (${profile.name})`, result, {
          minFps: 30,
        });
      });

      test('scroll performance - many columns', async ({ page }) => {
        await page.goto(`${PERF_APP_URL}/?rows=100000&cols=500`);
        await page.waitForSelector('canvas');
        await verifyDisplayProfile(page, page.locator('body'), profile);

        await startFPSMeasurement(page);

        await combinedScroll(page, page.locator('canvas').first());

        const result = await stopFPSMeasurement(page);
        logResults(`500 Columns Scroll (${profile.name})`, result, {
          minFps: 28,
        });
      });
    });
  });
});
