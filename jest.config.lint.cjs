const withLocalConfig = require('./jest.config.withLocal.cjs');

module.exports = withLocalConfig({
  watchPlugins: ['jest-runner-eslint/watch-fix'],
  projects: [
    {
      displayName: 'eslint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: [
        '<rootDir>/packages/golden-layout/*',
        '<rootDir>/packages/[^/]+/dist/',
      ],
      testEnvironment: 'node',
    },
    {
      displayName: 'stylelint',
      runner: 'jest-runner-stylelint',
      testMatch: [
        '<rootDir>/packages/*/src/**/*.css',
        '<rootDir>/packages/*/styles/**/*.css',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/packages/golden-layout/*',
        '<rootDir>/packages/components/styles/bootstrap.css',
        '<rootDir>/packages/[^/]+/dist/',
      ],
      moduleFileExtensions: ['css'],
      testEnvironment: 'node',
    },
  ],
});
