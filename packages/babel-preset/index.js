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
});
