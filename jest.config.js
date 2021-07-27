const baseConfig = require('./jest.config.base');

module.exports = {
  // ...baseConfig,
  projects: [
    '<rootDir>/packages/*/jest.config.js',
    {
      displayName: 'eslint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
      // ...baseConfig,
      // testMatch: ['<rootDir>/test/*.test.*'],
    },
  ],
  watchPlugins: ['jest-runner-eslint/watch-fix'],
  // coverageDirectory: '<rootDir>/coverage/',
  // collectCoverageFrom: ['<rootDir>/packages/*/src/**/*.{js,ts,jsx,tsx}'],
};
