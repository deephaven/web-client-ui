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
    ...packageNames.map(packageName => ({
      files: [`packages/${packageManifest.get(packageName)}/**/*.@(ts|tsx)`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            name: packageName,
            message: 'Forbid importing from owning @deephaven package.',
          },
          {
            name: '@adobe/react-spectrum',
            message:
              'Import from @deephaven/components instead of @adobe/react-spectrum.',
          },
        ],
      },
      overrides: [
        {
          files: [
            'packages/components/src/spectrum/**/*.@(ts|tsx)',
            'packages/components/src/theme/**/*.@(ts|tsx)',
          ],
          rules: {
            'no-restricted-imports': [
              'error',
              {
                name: packageName,
                message: 'Forbid importing from owning @deephaven package.',
              },
            ],
          },
        },
      ],
    })),
  ],
};
