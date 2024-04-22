import type { PlaywrightTestConfig } from '@playwright/test';
import DefaultConfig from './playwright.config';

const config: PlaywrightTestConfig = {
  ...DefaultConfig,
  webServer: {
    // Only start the main code-studio server right now
    // To test embed-widget, should have an array set for `webServer` and run them all separately as there's a port check
    command: 'BASE_URL=/ide/ npm run preview:app -- -- -- --no-open', // Passing flags through npm is fun
    port: 4000,
    timeout: 60 * 1000,
    reuseExistingServer: false,
  },
  // Applies to the npm command and CI, but CI will get overwritten in the CI config
  reporter: [['github'], ['html']],
};

export default config;
