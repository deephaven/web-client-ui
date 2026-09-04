/* eslint-disable no-await-in-loop -- benchmark input must be sequential */
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';

/** Wheel delta applied per horizontal scroll step */
export const HORIZONTAL_SCROLL_STEP = 400;

/** Line delimited results consumed by `scripts/grid-perf-report.mjs` */
const RESULTS_FILE =
  process.env.PERF_RESULTS_FILE ?? 'test-results/grid-perf-results.jsonl';

export interface FPSResult {
  fps: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameCount: number;
  droppedFrames: number;
  stalledFrames: number;
}

/**
 * Injects an FPS counter into the page that measures frame timings
 */
export async function startFPSMeasurement(page: Page): Promise<void> {
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
export async function stopFPSMeasurement(page: Page): Promise<FPSResult> {
  const timings = await page.evaluate(() => {
    (window as any).__fpsRunning = false;
    return (window as any).__frameTimings as number[];
  });

  // Only drop non-positive/invalid timings; retain long frames (stalls) so
  // that severe regressions are not hidden from the reported metrics.
  const validTimings = timings.filter(t => t > 0);

  if (validTimings.length === 0) {
    return {
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: 0,
      maxFrameTime: 0,
      frameCount: 0,
      droppedFrames: 0,
      stalledFrames: 0,
    };
  }

  const avgFrameTime =
    validTimings.reduce((a, b) => a + b, 0) / validTimings.length;
  const fps = 1000 / avgFrameTime;
  const minFrameTime = Math.min(...validTimings);
  const maxFrameTime = Math.max(...validTimings);
  // Frames taking > 33ms (less than 30fps) are considered "dropped"
  const droppedFrames = validTimings.filter(t => t > 33).length;
  // Frames taking >= 500ms are likely severe stalls, reported separately
  const stalledFrames = validTimings.filter(t => t >= 500).length;

  return {
    fps,
    avgFrameTime,
    minFrameTime,
    maxFrameTime,
    frameCount: validTimings.length,
    droppedFrames,
    stalledFrames,
  };
}

/**
 * Scrolls the given element using mouse wheel events
 */
export async function scrollGrid(
  page: Page,
  grid: Locator,
  totalDelta: number
): Promise<void> {
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

/**
 * Scrolls the given element horizontally using mouse wheel events
 */
export async function scrollGridHorizontal(
  page: Page,
  grid: Locator,
  totalDelta: number
): Promise<void> {
  const box = await grid.boundingBox();
  if (!box) throw new Error('Grid not found');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  const direction = Math.sign(totalDelta);
  let remaining = Math.abs(totalDelta);

  while (remaining > 0) {
    const step = Math.min(HORIZONTAL_SCROLL_STEP, remaining);
    await page.mouse.wheel(step * direction, 0);
    remaining -= step;
    // Small delay to allow rendering
    await page.waitForTimeout(16);
  }
}

/**
 * Hashes a strip of the grid canvas covering the column headers and first rows.
 * The grid draws to a single canvas, so this is the only way to observe that
 * what is rendered actually changed.
 */
export async function getGridSignature(grid: Locator): Promise<string> {
  return grid
    .locator('canvas')
    .first()
    .evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if (context == null) throw new Error('Grid canvas has no 2d context');

      const { data } = context.getImageData(
        0,
        0,
        canvas.width,
        Math.min(canvas.height, 200)
      );

      let hash = 0;
      for (let i = 0; i < data.length; i += 4) {
        hash = (Math.imul(hash, 31) + data[i]) | 0;
      }
      return String(hash);
    });
}

/**
 * Asserts the grid can scroll horizontally by `distance` without running out of
 * range, then returns it to the left edge. A benchmark that scrolls past the
 * right edge measures an idle grid instead of rendering work.
 */
export async function verifyHorizontalScrollRange(
  page: Page,
  grid: Locator,
  distance: number
): Promise<void> {
  const start = await getGridSignature(grid);

  await scrollGridHorizontal(page, grid, distance - HORIZONTAL_SCROLL_STEP);
  await expect
    .poll(() => getGridSignature(grid), {
      message: 'Grid did not scroll horizontally',
    })
    .not.toBe(start);

  const nearEnd = await getGridSignature(grid);
  await scrollGridHorizontal(page, grid, HORIZONTAL_SCROLL_STEP);
  await expect
    .poll(() => getGridSignature(grid), {
      message: `Grid has less than ${distance}px of horizontal scroll range`,
    })
    .not.toBe(nearEnd);

  // Overscroll so the grid clamps back to the left edge
  await scrollGridHorizontal(page, grid, -distance * 2);
}

/**
 * Appends a benchmark result so it can be aggregated into a report after the
 * run. Benchmarks run serially, so appends never interleave.
 */
function recordResult(
  testName: string,
  result: FPSResult,
  expected: { minFps: number }
): void {
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.appendFileSync(
    RESULTS_FILE,
    `${JSON.stringify({
      name: testName,
      minFps: expected.minFps,
      ...result,
    })}\n`
  );
}

export function logResults(
  testName: string,
  result: FPSResult,
  expected: { minFps: number }
): void {
  recordResult(testName, result, expected);

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
  console.log(
    `  Stalled frames (>=500ms): ${result.stalledFrames} (${(
      (result.stalledFrames / result.frameCount) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`  Expected min FPS: ${expected.minFps}`);
}
