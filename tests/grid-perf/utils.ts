/* eslint-disable no-await-in-loop -- benchmark input must be sequential */
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';

/** Frame timings are too resource sensitive to run with the rest of the e2e tests */
export const PERF_TESTS_ENABLED = (process.env.RUN_PERF_TESTS ?? '') !== '';

/** Wheel delta applied per horizontal scroll step */
export const HORIZONTAL_SCROLL_STEP = 400;

/** Line delimited results consumed by `scripts/grid-perf-report.mjs` */
export const RESULTS_FILE =
  process.env.PERF_RESULTS_FILE ?? 'test-results/grid-perf-results.jsonl';

/** Line delimited results from `grid-render-breakdown.spec.ts` */
export const BREAKDOWN_RESULTS_FILE =
  process.env.PERF_BREAKDOWN_RESULTS_FILE ??
  'test-results/grid-render-breakdown.jsonl';

export interface DisplayProfile {
  name: string;
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
}

/**
 * The grid canvas backing store is its CSS size multiplied by the device pixel
 * ratio. A 4K monitor at low OS scaling shows many more cells, and at high OS
 * scaling fills many more pixels per cell, so each profile isolates one of
 * those costs. Compare results against the 1080p baseline rather than as
 * absolute numbers.
 */
export const DISPLAY_PROFILES: readonly DisplayProfile[] = [
  {
    name: '1080p baseline',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  },
  {
    name: '4K at 100%',
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 1,
  },
  {
    name: '4K at 150%',
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 1.5,
  },
  {
    name: '4K at 200%',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  },
];

/**
 * Asserts the grid canvas backing store was sized for the emulated display, so
 * a display profile benchmark can't silently measure a 1x canvas.
 */
export async function verifyDisplayProfile(
  page: Page,
  grid: Locator,
  profile: DisplayProfile
): Promise<void> {
  expect(await page.evaluate(() => window.devicePixelRatio)).toBe(
    profile.deviceScaleFactor
  );

  const canvas = grid.locator('canvas').first();
  await expect
    .poll(
      () =>
        canvas.evaluate((element: HTMLCanvasElement) =>
          Math.abs(
            element.width - element.clientWidth * window.devicePixelRatio
          )
        ),
      { message: 'Grid canvas was not scaled to the device pixel ratio' }
    )
    .toBeLessThan(1);
}

export interface FPSResult {
  fps: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameCount: number;
  droppedFrames: number;
  stalledFrames: number;
}

type FPSWindow = Window & {
  perfFrameTimings?: number[];
  perfFpsRunning?: boolean;
};

/**
 * Injects an FPS counter into the page that measures frame timings
 */
export async function startFPSMeasurement(page: Page): Promise<void> {
  await page.evaluate(() => {
    const fpsWindow = window as FPSWindow;
    const timings: number[] = [];
    fpsWindow.perfFrameTimings = timings;
    fpsWindow.perfFpsRunning = true;
    let lastTime = performance.now();

    function measureFrame() {
      if (fpsWindow.perfFpsRunning !== true) return;

      const now = performance.now();
      timings.push(now - lastTime);
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
    const fpsWindow = window as FPSWindow;
    fpsWindow.perfFpsRunning = false;
    return fpsWindow.perfFrameTimings ?? [];
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
 * Scrolls down and back up by uneven amounts, so the grid renders rows it has
 * not just drawn on each pass
 */
export async function scrollSequence(page: Page, grid: Locator): Promise<void> {
  await scrollGrid(page, grid, 5000);
  await scrollGrid(page, grid, -3000);
  await scrollGrid(page, grid, 2000);
  await scrollGrid(page, grid, -4000);
}

/**
 * Sends small wheel events faster than the display refreshes, as a fast mouse
 * wheel or trackpad does
 */
export async function rapidScroll(page: Page, grid: Locator): Promise<void> {
  const box = await grid.boundingBox();
  if (!box) throw new Error('Grid not found');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  for (let i = 0; i < 50; i += 1) {
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(8); // ~120fps input rate
  }
}

/**
 * Scrolls diagonally, alternating horizontal direction
 */
export async function combinedScroll(page: Page, grid: Locator): Promise<void> {
  const box = await grid.boundingBox();
  if (!box) throw new Error('Grid not found');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  for (let i = 0; i < 20; i += 1) {
    await page.mouse.wheel(500, 500);
    await page.waitForTimeout(32);
    await page.mouse.wheel(-300, 300);
    await page.waitForTimeout(32);
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

/** Pointer travel per hover step, about half a row so most steps change row */
const HOVER_STEP = 10;

/**
 * Sweeps the pointer down and back up the grid body while weaving across the
 * columns. Every mouse move updates the grid's hover state and redraws the
 * canvas, so this measures the row and column hover background redraws.
 * @param page The page to move the mouse on
 * @param grid The grid to hover
 * @param passes Number of round trips from the top of the grid to the bottom
 * @param delay Milliseconds to wait between mouse moves
 */
export async function hoverGrid(
  page: Page,
  grid: Locator,
  passes = 3,
  delay = 16
): Promise<void> {
  const box = await grid.locator('canvas').first().boundingBox();
  if (!box) throw new Error('Grid canvas not found');

  // Inset past the column headers and scrollbars so the pointer is always
  // over a data cell
  const left = box.x + 20;
  const right = box.x + box.width - 30;
  const top = box.y + 40;
  const bottom = box.y + box.height - 30;
  const width = right - left;
  const stepCount = Math.floor((bottom - top) / HOVER_STEP);
  // Cross the grid horizontally a few times on each vertical pass
  const weavePeriod = Math.max(1, Math.floor(stepCount / 3));

  const moveTo = async (step: number): Promise<void> => {
    const phase = (step % (weavePeriod * 2)) / weavePeriod;
    const x = left + width * (phase <= 1 ? phase : 2 - phase);
    await page.mouse.move(x, top + step * HOVER_STEP);
    await page.waitForTimeout(delay);
  };

  for (let pass = 0; pass < passes; pass += 1) {
    for (let step = 0; step <= stepCount; step += 1) {
      await moveTo(step);
    }
    for (let step = stepCount; step >= 0; step -= 1) {
      await moveTo(step);
    }
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
        // Truncate to a 32 bit int so the hash doesn't lose precision
        // eslint-disable-next-line no-bitwise
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
 * @param count Number of frames
 * @param total Total frames measured
 * @returns The count as a percentage of the total
 */
function percent(count: number, total: number): string {
  return total === 0 ? '0.0%' : `${((count / total) * 100).toFixed(1)}%`;
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

  /* eslint-disable no-console */
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
    `  Dropped frames (>33ms): ${result.droppedFrames} (${percent(
      result.droppedFrames,
      result.frameCount
    )})`
  );
  console.log(
    `  Stalled frames (>=500ms): ${result.stalledFrames} (${percent(
      result.stalledFrames,
      result.frameCount
    )})`
  );
  console.log(`  Expected min FPS: ${expected.minFps}`);
  /* eslint-enable no-console */
}
