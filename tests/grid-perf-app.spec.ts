import { test, expect, type Page } from '@playwright/test';

/**
 * Grid Performance Tests using the standalone perf app.
 *
 * These tests use the grid-perf-app which provides a standalone Grid component
 * with MockGridModel data, allowing proper testing of Grid props without needing
 * a Deephaven server.
 *
 * Prerequisites:
 *   1. Install the perf app: cd tests/grid-perf-app && npm install
 *   2. Start the perf app: cd tests/grid-perf-app && npm run dev
 *   3. Run tests: RUN_PERF_TESTS=1 npx playwright test grid-perf-app.spec.ts
 *
 * The perf app supports query params:
 *   - rows: Number of rows (default: 1000000)
 *   - cols: Number of columns (default: 100)
 *   - a11y: Enable accessibility layer (default: true, set to "false" to disable)
 */

const PERF_APP_URL = 'http://localhost:4020';

interface FPSResult {
  fps: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameCount: number;
  droppedFrames: number;
}

async function startFPSMeasurement(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__frameTimings = [];
    (window as any).__fpsRunning = true;
    let lastTime = performance.now();

    function measureFrame() {
      if (!(window as any).__fpsRunning) return;

      const now = performance.now();
      (window as any).__frameTimings.push(now - lastTime);
      lastTime = now;
      requestAnimationFrame(measureFrame);
    }
    requestAnimationFrame(measureFrame);
  });
}

async function stopFPSMeasurement(page: Page): Promise<FPSResult> {
  const timings = await page.evaluate(() => {
    (window as any).__fpsRunning = false;
    return (window as any).__frameTimings as number[];
  });

  const validTimings = timings.filter(t => t < 500 && t > 0);

  if (validTimings.length === 0) {
    return {
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: 0,
      maxFrameTime: 0,
      frameCount: 0,
      droppedFrames: 0,
    };
  }

  const avgFrameTime =
    validTimings.reduce((a, b) => a + b, 0) / validTimings.length;
  const fps = 1000 / avgFrameTime;
  const minFrameTime = Math.min(...validTimings);
  const maxFrameTime = Math.max(...validTimings);
  const droppedFrames = validTimings.filter(t => t > 33).length;

  return {
    fps,
    avgFrameTime,
    minFrameTime,
    maxFrameTime,
    frameCount: validTimings.length,
    droppedFrames,
  };
}

/**
 * Scrolls the grid in the perf app using mouse wheel events
 */
async function scrollPerfAppGrid(
  page: Page,
  totalDelta: number
): Promise<void> {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Grid canvas not found');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  const scrollStep = 100;
  const direction = Math.sign(totalDelta);
  let remaining = Math.abs(totalDelta);

  while (remaining > 0) {
    const step = Math.min(scrollStep, remaining);
    await page.mouse.wheel(0, step * direction);
    remaining -= step;
    await page.waitForTimeout(16);
  }
}

function logResults(
  testName: string,
  result: FPSResult,
  expected: { minFps: number }
): void {
  console.log(`\n${testName}:`);
  console.log(`  Average FPS: ${result.fps.toFixed(1)}`);
  console.log(`  Avg frame time: ${result.avgFrameTime.toFixed(2)}ms`);
  console.log(
    `  Frame time range: ${result.minFrameTime.toFixed(
      2
    )}ms - ${result.maxFrameTime.toFixed(2)}ms`
  );
  console.log(`  Total frames: ${result.frameCount}`);
  console.log(
    `  Dropped frames (>33ms): ${result.droppedFrames} (${(
      (result.droppedFrames / result.frameCount) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`  Expected min FPS: ${expected.minFps}`);
}

test.describe('grid perf app - accessibility layer comparison', () => {
  test.skip(
    !process.env.RUN_PERF_TESTS,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  test.describe.configure({ mode: 'serial' });

  test('compare scroll performance: accessibility layer ON vs OFF', async ({
    page,
  }) => {
    // --- TEST 1: WITH ACCESSIBILITY LAYER ---
    await page.goto(`${PERF_APP_URL}/?rows=1000000&cols=100&a11y=true`);
    await page.waitForSelector('canvas');

    // Verify accessibility layer is present
    const layerCount = await page
      .locator('[data-testid="grid-accessibility-layer"]')
      .count();
    expect(layerCount).toBe(1);

    await startFPSMeasurement(page);
    await scrollPerfAppGrid(page, 5000);
    await scrollPerfAppGrid(page, -3000);
    await scrollPerfAppGrid(page, 4000);
    await scrollPerfAppGrid(page, -5000);
    const withLayerResult = await stopFPSMeasurement(page);

    // --- TEST 2: WITHOUT ACCESSIBILITY LAYER ---
    await page.goto(`${PERF_APP_URL}/?rows=1000000&cols=100&a11y=false`);
    await page.waitForSelector('canvas');

    // Verify accessibility layer is NOT present
    const layerCountAfter = await page
      .locator('[data-testid="grid-accessibility-layer"]')
      .count();
    expect(layerCountAfter).toBe(0);

    await startFPSMeasurement(page);
    await scrollPerfAppGrid(page, 5000);
    await scrollPerfAppGrid(page, -3000);
    await scrollPerfAppGrid(page, 4000);
    await scrollPerfAppGrid(page, -5000);
    const withoutLayerResult = await stopFPSMeasurement(page);

    // --- COMPARISON REPORT ---
    console.log('\n========================================');
    console.log('ACCESSIBILITY LAYER PERFORMANCE COMPARISON');
    console.log('========================================\n');

    logResults('WITH Accessibility Layer', withLayerResult, { minFps: 28 });
    logResults('WITHOUT Accessibility Layer', withoutLayerResult, {
      minFps: 28,
    });

    const fpsDiff = withoutLayerResult.fps - withLayerResult.fps;
    const fpsPercentDiff = (fpsDiff / withoutLayerResult.fps) * 100;
    const frameTimeDiff =
      withLayerResult.avgFrameTime - withoutLayerResult.avgFrameTime;

    console.log('\n--- COMPARISON SUMMARY ---');
    console.log(`FPS difference: ${fpsDiff.toFixed(2)} fps`);
    console.log(
      `Performance impact: ${fpsPercentDiff > 0 ? '-' : '+'}${Math.abs(
        fpsPercentDiff
      ).toFixed(2)}%`
    );
    console.log(`Frame time overhead: ${frameTimeDiff.toFixed(3)}ms`);

    if (Math.abs(fpsPercentDiff) < 5) {
      console.log('\n✓ Accessibility layer has NEGLIGIBLE performance impact');
    } else if (fpsPercentDiff > 0) {
      console.log(
        `\n⚠ Accessibility layer causes ${fpsPercentDiff.toFixed(
          1
        )}% performance decrease`
      );
    } else {
      console.log(
        `\n✓ Accessibility layer has no negative impact (${Math.abs(
          fpsPercentDiff
        ).toFixed(1)}% faster)`
      );
    }
  });
});

test.describe('grid perf app - stress tests', () => {
  test.skip(
    !process.env.RUN_PERF_TESTS,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  test.describe.configure({ mode: 'serial' });

  test('scroll performance - 1M rows', async ({ page }) => {
    await page.goto(`${PERF_APP_URL}/?rows=1000000&cols=100`);
    await page.waitForSelector('canvas');

    await startFPSMeasurement(page);

    await scrollPerfAppGrid(page, 5000);
    await scrollPerfAppGrid(page, -3000);
    await scrollPerfAppGrid(page, 4000);
    await scrollPerfAppGrid(page, -5000);

    const result = await stopFPSMeasurement(page);
    logResults('1M Rows Scroll', result, { minFps: 30 });
  });

  test('scroll performance - many columns', async ({ page }) => {
    await page.goto(`${PERF_APP_URL}/?rows=100000&cols=500`);
    await page.waitForSelector('canvas');

    await startFPSMeasurement(page);

    // Horizontal and vertical scrolling
    for (let i = 0; i < 20; i += 1) {
      await page.mouse.wheel(500, 500);
      await page.waitForTimeout(32);
      await page.mouse.wheel(-300, 300);
      await page.waitForTimeout(32);
    }

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
