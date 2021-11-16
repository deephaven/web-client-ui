module.exports = {
  projects: [
    {
      displayName: 'eslint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['<rootDir>/packages/golden-layout/*'],
    },
    {
      displayName: 'stylelint',
      runner: 'jest-runner-stylelint',
      testMatch: ['<rootDir>/packages/*/src/**/*.scss'],
      testPathIgnorePatterns: ['<rootDir>/packages/golden-layout/*'],
      moduleFileExtensions: ['scss'],
    },
    '<rootDir>/packages/*/jest.config.cjs',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.{js,ts,jsx,tsx}'], // This is relative to individual project root due to how Jest handles it
  coverageReporters: ['text'],
  coverageThreshold: {
    // These global thresholds were taken as the baseline of the overall project when code coverage initiative began.
    // In CI, these thresholds will be measures against only the files you have changed.
    // We may want to increase/decrease the thresholds for specific projects, and we can do that:
    // https://jestjs.io/docs/configuration#coveragethreshold-object
    global: {
      statements: 40,
      branches: 30,
      functions: 30,
      lines: 40,
    },
  },
};
