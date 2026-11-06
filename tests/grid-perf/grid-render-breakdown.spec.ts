import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  BREAKDOWN_RESULTS_FILE,
  DISPLAY_PROFILES,
  verifyDisplayProfile,
  PERF_TESTS_ENABLED,
} from './utils';
// Types only, the perf app is not an installed package
/* eslint-disable import/no-relative-packages */
import type {
  BreakdownVariant,
  RenderBreakdownResult,
} from './app/src/renderBreakdown';
/* eslint-enable import/no-relative-packages */

/**
 * Splits grid draw time into model/text processing and raw canvas drawing for
 * the same visible cells, at each display profile. Compare the variants to see
 * where frame time goes:
 *
 * - cellText vs rawTextWithContextState: model and truncation cache overhead
 * - rawTextWithContextState vs rawText: per cell save/restore and measureText
 * - rawText: the floor for drawing this much text on this canvas
 * - cellTextColdCache vs cellText: what truncation cache misses cost
 *
 * Uses the standalone perf app (see grid-perf-app.spec.ts for setup), and runs
 * with `npm run e2e:grid-render-breakdown`.
 */

const PERF_APP_URL = 'http://localhost:4020';

const TEXT_MODES = ['short', 'long'] as const;

function formatBreakdown(
  title: string,
  breakdown: RenderBreakdownResult
): string {
  const {
    canvasWidth,
    canvasHeight,
    devicePixelRatio,
    visibleCells,
    visibleColumns,
    visibleRows,
    results,
  } = breakdown;

  const rows = (Object.keys(results) as BreakdownVariant[]).map(variant => {
    const { cpuMs, frameMs } = results[variant];
    return [
      variant.padEnd(24),
      cpuMs.median.toFixed(2).padStart(10),
      cpuMs.p95.toFixed(2).padStart(9),
      frameMs.median.toFixed(2).padStart(12),
      frameMs.p95.toFixed(2).padStart(11),
    ].join('');
  });

  return [
    `\n${title}`,
    `  ${visibleCells} cells (${visibleColumns} columns x ${visibleRows} rows), canvas ${canvasWidth}x${canvasHeight} at ${devicePixelRatio}x`,
    `  ${'variant'.padEnd(24)}${'cpu median'.padStart(10)}${'cpu p95'.padStart(
      9
    )}${'frame median'.padStart(12)}${'frame p95'.padStart(11)}  (ms)`,
    ...rows.map(row => `  ${row}`),
  ].join('\n');
}

test.describe('grid render breakdown', () => {
  test.skip(
    !PERF_TESTS_ENABLED,
    'Performance tests skipped. Set RUN_PERF_TESTS=1 to run.'
  );

  // Slow variants take up to a few hundred ms per frame at 4K
  test.setTimeout(5 * 60 * 1000);

  DISPLAY_PROFILES.forEach(profile => {
    test.describe(profile.name, () => {
      test.use({
        viewport: profile.viewport,
        deviceScaleFactor: profile.deviceScaleFactor,
      });

      TEXT_MODES.forEach(textMode => {
        test(`${textMode} text`, async ({ page }, testInfo) => {
          await page.goto(
            `${PERF_APP_URL}/?rows=1000000&cols=100&text=${textMode}`
          );
          await page.waitForSelector('canvas');
          await verifyDisplayProfile(page, page.locator('body'), profile);
          await page.waitForFunction(() => window.runRenderBreakdown != null);

          const breakdown = await page.evaluate(() => {
            if (window.runRenderBreakdown == null) {
              throw new Error('runRenderBreakdown not registered');
            }
            return window.runRenderBreakdown({ iterations: 60, warmup: 10 });
          });

          expect(breakdown.visibleCells).toBeGreaterThan(0);

          const name = `Render Breakdown (${profile.name}, ${textMode} text)`;
          // eslint-disable-next-line no-console
          console.log(formatBreakdown(name, breakdown));

          fs.mkdirSync(path.dirname(BREAKDOWN_RESULTS_FILE), {
            recursive: true,
          });
          fs.appendFileSync(
            BREAKDOWN_RESULTS_FILE,
            `${JSON.stringify({ name, ...breakdown })}\n`
          );
          await testInfo.attach('render-breakdown', {
            body: JSON.stringify(breakdown, null, 2),
            contentType: 'application/json',
          });
        });
      });
    });
  });
});
