module.exports = api => ({
  presets: [
    [
      '@babel/preset-env',
      {
        // Setting false will NOT convert ES6 to CJS modules
        // Test env must set to auto since Jest ESM support is experimental
        modules: api.env('test') ? 'auto' : false,
        targets: {
          esmodules: true,
        },
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['babel-plugin-add-import-extension'],
    [
      'transform-rename-import',
      {
        // The babel-plugin-add-import-extension adds the .js to .scss imports, just convert them back to .css
        original: '^(.+?)\\.scss.js$',
        replacement: '$1.css',
      },
    ],
  ],
});
