const path = require('path');

module.exports = {
  transform: {
    '.(ts|tsx|js|jsx)': ['babel-jest', { rootMode: 'upward' }],
  },
  // Makes jest transform monaco, but continue ignoring other node_modules. Used for MonacoUtils test
  transformIgnorePatterns: ['node_modules/(?!(monaco-editor)/)'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.join(
      __dirname,
      './__mocks__/fileMock.js'
    ),
    '^monaco-editor$': path.join(
      __dirname,
      'node_modules',
      'monaco-editor/esm/vs/editor/editor.api.js'
    ),
    // Handle monaco worker files
    '\\.worker.*$': 'identity-obj-proxy',
    '^@deephaven/icons$': path.join(
      __dirname,
      './packages/icons/dist/index.js'
    ),
    '^@deephaven/(.*)$': path.join(__dirname, './packages/$1/src'),
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.ts')],
};
