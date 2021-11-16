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
  coverageDirectory: '<rootDir>/coverage/', // This is relative to monorepo root
  collectCoverageFrom: ['./src/**/*.{js,ts,jsx,tsx}'], // This is relative to individual project root due to how Jest handles it
  coverageThreshold: {
    // These global thresholds were taken as the baseline when code coverage initiative began. Should be increased over time.
    global: {
      statements: 40,
      branches: 80,
      functions: 30,
      lines: 40,
    },
  },
};
