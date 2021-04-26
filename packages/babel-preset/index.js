module.exports = () => ({
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false, // This makes babel NOT convert ES6 to CJS modules
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
  ],
});
