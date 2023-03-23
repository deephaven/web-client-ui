module.exports = {
  env: {
    browser: true,
    jest: true,
    es6: true,
  },
  extends: ['react-app', 'airbnb', 'plugin:react/recommended', 'prettier'],
  plugins: [
    'es',
    'prettier',
    'react',
    'react-hooks',
    'import',
    'react-refresh',
  ],
  rules: {
    'prettier/prettier': ['error'],
    'react/forbid-prop-types': 'off',
    'react/jsx-curly-newline': 'off',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.tsx'] }],
    'react/sort-comp': [
      2,
      {
        order: [
          'static-variables',
          'static-methods',
          'lifecycle',
          'everything-else',
          'render',
        ],
      },
    ],
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/mouse-events-have-key-events': 'off',
    'import/no-unresolved': [
      'error',
      {
        ignore: ['monaco-editor'],
      },
    ],
    'import/no-named-as-default': 'off',
    'import/extensions': 'off',
    'es/no-regexp-lookbehind-assertions': 'error',
    curly: ['error'],
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
    'react/no-unused-class-component-methods': 'off',
    'react/default-props-match-prop-types': 'off',
    'react/require-default-props': 'off',
    'react/jsx-no-bind': 'off',
    'react-refresh/only-export-components': 'warn',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  settings: {
    'import/external-module-folders': ['node_modules', 'packages'],
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['**/*.@(ts|tsx)'],
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'default-case': 'off', // Typescript checks for exhaustive switch/case and doesn't require a default
        'consistent-return': 'off', // JS rule which complains if you don't have a default case
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'error',
        'no-useless-constructor': 'off',
        'react/static-property-placement': ['error', 'static public field'],
        '@typescript-eslint/strict-boolean-expressions': ['error'],
        'default-param-last': 'off',
        '@typescript-eslint/default-param-last': ['error'],
      },
    },
    {
      files: ['**/*.test.@(js|jsx|ts|tsx)'],
      plugins: ['@typescript-eslint'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
