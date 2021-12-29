module.exports = api => ({
  presets: [
    [
      '@babel/preset-env',
      {
        // Setting false will NOT convert ES6 to CJS modules
        // Test env must set to auto since Jest ESM support is experimental
        modules: api.env('test') ? 'auto' : false,
        targets: api.env('test')
          ? undefined
          : {
              esmodules: true,
            },
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
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
});
