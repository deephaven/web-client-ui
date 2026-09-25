const baseConfig = require('./jest.config.base.cjs');
const unitConfig = require('./jest.config.unit.cjs');
const lintConfig = require('./jest.config.lint.cjs');
const withLocalConfig = require('./jest.config.withLocal.cjs');

module.exports = withLocalConfig({
  ...baseConfig,
  projects: [...lintConfig.projects, ...unitConfig.projects],
  watchPlugins: [
    ...lintConfig.watchPlugins,
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
  collectCoverage: process.env.CI === 'true',
  collectCoverageFrom: ['./src/**/*.{js,ts,jsx,tsx}'], // This is relative to individual project root due to how Jest handles it
});
