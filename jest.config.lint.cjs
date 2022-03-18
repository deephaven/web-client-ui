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
  ],
};
