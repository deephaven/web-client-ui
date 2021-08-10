module.exports = {
  projects: [
    '<rootDir>/packages/*/jest.config.js',
    {
      displayName: 'eslint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
    },
    {
      displayName: 'stylelint',
      runner: 'jest-runner-stylelint',
      testMatch: ['<rootDir>/packages/*/src/**/*.scss'],
      moduleFileExtensions: ['scss'],
    },
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage/', // This is relative to monorepo root
  collectCoverageFrom: ['./src/**/*.{js,ts,jsx,tsx}'], // This is relative to individual project root due to how Jest handles it
};
