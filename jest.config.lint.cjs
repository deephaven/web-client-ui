module.exports = {
  watchPlugins: ['jest-runner-eslint/watch-fix'],
  projects: [
    {
      displayName: 'eslint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['<rootDir>/packages/golden-layout/*'],
      testEnvironment: 'node',
    },
    {
      displayName: 'stylelint',
      runner: 'jest-runner-stylelint',
      testMatch: [
        '<rootDir>/packages/*/src/**/*.css',
        '<rootDir>/packages/*/src/**/*.scss',
        '<rootDir>/packages/*/scss/**/*.scss',
      ],
      testPathIgnorePatterns: ['<rootDir>/packages/golden-layout/*'],
      moduleFileExtensions: ['css', 'scss'],
      testEnvironment: 'node',
    },
  ],
};
