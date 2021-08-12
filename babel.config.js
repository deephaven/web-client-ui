module.exports = api => {
  const isTest = api.env('test');
  return {
    presets: ['@deephaven/babel-preset'],
    babelrcRoots: ['.', 'packages/*'],
    ignore: [
      !isTest ? /\.test.(tsx?|jsx?)$/ : false,
      !isTest ? '**/__mocks__/*' : false,
      /\.stories.(tsx?|jsx?|mdx?)$/,
      '**/*.scss',
    ].filter(Boolean),
  };
};
