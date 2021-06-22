import { ShortcutRegistry, KEY, MODIFIER } from '@deephaven/components';

const CODE_STUDIO = {
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

const SHORTCUTS = {
  CODE_STUDIO,
  CONSOLE,
};

export default SHORTCUTS;
