import { ShortcutRegistry, MODIFIER, KEY } from '@deephaven/components';

const TABLE = {
  TOGGLE_QUICK_FILTER: ShortcutRegistry.createAndAdd({
    id: 'TABLE.TOGGLE_QUICK_FILTER',
    name: 'Toggle Quick Filter',
    shortcut: [MODIFIER.CTRL, KEY.F],
    macShortcut: [MODIFIER.CMD, KEY.F],
  }),
  CLEAR_ALL_FILTERS: ShortcutRegistry.createAndAdd({
    id: 'TABLE.CLEAR_ALL_FILTERS',
    name: 'Clear All Table Filters',
    shortcut: [MODIFIER.CTRL, KEY.E],
    macShortcut: [MODIFIER.CMD, KEY.E],
  }),
  CLEAR_FILTERS: ShortcutRegistry.createAndAdd({
    id: 'TABLE.CLEAR_FILTERS',
    name: 'Clear Active Table Filters',
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
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.F],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.F],
  }),
  GOTO_ROW: ShortcutRegistry.createAndAdd({
    id: 'TABLE.GOTO_ROW',
    name: 'Go to Row',
    shortcut: [MODIFIER.CTRL, KEY.G],
    macShortcut: [MODIFIER.CMD, KEY.G],
  }),
  EXPAND_ROWS_BELOW: ShortcutRegistry.createAndAdd({
    id: 'TABLE.EXPAND_ROWS_BELOW',
    name: 'Expand Rows Below',
    shortcut: [MODIFIER.CTRL, KEY.LEFT_CLICK],
    macShortcut: [MODIFIER.CMD, KEY.LEFT_CLICK],
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

const IRIS_GRID_SHORTCUTS = {
  TABLE,
  INPUT_TABLE,
};

export default IRIS_GRID_SHORTCUTS;
