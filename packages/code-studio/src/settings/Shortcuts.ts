import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

const CODE_STUDIO = {
  name: 'Code Studio',
  RESTART_CONSOLE: ShortcutRegistry.createAndAdd({
    id: 'CODE_STUDIO.RESTART_CONSOLE',
    name: 'Restart Console',
    shortcut: [MODIFIER.CTRL, KEY.D],
    macShortcut: [MODIFIER.CMD, KEY.D],
  }),
  DISCONNECT_CONSOLE: ShortcutRegistry.createAndAdd({
    id: 'CODE_STUDIO.DISCONNECT_CONSOLE',
    name: 'Disconnect Console',
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.D],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.D],
  }),
};

const NOTEBOOK = {
  name: 'Notebook',
  RUN: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.RUN',
    name: 'Run',
    shortcut: [MODIFIER.ALT, KEY.R],
    macShortcut: [MODIFIER.OPTION, KEY.R],
  }),
  RUN_SELECTED: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.RUN_SELECTED',
    name: 'Run Selected',
    shortcut: [MODIFIER.ALT, MODIFIER.SHIFT, KEY.R],
    macShortcut: [MODIFIER.OPTION, MODIFIER.SHIFT, KEY.R],
  }),
  FIND: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.FIND',
    name: 'Find',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
    isEditable: false,
  }),
};

const CONSOLE = {
  name: 'Console',
  CLEAR: ShortcutRegistry.createAndAdd({
    id: 'CONSOLE.CLEAR',
    name: 'Clear',
    shortcut: [MODIFIER.CTRL, KEY.L],
    macShortcut: [MODIFIER.CTRL, KEY.C],
  }),
  FOCUS_HISTORY: ShortcutRegistry.createAndAdd({
    id: 'CONSOLE.FOCUS_HISTORY',
    name: 'Focus History',
    shortcut: [MODIFIER.CTRL, KEY.H],
    macShortcut: [MODIFIER.CTRL, MODIFIER.OPTION, KEY.H],
  }),
};

const COMMAND_HISTORY = {
  name: 'Command History',
  FOCUS_SEARCH: ShortcutRegistry.createAndAdd({
    id: 'COMMAND_HISTORY.FOCUS_SEARCH',
    name: 'Focus Search',
    shortcut: [MODIFIER.CTRL, KEY.H],
    macShortcut: [MODIFIER.CTRL, MODIFIER.OPTION, KEY.H],
  }),
  SEND_TO_CONSOLE: ShortcutRegistry.createAndAdd({
    id: 'COMMAND_HISTORY.SEND_TO_CONSOLE',
    name: 'Send to Console',
    shortcut: [KEY.ENTER],
    macShortcut: [KEY.ENTER],
  }),
  SEND_TO_NOTEBOOK: ShortcutRegistry.createAndAdd({
    id: 'COMMAND_HISTORY.SEND_TO_NOTEBOOK',
    name: 'Send to Notebook',
    shortcut: [MODIFIER.CTRL, KEY.ENTER],
    macShortcut: [MODIFIER.CMD, KEY.ENTER],
  }),
  RUN: ShortcutRegistry.createAndAdd({
    id: 'COMMAND_HISTORY.RUN',
    name: 'Run',
    shortcut: [MODIFIER.ALT, KEY.R],
    macShortcut: [MODIFIER.OPTION, KEY.R],
  }),
};

const FILE_EXPLORER = {
  name: 'File Explorer',
  DELETE: ShortcutRegistry.createAndAdd({
    id: 'FILE_EXPLORER.DELETE',
    name: 'Delete',
    shortcut: [KEY.DELETE],
    macShortcut: [MODIFIER.CMD, KEY.BACKSPACE],
  }),
  RENAME: ShortcutRegistry.createAndAdd({
    id: 'FILE_EXPLORER.RENAME',
    name: 'Rename',
    shortcut: [KEY.ENTER],
    macShortcut: [KEY.ENTER],
  }),
};

const CHART = { name: 'Chart' };

const TABLE = {
  name: 'Table',
  TOGGLE_QUICK_FILTER: ShortcutRegistry.createAndAdd({
    id: 'TABLE.TOGGLE_QUICK_FILTER',
    name: 'Toggle Quick Filter',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
  }),
  CLEAR_FILTERS: ShortcutRegistry.createAndAdd({
    id: 'TABLE.CLEAR_FILTERS',
    name: 'Clear Filters',
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.E],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.E],
  }),
  REVERSE: ShortcutRegistry.createAndAdd({
    id: 'TABLE.REVERSE',
    name: 'Reverse',
    shortcut: [MODIFIER.CTRL, KEY.I],
    macShortcut: [MODIFIER.CMD, KEY.I],
  }),
  TOGGLE_SEARCH: ShortcutRegistry.createAndAdd({
    id: 'TABLE.TOGGLE_SEARCH',
    name: 'Toggle Search',
    shortcut: [MODIFIER.CTRL, KEY.S],
    macShortcut: [MODIFIER.CMD, KEY.S],
  }),
};

const GLOBAL = {
  name: 'Global',
  COPY: ShortcutRegistry.createAndAdd({
    id: 'COPY',
    name: 'Copy',
    shortcut: [MODIFIER.CTRL, KEY.C],
    macShortcut: [MODIFIER.CMD, KEY.C],
    isEditable: false,
  }),
  PASTE: ShortcutRegistry.createAndAdd({
    id: 'PASTE',
    name: 'Paste',
    shortcut: [MODIFIER.CTRL, KEY.V],
    macShortcut: [MODIFIER.CMD, KEY.V],
    isEditable: false,
  }),
  SAVE: ShortcutRegistry.createAndAdd({
    id: 'SAVE',
    name: 'Save',
    shortcut: [MODIFIER.CTRL, KEY.S],
    macShortcut: [MODIFIER.CMD, KEY.S],
    isEditable: false,
  }),
  SELECT_ALL: ShortcutRegistry.createAndAdd({
    id: 'SELECT_ALL',
    name: 'Select All',
    shortcut: [MODIFIER.CTRL, KEY.A],
    macShortcut: [MODIFIER.CMD, KEY.A],
    isEditable: false,
  }),
};

const SHORTCUTS = {
  CODE_STUDIO,
  NOTEBOOK,
  CONSOLE,
  COMMAND_HISTORY,
  FILE_EXPLORER,
  CHART,
  TABLE,
  GLOBAL,
};

export default SHORTCUTS;
