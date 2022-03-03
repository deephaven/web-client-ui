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
    plugins: [
      api.env('test') ? false : ['babel-plugin-add-import-extension'],
      [
        'transform-rename-import',
        {
          // The babel-plugin-add-import-extension adds the .js to .scss imports, just convert them back to .css
          original: '^(.+?)\\.s?css.js$',
          replacement: '$1.css',
        },
      ],
    ].filter(Boolean),
  };
};
