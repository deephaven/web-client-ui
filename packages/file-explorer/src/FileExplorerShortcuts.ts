import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

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

export default {
  FILE_EXPLORER,
};
