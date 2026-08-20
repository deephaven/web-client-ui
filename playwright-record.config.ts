import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';
import DefaultConfig from './playwright.config';

/**
 * Playwright config dedicated to *recording* a single e2e test as a video, e.g.
 * to attach to a PR or Jira ticket. Use it via `npm run e2e:record`.
 *
 * Differences from the standard e2e config:
 * - Video is always recorded (not just on failure) at a fixed 1280x720 size.
 * - `slowMo` is enabled so the recording is easy to follow.
 * - Runs chromium only, serially with a single worker and no retries, for a
 *   clean, single take.
 * - Artifacts (including the video) are written under the gitignored
 *   `test-results/e2e-video` directory.
 * - A global setup warms up the local dev server first so the video doesn't
 *   begin with ~10s of blank white screen while Vite compiles on first request.
 */

/** Delay (ms) added before each Playwright action so the video is followable. */
const DEFAULT_SLOW_MO_MS = 500;
const slowMoEnv = Number(process.env.E2E_RECORD_SLOWMO);
const SLOW_MO_MS =
  Number.isFinite(slowMoEnv) && slowMoEnv >= 0 ? slowMoEnv : DEFAULT_SLOW_MO_MS;

const VIDEO_SIZE = { width: 1280, height: 720 };
const OUTPUT_DIR = path.resolve(__dirname, 'test-results/e2e-video');

const chromiumProject = (DefaultConfig.projects ?? []).find(
  project => project.name === 'chromium'
);

const config: PlaywrightTestConfig = {
  ...DefaultConfig,

  // A recording is a single, deterministic take - no parallelism or retries.
  fullyParallel: false,
  workers: 1,
  retries: 0,

  globalSetup: require.resolve('./tests/record-globalSetup.ts'),

  outputDir: OUTPUT_DIR,

  // Print test results to the console; skip the html reporter since this is a
  // local, interactive recording.
  reporter: [['list']],

  use: {
    ...DefaultConfig.use,
    video: {
      mode: 'on',
      size: VIDEO_SIZE,
    },
    // `video` only covers the built-in page/context fixtures. Specs that build
    // their own context (`browser.newPage()` in `beforeAll`) need this instead.
    contextOptions: {
      recordVideo: {
        dir: path.join(OUTPUT_DIR, 'manual-context'),
        size: VIDEO_SIZE,
      },
    },
  },

  // Keep chromium's existing options (devices preset, launch args) and add slowMo.
  projects: [
    {
      ...chromiumProject,
      name: 'chromium',
      use: {
        ...chromiumProject?.use,
        launchOptions: {
          ...chromiumProject?.use?.launchOptions,
          slowMo: SLOW_MO_MS,
        },
      },
    },
  ],
};

export default config;
