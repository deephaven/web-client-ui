const path = require('path');

module.exports = {
  transform: {
    '.(ts|tsx|js|jsx)': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.resolve(
      './__mocks__/fileMock.js'
    ),
    '^monaco-editor/esm/vs/editor/editor.api$': path.resolve(
      './__mocks__/monaco-editor.js'
    ),
    '^monaco-editor/esm/vs/editor/(.*)': path.resolve(
      './__mocks__/monaco-editor-empty.js'
    ),
  },
  setupFilesAfterEnv: [path.resolve('./jest.setup.js')],
};
