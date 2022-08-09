const path = require('path');

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
        include: ['@babel/plugin-proposal-class-properties'],
      },
    ],
    '@babel/preset-react',
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
  plugins: [
    api.env('test') ? false : ['babel-plugin-add-import-extension'],
    api.env('test')
      ? [
          // This is needed to replace import.meta w/ process in Jest
          // Jest does not play nicely w/ ESM and Vite uses import.meta
          // import.meta is only avaialable in ESM
          path.resolve(__dirname, 'importMetaEnvPlugin'),
        ]
      : false,
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
