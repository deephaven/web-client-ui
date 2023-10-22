import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 120 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 15000,
  },
  /* We don't want to run tests in parallel because we have the same backend, tests may conflict with eachother */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Global setup file for initializing before all other tests */
  globalSetup: require.resolve('./tests/globalSetup.ts'),
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Only have one worker since we don't want tests running in parallel, trampling over each other on the backend */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* Use host 0.0.0.0 so it can be forwarded from within docker */
  reporter: [['html', { host: '0.0.0.0', port: 9323 }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,

    /* Navigation timeout for how long it takes to navigate to a page */
    navigationTimeout: 60 * 1000,

    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:4000/ide/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Retain videos on failure for easier debugging */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // https://playwright.dev/docs/test-use-options#more-browser-and-context-options
        launchOptions: {
          // https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-firefox-user-prefs
          firefoxUserPrefs: {
            // By default, headless Firefox runs as though no pointers capabilities
            // are available.
            // https://github.com/microsoft/playwright/issues/7769#issuecomment-966098074
            //
            // This impacts React Spectrum which uses an '(any-pointer: fine)'
            // media query to determine font size. It also causes certain chart
            // elements to always be visible that should only be visible on
            // hover.
            //
            // Available values for pointer capabilities:
            // NO_POINTER            = 0x00;
            // COARSE_POINTER        = 0x01;
            // FINE_POINTER          = 0x02;
            // HOVER_CAPABLE_POINTER = 0x04;
            //
            // Setting to 0x02 | 0x04 says the system supports a mouse
            'ui.primaryPointerCapabilities': 0x02 | 0x04,
            'ui.allPointerCapabilities': 0x02 | 0x04,
          },
        },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
};

export default config;
