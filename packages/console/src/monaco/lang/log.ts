/* eslint no-useless-escape: "off" */

const id = 'log';

const conf = {};

const language = {
  tokenizer: {
    root: [
      [/ FATAL[\s\S]*/, { token: 'error', next: '@error' }],
      [/ ERROR[\s\S]*/, { token: 'error', next: '@error' }],
      [/ STDERR[\s\S]*/, { token: 'error', next: '@error' }],
      [/ STDOUT.*/, { token: 'stdout', next: '@stdout' }],
      [/ INFO[\s\S]*/, { token: 'info', next: '@info' }],
      [/ WARN.*/, { token: 'warn', next: '@warn' }],
      [/ TRACE[\s\S]*/, { token: 'trace', next: '@trace' }],
      [/ DEBUG[.\s\S]*/, { token: 'debug', next: '@debug' }],
      [/^\d{2}:\d{2}:\d{2}.\d{3}/, 'date'],
    ],
    error: [{ include: '@body' }],
    info: [{ include: '@body' }],
    warn: [{ include: '@body' }],
    stdout: [{ include: '@body' }],
    trace: [{ include: '@body' }],
    debug: [{ include: '@body' }],
    body: [
      [/^\d{2}:\d{2}:\d{2}.\d{3}/, { token: 'date', next: '@pop' }],
      [/[\s\S]*/, { token: '$S0' }],
    ],
  },
};

export default { id, conf, language };
