import type { PlaywrightTestConfig } from '@playwright/test';
import DefaultConfig from './playwright.config';

const config: PlaywrightTestConfig = {
  ...DefaultConfig,
  webServer: [
    {
      command: 'BASE_URL=/ide/ npm run preview:app -- -- -- --no-open', // Passing flags through npm is fun
      port: 4000,
      timeout: 60 * 1000,
      reuseExistingServer: false,
      // Playwright discards webServer stdout by default, which hides proxy and asset-serving
      // errors that only show up on the runs we are trying to diagnose.
      stdout: 'pipe',
    },
    {
      command:
        'BASE_URL=/iframe/widget/ npm run preview:embed-widget -- -- -- --no-open',
      port: 4010,
      timeout: 60 * 1000,
      reuseExistingServer: false,
      stdout: 'pipe',
    },
  ],

  // Applies to the npm command and CI, but CI will get overwritten in the CI config
  reporter: [['github'], ['html', { host: '0.0.0.0', port: 9323 }]],
};

export default config;
