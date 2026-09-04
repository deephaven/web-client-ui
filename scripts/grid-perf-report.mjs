#!/usr/bin/env node
// @ts-check
/**
 * Turns the results written by tests/grid-perf into a markdown report.
 *
 * Usage:
 *   node scripts/grid-perf-report.mjs [results-file]
 *
 * Writes the report to stdout, to test-results/grid-perf-report.md, and to
 * $GITHUB_STEP_SUMMARY when running in a GitHub action.
 */
/* eslint-disable no-console */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const resultsPath = path.resolve(
  rootDir,
  process.argv[2] ??
    process.env.PERF_RESULTS_FILE ??
    'test-results/grid-perf-results.jsonl'
);
const reportPath = path.join(rootDir, 'test-results', 'grid-perf-report.md');

if (!existsSync(resultsPath)) {
  console.error(`No benchmark results found at ${resultsPath}`);
  process.exit(1);
}

/**
 * @typedef {{
 *   name: string;
 *   minFps: number;
 *   fps: number;
 *   avgFrameTime: number;
 *   minFrameTime: number;
 *   maxFrameTime: number;
 *   frameCount: number;
 *   droppedFrames: number;
 *   stalledFrames: number;
 * }} PerfResult
 */

/** @type {Map<string, PerfResult>} */
const results = new Map();

readFileSync(resultsPath, 'utf8')
  .split('\n')
  .filter(line => line.trim() !== '')
  // Retries append a second result for the same benchmark, keep the last one
  .forEach(line => {
    const result = JSON.parse(line);
    results.set(result.name, result);
  });

if (results.size === 0) {
  console.error(`No benchmark results found in ${resultsPath}`);
  process.exit(1);
}

/**
 * @param {number} count
 * @param {number} total
 * @returns {string} The count as a percentage of the total
 */
const percent = (count, total) =>
  total === 0 ? '0.0%' : `${((count / total) * 100).toFixed(1)}%`;

const rows = [...results.values()].map(result => {
  const belowTarget = result.fps < result.minFps;
  return [
    result.name,
    result.fps.toFixed(1),
    String(result.minFps),
    belowTarget ? '**Below target**' : 'OK',
    result.avgFrameTime.toFixed(2),
    result.maxFrameTime.toFixed(2),
    `${result.droppedFrames} (${percent(
      result.droppedFrames,
      result.frameCount
    )})`,
    `${result.stalledFrames} (${percent(
      result.stalledFrames,
      result.frameCount
    )})`,
  ].join(' | ');
});

const belowTargetCount = [...results.values()].filter(
  result => result.fps < result.minFps
).length;

const report = `### Grid scroll performance

${results.size} benchmark${
  results.size === 1 ? '' : 's'
}, ${belowTargetCount} below target.

| Benchmark | Avg FPS | Target FPS | Result | Avg frame (ms) | Max frame (ms) | Dropped (>33ms) | Stalled (>=500ms) |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
${rows.map(row => `| ${row} |`).join('\n')}

FPS on shared CI runners is noisy, so treat these numbers as a trend rather than a pass/fail gate.
`;

console.log(report);

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);

if (process.env.GITHUB_STEP_SUMMARY != null) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}
