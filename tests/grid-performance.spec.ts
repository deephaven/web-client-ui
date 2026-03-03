import { test, expect, type Page } from '@playwright/test';
import { gotoPage, openTable, waitForLoadingDone } from './utils';

/**
 * Performance benchmark tests for the Grid component.
 * Tests FPS during scrolling with and without accessibility layer.
 *
 * These tests use existing tables from the test environment:
 * - simple_table: Small table (100 rows, 2 columns)
 * - all_types: Table with many column types
 */

interface FPSResult {
  fps: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameCount: number;
  droppedFrames: number;
}

/**
 * Injects an FPS counter into the page that measures frame timings
 */
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

/**
 * Stops FPS measurement and returns the results
 */
async function stopFPSMeasurement(page: Page): Promise<FPSResult> {
  const timings = await page.evaluate(() => {
    (window as any).__fpsRunning = false;
    return (window as any).__frameTimings as number[];
  });

  // Filter out outliers (frames > 500ms are likely idle periods)
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
  // Frames taking > 33ms (less than 30fps) are considered "dropped"
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
 * Scrolls the grid using mouse wheel events
 */
async function scrollGrid(page: Page, totalDelta: number): Promise<void> {
  // Use .last() to get the most recently opened grid if multiple exist
  const grid = page.locator('.iris-grid-panel .iris-grid').last();
  const box = await grid.boundingBox();
  if (!box) throw new Error('Grid not found');

  // Move mouse to center of grid
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  // Scroll in increments
  const scrollStep = 100;
  const direction = Math.sign(totalDelta);
  let remaining = Math.abs(totalDelta);

  while (remaining > 0) {
    const step = Math.min(scrollStep, remaining);
    await page.mouse.wheel(0, step * direction);
    remaining -= step;
    // Small delay to allow rendering
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

/**
 * Performance tests are skipped by default as they can be flaky in CI due to
 * resource constraints. To run these tests explicitly:
 *
 *   RUN_PERF_TESTS=1 npx playwright test grid-performance.spec.ts
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
      await scrollGrid(page, 2000);
      await scrollGrid(page, -2000);
      await scrollGrid(page, 1500);
      await scrollGrid(page, -1000);

      const result = await stopFPSMeasurement(page);
      logResults('Simple Table Scroll', result, { minFps: 30 });

      // Assert minimum performance
      expect(result.fps).toBeGreaterThan(30);
      expect(result.droppedFrames / result.frameCount).toBeLessThan(0.2); // Less than 20% dropped
    });
  });

  test.describe('all_types table performance', () => {
    test.beforeEach(async ({ page }) => {
      // all_types is a table with many different column types
      await openTable(page, 'all_types');
      await waitForLoadingDone(page);
    });

    test('scroll performance - all_types', async ({ page }) => {
      await startFPSMeasurement(page);

      // Scroll down significantly and back
      await scrollGrid(page, 5000);
      await scrollGrid(page, -3000);
      await scrollGrid(page, 2000);
      await scrollGrid(page, -4000);

      const result = await stopFPSMeasurement(page);
      logResults('All Types Table Scroll', result, { minFps: 30 });

      expect(result.fps).toBeGreaterThan(30);
      expect(result.droppedFrames / result.frameCount).toBeLessThan(0.25);
    });

    test('rapid scroll performance', async ({ page }) => {
      await startFPSMeasurement(page);

      // Rapid small scrolls (simulates fast mouse wheel)
      for (let i = 0; i < 50; i += 1) {
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(8); // ~120fps input rate
      }

      const result = await stopFPSMeasurement(page);
      logResults('Rapid Scroll', result, { minFps: 24 });

      expect(result.fps).toBeGreaterThan(24);
    });
  });

  test.describe('accessibility layer performance comparison', () => {
    test('compare scroll performance: accessibility layer ON vs OFF', async ({
      page,
    }) => {
      await openTable(page, 'simple_table');
      await waitForLoadingDone(page);

      // Verify accessibility layer is present
      const layerCount = await page
        .locator('[data-testid="grid-accessibility-layer"]')
        .count();
      expect(layerCount).toBeGreaterThan(0);

      // --- TEST 1: WITH ACCESSIBILITY LAYER ---
      await startFPSMeasurement(page);
      await scrollGrid(page, 5000);
      await scrollGrid(page, -3000);
      await scrollGrid(page, 4000);
      await scrollGrid(page, -5000);
      const withLayerResult = await stopFPSMeasurement(page);

      // Reset scroll position
      await page.evaluate(() => {
        const grid = document.querySelector('.iris-grid .grid');
        if (grid) grid.scrollTop = 0;
      });
      await page.waitForTimeout(100);

      // --- REMOVE ACCESSIBILITY LAYER ---
      await page.evaluate(() => {
        document
          .querySelectorAll('[data-testid="grid-accessibility-layer"]')
          .forEach(el => el.remove());
      });

      // Verify layer is removed
      const layerCountAfter = await page
        .locator('[data-testid="grid-accessibility-layer"]')
        .count();
      expect(layerCountAfter).toBe(0);

      // --- TEST 2: WITHOUT ACCESSIBILITY LAYER ---
      await startFPSMeasurement(page);
      await scrollGrid(page, 5000);
      await scrollGrid(page, -3000);
      await scrollGrid(page, 4000);
      await scrollGrid(page, -5000);
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
        console.log(
          '\n✓ Accessibility layer has NEGLIGIBLE performance impact'
        );
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

      // Both should meet minimum FPS requirements
      expect(withLayerResult.fps).toBeGreaterThan(28);
      expect(withoutLayerResult.fps).toBeGreaterThan(28);

      // Accessibility layer should not cause more than 15% performance degradation
      expect(fpsPercentDiff).toBeLessThan(15);
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

    expect(result.fps).toBeGreaterThan(30);
    // For sustained scrolling, we want very few dropped frames
    expect(result.droppedFrames / result.frameCount).toBeLessThan(0.15);
  });

  test('horizontal and vertical scroll combined', async ({ page }) => {
    await openTable(page, 'all_types');
    await waitForLoadingDone(page);

    const grid = page.locator('.iris-grid-panel .iris-grid').last();
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

    expect(result.fps).toBeGreaterThan(28);
  });
});
