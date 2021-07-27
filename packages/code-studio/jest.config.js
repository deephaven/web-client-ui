const baseConfig = require('../../jest.config.base');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  resetMocks: false,
  displayName: packageJson.name,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^monaco-editor/esm/vs/editor/editor.api$':
      '<rootDir>/src/__mocks__/monaco-editor.js',
    '^monaco-editor/esm/vs/editor/(.*)':
      '<rootDir>/src/__mocks__/monaco-editor-empty.js',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};
