import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

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
    macShortcut: [MODIFIER.CTRL, MODIFIER.OPTION, KEY.H], // cmd+H is a system level shortcut on Mac, so use something else
  }),
};

const COMMAND_HISTORY = {
  name: 'Command History',
  FOCUS_HISTORY: ShortcutRegistry.createAndAdd({
    id: 'COMMAND_HISTORY.FOCUS_HISTORY',
    name: 'Focus History Search',
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

const NOTEBOOK = {
  name: 'Notebook',
  RUN: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.RUN',
    name: 'Run',
    shortcut: [MODIFIER.ALT, KEY.R],
    macShortcut: [MODIFIER.OPTION, KEY.R],
    // isEditable: false,
  }),
  RUN_SELECTED: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.RUN_SELECTED',
    name: 'Run Selected',
    shortcut: [MODIFIER.ALT, MODIFIER.SHIFT, KEY.R],
    macShortcut: [MODIFIER.OPTION, MODIFIER.SHIFT, KEY.R],
    // isEditable: false,
  }),
  FIND: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.FIND',
    name: 'Find',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
    isEditable: false,
  }),
};

const SHORTCUTS = {
  CONSOLE,
  COMMAND_HISTORY,
  NOTEBOOK,
};

export default SHORTCUTS;
