import { type Locator, type Page } from '@playwright/test';

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

export function logResults(
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
  console.log(
    `  Stalled frames (>=500ms): ${result.stalledFrames} (${(
      (result.stalledFrames / result.frameCount) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`  Expected min FPS: ${expected.minFps}`);
}
