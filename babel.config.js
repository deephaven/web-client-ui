module.exports = {
  presets: ['@deephaven/babel-preset'],
  babelrcRoots: 'packages/*',
  ignore: [
    /\.test.(tsx?|jsx?)$/,
    /\.stories.(tsx?|jsx?|mdx?)$/,
    '**/__mocks__/*',
    '**/*.scss',
  ],
};
