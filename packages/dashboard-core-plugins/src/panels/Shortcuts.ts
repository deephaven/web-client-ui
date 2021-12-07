import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

const NOTEBOOK = {
  name: 'Notebook',
  // RUN: ShortcutRegistry.createAndAdd({
  //   id: 'NOTEBOOK.RUN',
  //   name: 'Run',
  //   shortcut: [MODIFIER.ALT, KEY.R],
  //   macShortcut: [MODIFIER.OPTION, KEY.R],
  //   isEditable: false,
  // }),
  // RUN_SELECTED: ShortcutRegistry.createAndAdd({
  //   id: 'NOTEBOOK.RUN_SELECTED',
  //   name: 'Run Selected',
  //   shortcut: [MODIFIER.ALT, MODIFIER.SHIFT, KEY.R],
  //   macShortcut: [MODIFIER.OPTION, MODIFIER.SHIFT, KEY.R],
  //   isEditable: false,
  // }),
  // FIND: ShortcutRegistry.createAndAdd({
  //   id: 'NOTEBOOK.FIND',
  //   name: 'Find',
  //   shortcut: [MODIFIER.CTRL, KEY.F],
  //   macShortcut: [MODIFIER.CMD, KEY.F],
  //   isEditable: false,
  // }),
};

const SHORTCUTS = {
  // NOTEBOOK,
};

export default SHORTCUTS;
