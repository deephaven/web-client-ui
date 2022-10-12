module.exports = {
  root: true,
  extends: ['@deephaven/eslint-config'],
  ignorePatterns: ['packages/golden-layout/*', 'jest.config.*'],
  overrides: [
    {
      files: ['**/*.@(ts|tsx)'],
      parserOptions: {
        project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
