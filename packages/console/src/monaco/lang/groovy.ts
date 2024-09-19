import type * as monaco from 'monaco-editor';
import { type Language } from './Language';

const id = 'groovy';

const conf: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  onEnterRules: [
    {
      beforeText:
        /^\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async).*?:\s*$/,
      action: { indentAction: 1 }, // see monaco.languages.IndentAction.Indent
    },
  ],
  folding: {
    offSide: true,
    markers: {
      start: /^\s*#region\b/,
      end: /^\s*#endregion\b/,
    },
  },
};

const language: monaco.languages.IMonarchLanguage = {
  // Set defaultToken to invalid to see what you do not tokenize yet
  // defaultToken: 'invalid',

  keywords: [
    'and',
    'del',
    'from',
    'not',
    'while',
    'as',
    'elif',
    'global',
    'or',
    'with',
    'assert',
    'else',
    'if',
    'pass',
    'yield',
    'break',
    'except',
    'import',
    'print',
    'println',
    'class',
    'exec',
    'in',
    'raise',
    'continue',
    'finally',
    'is',
    'return',
    'def',
    'for',
    'lambda',
    'try',
    ':',
    '=',
    'isinstance',
    '__debug__',
  ],

  operators: [
    '+',
    '-',
    '*',
    '**',
    '/',
    '//',
    '%',
    '<<',
    '>>',
    '&',
    '|',
    '^',
    '~',
    '<',
    '>',
    '<=',
    '>=',
    '==',
    '!=',
    '<>',
    '+=',
    '-=',
    '*=',
    '/',
    '//=',
    '%=',
    '&=',
    '|=',
    '^=',
    '>>=',
    '<<=',
    '**=',
  ],

  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],

  // operator symbols
  symbols: /[=><!~&|+\-*/^%]+/,
  delimiters: /[;=.@:,`]/,

  // strings
  escapes:
    /\\(?:[abfnrtv\\"'\n\r]|x[0-9A-Fa-f]{2}|[0-7]{3}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8}|N\{\w+\})/,
  rawpre: /(?:[rR]|ur|Ur|uR|UR|br|Br|bR|BR)/,
  strpre: /(?:[buBU])/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // strings: need to check first due to the prefix
      [
        /@strpre?("""|''')/,
        { token: 'string.delim', bracket: '@open', next: '@mstring.$1' },
      ],
      [/@strpre?"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [/@strpre?'([^'\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [
        /@strpre?(["])/,
        {
          token: 'string.delim',
          bracket: '@open',
          next: '@sstring.$1',
          nextEmbedded: 'deephavenDb',
        },
      ],
      [
        /@strpre?(["'])/,
        { token: 'string.delim', bracket: '@open', next: '@string.$1' },
      ],

      [
        /@rawpre("""|''')/,
        { token: 'string.delim', bracket: '@open', next: '@mrawstring.$1' },
      ],
      [/@rawpre"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [/@rawpre'([^'\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [
        /@rawpre(["'])/,
        { token: 'string.delim', bracket: '@open', next: '@rawstring.$1' },
      ],

      // identifiers and keywords
      [/__[\w$]*/, 'predefined'],
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [
        /[A-Z][\w]*/,
        {
          cases: {
            '~[A-Z0-9_]+': 'constructor.identifier',
            '@default': 'namespace.identifier',
          },
        },
      ], // to show class names nicely

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@keywords': 'keyword',
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+[lL]?/, 'number.hex'],
      [/0[bB][0-1]+[lL]?/, 'number.binary'],
      [/(0[oO][0-7]+|0[0-7]+)[lL]?/, 'number.octal'],
      [/(0|[1-9]\d*)[lL]?/, 'number'],

      // delimiter: after number because of .\d floats
      [':', { token: 'keyword', bracket: '@open' }], // bracket for indentation
      [
        /@delimiters/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'delimiter',
          },
        },
      ],
    ],

    // Regular strings
    mstring: [
      { include: '@strcontent' },
      [
        /"""|'''/,
        {
          cases: {
            '$#==$S2': {
              token: 'string.delim',
              bracket: '@close',
              next: '@pop',
            },
            '@default': { token: 'string' },
          },
        },
      ],
      [/["']/, 'string'],
      [/./, 'string.invalid'],
    ],

    sstring: [
      { include: '@strcontent' },
      [
        /["]/,
        {
          token: 'string.delim',
          bracket: '@close',
          next: '@pop',
          nextEmbedded: '@pop',
        },
      ],
      [/./, 'string.invalid'],
    ],

    string: [
      { include: '@strcontent' },
      [/[']/, { token: 'string.delim', bracket: '@close', next: '@pop' }],
      [/./, 'string.invalid'],
    ],

    strcontent: [
      [/[^\\"']+/, 'string'],
      [/\\$/, 'string.escape'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
    ],

    // Raw strings: we distinguish them to color escape sequences correctly
    mrawstring: [
      { include: '@rawstrcontent' },
      [
        /"""|'''/,
        {
          cases: {
            '$#==$S2': {
              token: 'string.delim',
              bracket: '@close',
              next: '@pop',
            },
            '@default': { token: 'string' },
          },
        },
      ],
      [/["']/, 'string'],
      [/./, 'string.invalid'],
    ],

    rawstring: [
      { include: '@rawstrcontent' },
      [
        /["']/,
        {
          cases: {
            '$#==$S2': {
              token: 'string.delim',
              bracket: '@close',
              next: '@pop',
            },
            '@default': { token: 'string' },
          },
        },
      ],
      [/./, 'string.invalid'],
    ],

    rawstrcontent: [
      [/[^\\"']+/, 'string'],
      [/\\["']/, 'string'],
      [/\\u[0-9A-Fa-f]{4}/, 'string.escape'],
      [/\\/, 'string'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*\*(?!\/)/, 'comment.doc', '@doccomment'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    doccomment: [
      [/[^/*]+/, 'comment.doc'],
      [/\*\//, 'comment.doc', '@pop'],
      [/[/*]/, 'comment.doc'],
    ],
  },
};

const lang: Language = { id, conf, language };
export default lang;
