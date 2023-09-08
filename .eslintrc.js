module.exports = {
  root: true,
  extends: ['@deephaven/eslint-config'],
  // The `deephaven` eslint plugin is defined in `packages/eslint-config/plugin`
  plugins: ['deephaven'],
  ignorePatterns: ['packages/golden-layout/*', 'jest.config.*'],
  overrides: [
    {
      files: ['**/*.@(ts|tsx)'],
      parserOptions: {
        project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'deephaven/no-self-package-import': 'error',
      },
    },
  ],
};
