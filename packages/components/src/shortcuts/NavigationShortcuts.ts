import ShortcutRegistry from './ShortcutRegistry';
import { MODIFIER, KEY } from './Shortcut';

const NAVIGATION_SHORTCUTS = {
  CYCLE_TO_NEXT_STACK: ShortcutRegistry.createAndAdd({
    id: 'NAVIGATION.CYCLE_TO_NEXT_STACK',
    name: 'Cycle To Next Stack',
    shortcut: [MODIFIER.CTRL, KEY.SINGLE_QUOTE],
    macShortcut: [MODIFIER.CMD, KEY.SINGLE_QUOTE],
    isEditable: true,
  }),
  CYCLE_TO_PREVIOUS_STACK: ShortcutRegistry.createAndAdd({
    id: 'NAVIGATION.CYCLE_TO_PREVIOUS_STACK',
    name: 'Cycle To Previous Stack',
    shortcut: [MODIFIER.CTRL, KEY.SEMICOLON],
    macShortcut: [MODIFIER.CMD, KEY.SEMICOLON],
    isEditable: true,
  }),
  CYCLE_TO_NEXT_TAB: ShortcutRegistry.createAndAdd({
    id: 'NAVIGATION.CYCLE_TO_NEXT_TAB',
    name: 'Cycle To Next Tab',
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.DOUBLE_QUOTE],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.SINGLE_QUOTE],
    isEditable: true,
  }),
  CYCLE_TO_PREVIOUS_TAB: ShortcutRegistry.createAndAdd({
    id: 'NAVIGATION.CYCLE_TO_PREVIOUS_TAB',
    name: 'Cycle To Previous TAB',
    shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.COLON],
    macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.SEMICOLON],
    isEditable: true,
  }),
};

export default NAVIGATION_SHORTCUTS;
