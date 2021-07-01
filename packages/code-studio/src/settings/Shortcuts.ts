import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

const NOTEBOOK = {
  name: 'Notebook',
  RUN: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.RUN',
    name: 'Run',
    shortcut: [MODIFIER.ALT, KEY.R],
    macShortcut: [MODIFIER.OPTION, KEY.R],
    isEditable: false,
  }),
  RUN_SELECTED: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.RUN_SELECTED',
    name: 'Run Selected',
    shortcut: [MODIFIER.ALT, MODIFIER.SHIFT, KEY.R],
    macShortcut: [MODIFIER.OPTION, MODIFIER.SHIFT, KEY.R],
    isEditable: false,
  }),
  FIND: ShortcutRegistry.createAndAdd({
    id: 'NOTEBOOK.FIND',
    name: 'Find',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
    isEditable: false,
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

const SHORTCUTS = {
  NOTEBOOK,
  FILE_EXPLORER,
};

export default SHORTCUTS;
