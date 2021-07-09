import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

const CONSOLE = {
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
    macShortcut: [MODIFIER.CTRL, MODIFIER.OPTION, KEY.H], // cmd+H is a system level shortcut on Mac, so use something else
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

const SHORTCUTS = {
  CONSOLE,
  COMMAND_HISTORY,
};

export default SHORTCUTS;
