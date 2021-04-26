module.exports = {
  presets: ['@deephaven/babel-preset'],
  ignore: [
    /\.test.(tsx?|jsx?)$/,
    /\.stories.(tsx?|jsx?|mdx?)$/,
    '**/__mocks__/*',
    '**/*.scss',
  ],
};
