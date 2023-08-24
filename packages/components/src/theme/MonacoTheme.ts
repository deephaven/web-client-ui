import type { editor } from 'monaco-editor';

const MonacoTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: '--spectrum-gray-900' },
    { token: 'string', foreground: '--spectrum-yellow-visual-color' },
    {
      token: 'string.delim',
      foreground: '--spectrum-gray-700',
    },
    { token: 'keyword', foreground: '--spectrum-cyan-visual-color' },
    {
      token: 'identifier.js',
      foreground: '--spectrum-yellow-visual-color',
    },
    {
      token: 'delimiter',
      foreground: '--spectrum-gray-700',
    },
    { token: 'comment', foreground: '--spectrum-gray-700' },
    { token: 'number', foreground: '--spectrum-purple-visual-color' },
    { token: 'storage', foreground: '--spectrum-red-visual-color' },
    {
      token: 'identifier',
      foreground: '--spectrum-gray-900',
    },
    {
      token: 'namespace.identifier',
      foreground: '--spectrum-red-visual-color',
    },
    { token: 'operator', foreground: '--spectrum-red-visual-color' },
    {
      token: 'predefined',
      foreground: '--spectrum-green-visual-color',
    },
    {
      token: 'error.log',
      foreground: '--spectrum-red-visual-color',
    },
    {
      token: 'warn.log',
      foreground: '--spectrum-yellow-visual-color',
    },
    {
      token: 'info.log',
      foreground: '--spectrum-cyan-visual-color',
    },
    {
      token: 'stdout.log',
      foreground: '--spectrum-gray-900',
    },
    {
      token: 'trace.log',
      foreground: '--spectrum-green-visual-color',
    },
    {
      token: 'debug.log',
      foreground: '--spectrum-purple-visual-color',
    },
    {
      token: 'date.log',
      foreground: '--spectrum-gray-700',
    },
  ],
  colors: {
    errorForeground: '--spectrum-red-visual-color',
    'inputOption.activeBorder': '--spectrum-alias-focus-ring-color',
    'editor.background': '--spectrum-gray-100',
    'editor.foreground': '--spectrum-gray-900',
    'editor.lineHighlightBackground': '--spectrum-gray-200',
    'editorLineNumber.foreground': '--spectrum-gray-700',
    'editor.selectionBackground': '--spectrum-alias-text-highlight-color',
    'editor.inactiveSelectionBackground': '--spectrum-gray-300',
    'editor.findMatchBackground': '--spectrum-alias-highlight-selected',
    'editor.findMatchHighlightBackground':
      '--spectrum-alias-highlight-selected-hover',
    'editorSuggestWidget.background': '--spectrum-gray-200',
    'editorSuggestWidget.border': '--spectrum-gray-400',
    'editorSuggestWidget.foreground': '--spectrum-gray-100',
    'editorSuggestWidget.selectedBackground':
      '--spectrum-alias-highlight-selected',
    'editorSuggestWidget.highlightForeground': '--spectrum-accent-color-700',
    'list.hoverBackground': '--spectrum-alias-highlight-hover',
    'dropdown.background': '--spectrum-gray-300',
    'dropdown.foreground': '--spectrum-gray-900',
    'menu.selectionBackground': '--spectrum-alias-highlight-hover',
    'list.focusBackground': '--spectrum-alias-highlight-hover',
    'editorWidget.background': '--spectrum-gray-200',
    'inputOption.activeBackground': '--spectrum-accent-color-700',
    'inputOption.activeForeground': '--spectrum-gray-900',
    focuBorder: '--spectrum-alias-border-color-focus',
    'input.background': '--spectrum-gray-50',
    'input.foreground': '--spectrum-alias-text-color',
    'input.border': '--spectrum-alias-border-color',
    'textLink.foreground': '--spectrum-accent-color-1000',
    'textLink.activeForeground': '--spectrum-accent-color-1100',
    'editorLink.activeForeground': '--spectrum-accent-color-1100',
  },
};

export default MonacoTheme;
