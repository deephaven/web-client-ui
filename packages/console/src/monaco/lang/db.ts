import * as monaco from 'monaco-editor';
import { Language } from './Language';

/* eslint no-useless-escape: "off" */
const id = 'deephavenDb';

const conf: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
    blockComment: ["'''", "'''"],
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
      beforeText: /^\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async).*?:\s*$/,
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
  tokenPostfix: '.js',

  keywords: [
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'double',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'final',
    'finally',
    'float',
    'for',
    'function',
    'goto',
    'if',
    'implements',
    'import',
    'in',
    'instanceof',
    'int',
    'interface',
    'long',
    'native',
    'new',
    'null',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'static',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'volatile',
    'while',
    'with',
  ],

  builtins: ['define', 'require', 'window', 'document', 'undefined'],

  operators: [
    '=',
    '>',
    '<',
    '!',
    '~',
    '?',
    ':',
    '==',
    '<=',
    '>=',
    '!=',
    '&&',
    '||',
    '++',
    '--',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '^',
    '%',
    '<<',
    '>>',
    '>>>',
    '+=',
    '-=',
    '*=',
    '/=',
    '&=',
    '|=',
    '^=',
    '%=',
    '<<=',
    '>>=',
    '>>>=',
  ],

  // define our own brackets as '<' and '>' do not match in javascript
  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.bracket' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],

  // common regular expressions
  symbols: /[~!@#%\^&*-+=|\\:`<>.?\/]+/,
  escapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,
  exponent: /[eE][\-+]?[0-9]+/,

  regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
  regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

  tokenizer: {
    root: [
      // identifiers and keywords
      [
        /([a-zA-Z_\$][\w\$]*)(\s*)(:?)/,
        {
          cases: {
            '$1@keywords': ['keyword', 'white', 'delimiter'],
            $3: ['key.identifier', 'white', 'delimiter'], // followed by :
            '$1@builtins': ['predefined.identifier', 'white', 'delimiter'],
            '@default': ['identifier', 'white', 'delimiter'],
          },
        },
      ],

      // whitespace
      { include: '@whitespace' },

      // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
      [
        /\/(?=([^\\\/]|\\.)+\/)/,
        { token: 'regexp.slash', bracket: '@open', next: '@regexp' },
      ],

      // delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[;,.]/, 'delimiter'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],

      // numbers
      [/\d+\.\d*(@exponent)?/, 'number.float'],
      [/\.\d+(@exponent)?/, 'number.float'],
      [/\d+@exponent/, 'number.float'],
      [/0[xX][\da-fA-F]+/, 'number.hex'],
      [/0[0-7]+/, 'number.octal'],
      [/\d+/, 'number'],

      // strings: recover on non-terminated strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [/"/, 'string', '@string."'],
      [/'/, 'string', "@string.'"],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      // [/\/\*/, 'comment', '@push' ],    // nested comment not allowed :-(
      [/\/\*/, 'comment.invalid'],
      ['\\*/', 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    string: [
      [/[^\\"']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [
        /["']/,
        {
          cases: {
            '$#==$S2': { token: 'string', next: '@pop' },
            '@default': 'string',
          },
        },
      ],
    ],

    // We match regular expression quite precisely
    regexp: [
      [
        /(\{)(\d+(?:,\d*)?)(\})/,
        [
          '@brackets.regexp.escape.control',
          'regexp.escape.control',
          '@brackets.regexp.escape.control',
        ],
      ],
      [
        /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
        [
          { token: '@brackets.regexp.escape.control' },
          {
            token: 'regexp.escape.control',
            next: '@regexrange',
          },
        ],
      ],
      [
        /(\()(\?:|\?=|\?!)/,
        ['@brackets.regexp.escape.control', 'regexp.escape.control'],
      ],
      [/[()]/, '@brackets.regexp.escape.control'],
      [/@regexpctl/, 'regexp.escape.control'],
      [/[^\\\/]/, 'regexp'],
      [/@regexpesc/, 'regexp.escape'],
      [/\\\./, 'regexp.invalid'],
      ['/', { token: 'regexp.slash', bracket: '@close' }, '@pop'],
    ],

    regexrange: [
      [/-/, 'regexp.escape.control'],
      [/\^/, 'regexp.invalid'],
      [/@regexpesc/, 'regexp.escape'],
      [/[^\]]/, 'regexp'],
      [/\]/, '@brackets.regexp.escape.control', '@pop'],
    ],
  },
};

const lang: Language = { id, conf, language };
export default lang;
