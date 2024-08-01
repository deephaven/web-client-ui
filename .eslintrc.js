const buildPackageManifest = require('./packageManifest');

const { packageNames, packageManifest } = buildPackageManifest();

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
    // For each @deephaven package, forbid importing from itself
    ...packageNames.map(packageName => ({
      files: [`packages/${packageManifest.get(packageName)}/**/*.@(ts|tsx)`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: packageName,
                message: 'Forbid importing from owning @deephaven package.',
              },
            ],
          },
        ],
      },
    })),
    {
      files: ['**/*.@(ts|tsx)'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@adobe/react-spectrum',
                message: 'Forbid importing from @adobe/react-spectrum.',
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        'packages/components/src/theme/**/*.@(ts|tsx)',
        'packages/components/src/spectrum/**/*.@(ts|tsx)',
      ],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
