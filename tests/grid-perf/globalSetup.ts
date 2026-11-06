import fs from 'node:fs';
import { type FullConfig } from '@playwright/test';
import baseGlobalSetup from '../globalSetup';
import { BREAKDOWN_RESULTS_FILE, RESULTS_FILE } from './utils';

/**
 * Global setup used only by the grid perf benchmarks (see
 * playwright-perf.config.ts).
 *
 * Benchmarks append to the results files as they run, so clear them first.
 * Otherwise results from an earlier run of benchmarks that were filtered out
 * this time would show up in the report as if they were current.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  await baseGlobalSetup(config);

  fs.rmSync(RESULTS_FILE, { force: true });
  fs.rmSync(BREAKDOWN_RESULTS_FILE, { force: true });
}

export default globalSetup;
