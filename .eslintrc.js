const buildPackageManifest = require('./packageManifest');

const { packageNames, packageManifest } = buildPackageManifest();

module.exports = {
  root: true,
  extends: ['@deephaven/eslint-config'],
  ignorePatterns: ['packages/golden-layout/*', 'jest.config.js'],
  overrides: [
    ...packageNames.map(packageName => ({
      files: [`packages/${packageManifest.get(packageName)}/**/*.@(ts|tsx)`],
      parserOptions: {
        project: ['./tsconfig.eslint.json', './packages/**/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'no-restricted-imports': [
          'error',
          {
            name: packageName,
            message: 'Forbid importing from owning @deephaven package.',
          },
          {
            name: '@adobe/react-spectrum',
            message: 'forbid importing from @adobe/react-spectrum.',
          },
        ],
      },
    })),
    {
      files: [
        'packages/components/src/spectrum/**/*.@(ts|tsx)',
        'packages/components/src/theme/**/*.@(ts|tsx)',
      ],
      parserOptions: {
        project: ['./tsconfig.eslint.json', './packages/**/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'packageName',
                message: 'forbid importing from owning deephaven package.',
              },
            ],
          },
        ],
      },
    },
  ],
};
