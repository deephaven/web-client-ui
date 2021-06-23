import ShortcutRegistry from './ShortcutRegistry';
import { MODIFIER, KEY } from './Shortcut';

const GLOBAL_SHORTCUTS = {
  COPY: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.COPY',
    name: 'Copy',
    shortcut: [MODIFIER.CTRL, KEY.C],
    macShortcut: [MODIFIER.CMD, KEY.C],
    isEditable: false,
  }),
  PASTE: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.PASTE',
    name: 'Paste',
    shortcut: [MODIFIER.CTRL, KEY.V],
    macShortcut: [MODIFIER.CMD, KEY.V],
    isEditable: false,
  }),
  SAVE: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.SAVE',
    name: 'Save',
    shortcut: [MODIFIER.CTRL, KEY.S],
    macShortcut: [MODIFIER.CMD, KEY.S],
    isEditable: false,
  }),
  SELECT_ALL: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.SELECT_ALL',
    name: 'Select All',
    shortcut: [MODIFIER.CTRL, KEY.A],
    macShortcut: [MODIFIER.CMD, KEY.A],
    isEditable: false,
  }),
  LINKER: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.LINKER',
    name: 'Linker',
    shortcut: [MODIFIER.CTRL, KEY.L],
    macShortcut: [MODIFIER.CMD, KEY.L],
  }),
  LINKER_CLOSE: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.LINKER_CLOSE',
    name: 'Close Linker Overlay',
    shortcut: [KEY.ESCAPE],
    macShortcut: [KEY.ESCAPE],
    isEditable: false,
  }),
};

export default GLOBAL_SHORTCUTS;
