module.exports = api => ({
  presets: [
    [
      '@babel/preset-env',
      {
        // Setting false will NOT convert ES6 to CJS modules
        // Test env must set to auto since Jest ESM support is experimental
        modules: api.env('test') ? 'auto' : false,
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      'transform-rename-import',
      {
        original: '^(.+?)\\.scss$',
        replacement: '$1.css',
      },
    ],
    '@babel/plugin-proposal-class-properties',
    ["babel-plugin-add-import-extension", { extension: "js", replace: true, observedScriptExtensions: ['js','ts','jsx','tsx'] }],
  ],
});
