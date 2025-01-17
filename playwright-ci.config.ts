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
    },
    {
      command:
        'BASE_URL=/iframe/widget/ npm run preview:embed-widget -- -- -- --no-open',
      port: 4010,
      timeout: 60 * 1000,
      reuseExistingServer: false,
    },
  ],

  // Applies to the npm command and CI, but CI will get overwritten in the CI config
  reporter: [['github'], ['html']],
};

export default config;
