import DefaultConfig from './playwright.config';

const config: PlaywrightTestConfig = {
  ...DefaultConfig,
  snapshotDir: '/tests',
};

export default config;
