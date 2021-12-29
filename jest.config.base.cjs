const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  transform: {
    '.(ts|tsx|js|jsx)': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.join(
      __dirname,
      './__mocks__/fileMock.js'
    ),
    '^monaco-editor/esm/vs/editor/editor.api.js$': path.join(
      __dirname,
      './__mocks__/monaco-editor.js'
    ),
    '^monaco-editor/esm/vs/editor/(.*)': path.join(
      __dirname,
      './__mocks__/monaco-editor-empty.js'
    ),
    '^@deephaven/golden-layout$': path.join(
      __dirname,
      './packages/golden-layout/dist/goldenlayout.js'
    ),
    '^@deephaven/icons$': path.join(
      __dirname,
      './packages/icons/dist/index.js'
    ),
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: __dirname }),
  },
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.js')],
};
