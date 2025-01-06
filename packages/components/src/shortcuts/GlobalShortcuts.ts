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
  REOPEN_CLOSED_PANEL: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.REOPEN_CLOSED_PANEL',
    name: 'Re-open Closed Panel',
    shortcut: [MODIFIER.ALT, MODIFIER.SHIFT, KEY.T],
    macShortcut: [MODIFIER.OPTION, MODIFIER.SHIFT, KEY.T],
    isEditable: true,
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
  COPY_VERSION_INFO: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.COPY_VERSION_INFO',
    name: 'Copy Version Info',
    // alt vs shift to not be the devtools shortcut on each platform
    shortcut: [MODIFIER.CTRL, MODIFIER.ALT, KEY.I],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.I],
    isEditable: true,
  }),
  EXPORT_LOGS: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.EXPORT_LOGS',
    name: 'Export Logs',
    shortcut: [MODIFIER.CTRL, MODIFIER.ALT, MODIFIER.SHIFT, KEY.L],
    macShortcut: [MODIFIER.CMD, MODIFIER.OPTION, MODIFIER.SHIFT, KEY.L],
    isEditable: true,
  }),
  NEXT: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.NEXT',
    name: 'Next',
    shortcut: [KEY.ENTER],
    macShortcut: [KEY.ENTER],
    isEditable: false,
  }),
  PREVIOUS: ShortcutRegistry.createAndAdd({
    id: 'GLOBAL.PREVIOUS',
    name: 'Previous',
    shortcut: [MODIFIER.SHIFT, KEY.ENTER],
    macShortcut: [MODIFIER.SHIFT, KEY.ENTER],
    isEditable: false,
  }),
};

export default GLOBAL_SHORTCUTS;
