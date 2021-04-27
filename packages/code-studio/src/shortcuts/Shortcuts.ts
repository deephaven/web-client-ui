import Shortcut, { KEY, MODIFIER } from './Shortcut';

const CODE_STUDIO = {
  RESTART_CONSOLE: new Shortcut({
    id: 'CODE_STUDIO.RESTART_CONSOLE',
    name: 'Restart Console',
    shortcut: [MODIFIER.CTRL, KEY.D],
    macShortcut: [MODIFIER.CMD, KEY.D],
  }),
  DISCONNECT_CONSOLE: new Shortcut({
    id: 'CODE_STUDIO.DISCONNECT_CONSOLE',
    name: 'Disconnect Console',
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.D],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.D],
  }),
};

const DASHBOARD = {};

const QUERY_MONITOR = {};

const NOTEBOOK = {
  RUN: new Shortcut({
    id: 'NOTEBOOK.RUN',
    name: 'Run',
    shortcut: [MODIFIER.ALT, KEY.R],
    macShortcut: [MODIFIER.OPTION, KEY.R],
  }),
  RUN_SELECTED: new Shortcut({
    id: 'NOTEBOOK.RUN_SELECTED',
    name: 'Run Selected',
    shortcut: [MODIFIER.ALT, MODIFIER.SHIFT, KEY.R],
    macShortcut: [MODIFIER.OPTION, MODIFIER.SHIFT, KEY.R],
  }),
  FIND: new Shortcut({
    id: 'NOTEBOOK.FIND',
    name: 'Find',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
  }),
};

const CONSOLE = {
  CLEAR: new Shortcut({
    id: 'CONSOLE.CLEAR',
    name: 'Clear',
    shortcut: [MODIFIER.CTRL, KEY.L],
    macShortcut: [MODIFIER.CTRL, KEY.C],
  }),
  FOCUS_HISTORY: new Shortcut({
    id: 'CONSOLE.FOCUS_HISTORY',
    name: 'Focus History',
    shortcut: [MODIFIER.CTRL, KEY.H],
    macShortcut: [MODIFIER.CTRL, MODIFIER.OPTION, KEY.H],
  }),
};

const COMMAND_HISTORY = {
  FOCUS_SEARCH: new Shortcut({
    id: 'COMMAND_HISTORY.FOCUS_SEARCH',
    name: 'Focus Search',
    shortcut: [MODIFIER.CTRL, KEY.H],
    macShortcut: [MODIFIER.CTRL, MODIFIER.OPTION, KEY.H],
  }),
  SEND_TO_CONSOLE: new Shortcut({
    id: 'COMMAND_HISTORY.SEND_TO_CONSOLE',
    name: 'Send to Console',
    shortcut: [KEY.ENTER],
    macShortcut: [KEY.ENTER],
  }),
  SEND_TO_NOTEBOOK: new Shortcut({
    id: 'COMMAND_HISTORY.SEND_TO_NOTEBOOK',
    name: 'Send to Notebook',
    shortcut: [MODIFIER.CTRL, KEY.ENTER],
    macShortcut: [MODIFIER.CMD, KEY.ENTER],
  }),
  RUN: new Shortcut({
    id: 'COMMAND_HISTORY.RUN',
    name: 'Run',
    shortcut: [MODIFIER.ALT, KEY.R],
    macShortcut: [MODIFIER.OPTION, KEY.R],
  }),
};

const FILE_EXPLORER = {
  DELETE: new Shortcut({
    id: 'FILE_EXPLORER.DELETE',
    name: 'Delete',
    shortcut: [MODIFIER.CTRL, KEY.BACKSPACE],
    macShortcut: [MODIFIER.CMD, KEY.BACKSPACE],
  }),
  RENAME: new Shortcut({
    id: 'FILE_EXPLORER.RENAME',
    name: 'Rename',
    shortcut: [KEY.ENTER],
    macShortcut: [KEY.ENTER],
  }),
};

const CHART = {};

const TABLE = {
  TOGGLE_QUICK_FILTER: new Shortcut({
    id: 'TABLE.TOGGLE_QUICK_FILTER',
    name: 'Toggle Quick Filter',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
  }),
  CLEAR_FILTERS: new Shortcut({
    id: 'TABLE.CLEAR_FILTERS',
    name: 'Clear Filters',
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.E],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.E],
  }),
  REVERSE: new Shortcut({
    id: 'TABLE.REVERSE',
    name: 'Reverse',
    shortcut: [MODIFIER.CTRL, KEY.I],
    macShortcut: [MODIFIER.CMD, KEY.I],
  }),
  TOGGLE_SEARCH: new Shortcut({
    id: 'TABLE.TOGGLE_SEARCH',
    name: 'Toggle Search',
    shortcut: [MODIFIER.CTRL, KEY.S],
    macShortcut: [MODIFIER.CMD, KEY.S],
  }),
};

const GLOBAL = {
  COPY: new Shortcut({
    id: 'COPY',
    name: 'Copy',
    shortcut: [MODIFIER.CTRL, KEY.C],
    macShortcut: [MODIFIER.CMD, KEY.C],
  }),
  PASTE: new Shortcut({
    id: 'PASTE',
    name: 'Paste',
    shortcut: [MODIFIER.CTRL, KEY.V],
    macShortcut: [MODIFIER.CMD, KEY.V],
  }),
  SAVE: new Shortcut({
    id: 'SAVE',
    name: 'Save',
    shortcut: [MODIFIER.CTRL, KEY.S],
    macShortcut: [MODIFIER.CMD, KEY.S],
  }),
  SELECT_ALL: new Shortcut({
    id: 'SELECT_ALL',
    name: 'Select All',
    shortcut: [MODIFIER.CTRL, KEY.A],
    macShortcut: [MODIFIER.CMD, KEY.A],
  }),
};

const SHORTCUTS = {
  GLOBAL,
  CODE_STUDIO,
  DASHBOARD,
  QUERY_MONITOR,
  NOTEBOOK,
  CONSOLE,
  COMMAND_HISTORY,
  FILE_EXPLORER,
  CHART,
  TABLE,
};

export default SHORTCUTS;
