const path = require('path');

// List of node_modules that need to be transformed from ESM to CJS for jest to work
const nodeModulesToTransform = [
  // monaco
  'monaco-editor',
  // plotly.js dependencies
  'd3-interpolate',
  'd3-color',
  // react-markdown and its dependencies
  'react-markdown',
  'vfile',
  'vfile-message',
  'unist-util.*',
  'unified',
  'bail',
  'is-plain-obj',
  'trough',
  'remark.*',
  'mdast-util.*',
  'micromark.*',
  'decode-named-character-reference',
  'trim-lines',
  'property-information',
  'hast-util.*',
  '.*separated-tokens',
  'ccount',
  'devlop',
  'escape-string-regexp',
  'markdown-table',
  'zwitch',
  'longest-streak',
  'rehype.*',
  'web-namespaces',
  'hastscript',
  'nanoid',
  '@astral-sh/ruff-wasm-web',
];

module.exports = {
  transform: {
    '.(ts|tsx|js|jsx)': [
      'babel-jest',
      {
        rootMode: 'upward',
        plugins: ['@deephaven/babel-preset/mockCssImportPlugin'],
      },
    ],
  },
  // Makes Jest transform some node_modules when needed. Usually because they are pure ESM and Jest needs CJS
  // By default, Jest ignores transforming node_modules
  // When switching to transform all of node_modules, it caused a babel error
  transformIgnorePatterns: [
    `node_modules/(?!(${nodeModulesToTransform.join('|')})/)`,
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      path.join(__dirname, './__mocks__/fileMock.js'),
    '^fira$': 'identity-obj-proxy',
    '^monaco-editor$': path.join(
      __dirname,
      'node_modules',
      'monaco-editor/esm/vs/editor/editor.api.js'
    ),
    // Handle monaco worker files
    '\\.worker.*$': 'identity-obj-proxy',
    // Handle pouchdb modules
    '^pouchdb-browser$': path.join(
      __dirname,
      './packages/mocks/src/pouchdb-browser.js'
    ),
    '^pouchdb-find': 'identity-obj-proxy',
    // All packages except icons and jsapi-types use src code
    '^@deephaven/(?!icons|jsapi-types)(.*)$': path.join(
      __dirname,
      './packages/$1/src'
    ),
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.ts')],
};
