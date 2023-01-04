import DefaultConfig from '../../playwright.config';

const config: PlaywrightTestConfig = {
  ...DefaultConfig,
  testDir: '../../tests',
  use: {
    ...DefaultConfig.use,
    baseURL: 'http://host.docker.internal:4000/jsapi',
  },
  webServer: undefined,
};

export default config;
