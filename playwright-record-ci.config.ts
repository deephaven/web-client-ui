import type { PlaywrightTestConfig } from '@playwright/test';
import CIConfig from './playwright-ci.config';
import RecordConfig from './playwright-record.config';

/**
 * Recording config for CI, used by the `record-new-tests` job to record the
 * e2e specs added or modified in a PR.
 *
 * Same single-take recording setup as `playwright-record.config.ts`, but it
 * also starts the preview servers since CI has no dev server running.
 */
const config: PlaywrightTestConfig = {
  ...RecordConfig,
  webServer: CIConfig.webServer,
};

export default config;
