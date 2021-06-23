import { ShortcutRegistry, MODIFIER, KEY } from '@deephaven/components';

const TABLE = {
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

const INPUT_TABLE = {
  COMMIT: ShortcutRegistry.createAndAdd({
    id: 'INPUT_TABLE.COMMIT',
    name: 'Commit',
    shortcut: [MODIFIER.CTRL, KEY.S],
    macShortcut: [MODIFIER.CMD, KEY.S],
  }),
  DISCARD: ShortcutRegistry.createAndAdd({
    id: 'INPUT_TABLE.DISCARD',
    name: 'Discard',
    shortcut: [MODIFIER.CTRL, MODIFIER.ALT, KEY.S],
    macShortcut: [MODIFIER.CMD, MODIFIER.OPTION, KEY.S],
  }),
};

export default {
  TABLE,
  INPUT_TABLE,
};
