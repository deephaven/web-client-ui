module.exports = api => {
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        { include: ['@babel/plugin-proposal-class-properties'] },
      ],
      '@babel/preset-react',
      ['@babel/preset-typescript', { allowDeclareFields: true }],
    ],
    env: {
      production: {
        presets: ['minify'],
      },
    },
  };
};
