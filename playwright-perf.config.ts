import type { PlaywrightTestConfig } from '@playwright/test';
import DefaultConfig from './playwright.config';
import CiConfig from './playwright-ci.config';

/**
 * Playwright config for the grid performance benchmarks in `tests/grid-perf`.
 * Used by `npm run e2e:performance` and `npm run e2e:grid-performance`.
 *
 * Differences from the standard e2e config:
 * - Video and trace capture are off. Recording competes with rendering for
 *   resources and skews the frame times the benchmarks measure.
 * - Runs chromium only, serially with a single worker and no retries, so
 *   results are comparable between runs.
 *
 * In CI it builds on `playwright-ci.config.ts` so the preview servers are
 * started the same way as the rest of the e2e suite.
 */
const BaseConfig = process.env.CI ? CiConfig : DefaultConfig;

const config: PlaywrightTestConfig = {
  ...BaseConfig,

  testDir: './tests/grid-perf',

  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [['list']],

  use: {
    ...BaseConfig.use,
    video: 'off',
    trace: 'off',
  },

  projects: (BaseConfig.projects ?? []).filter(
    project => project.name === 'chromium'
  ),
};

export default config;
