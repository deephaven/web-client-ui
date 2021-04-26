import ShortcutRegistry from './ShortcutRegistry';

export enum MODIFIER {
  CTRL = 'MODIFIER_CTRL',
  CMD = 'MODIFIER_CMD',
  ALT = 'MODIFIER_ALT',
  OPTION = 'MODIFIER_OPTION',
  SHIFT = 'MODIFIER_SHIFT',
}

// The value should match the event key value
export enum KEY {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  I = 'I',
  J = 'J',
  K = 'K',
  L = 'L',
  M = 'M',
  N = 'N',
  O = 'O',
  P = 'P',
  Q = 'Q',
  R = 'R',
  S = 'S',
  T = 'T',
  U = 'U',
  V = 'V',
  W = 'W',
  X = 'X',
  Y = 'Y',
  Z = 'Z',
  BACKSPACE = 'Backspace',
  ESCAPE = 'Escape',
  ENTER = 'Enter',
}

// With CRA 4.0, this can be more specific as [...MODIFIER[], KEY]
// TS 4.0 (in CRA 4.0) lets you spread an array at any point
// This new type would be any number of MODIFIERS followed by a KEY at the end
type ShortcutKeys = (MODIFIER | KEY)[];

interface ModifierState {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export default class Shortcut {
  id: string; // Unique identifier for the shortcut

  name: string; // e.g. Rename, Save, Run Selected

  key: KEY;

  modifierState: ModifierState;

  keyDisplay: string;

  showInHelp: boolean;

  static isMacPlatform = window.navigator.platform.startsWith('Mac');

  static createModifierState(keys: ShortcutKeys): ModifierState {
    const modifiers = {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    };

    keys.forEach(key => {
      switch (key) {
        case MODIFIER.CTRL:
          modifiers.ctrlKey = true;
          break;
        case MODIFIER.ALT:
        case MODIFIER.OPTION:
          modifiers.altKey = true;
          break;
        case MODIFIER.CMD:
          modifiers.metaKey = true;
          break;
        case MODIFIER.SHIFT:
          modifiers.shiftKey = true;
          break;
        default:
          break;
      }
    });

    return modifiers;
  }

  constructor({
    id,
    shortcut,
    macShortcut,
    showInHelp = true,
    name,
  }: {
    id: string;
    shortcut: ShortcutKeys;
    macShortcut: ShortcutKeys;
    showInHelp?: boolean;
    name: string;
  }) {
    this.id = id;
    this.name = name;
    this.showInHelp = showInHelp;

    const isMac = Shortcut.isMacPlatform;
    const activeShortcut = isMac ? macShortcut : shortcut;
    this.key = activeShortcut[activeShortcut.length - 1] as KEY;
    this.modifierState = Shortcut.createModifierState(activeShortcut);
    this.keyDisplay = isMac
      ? this.getMacKeyDisplay()
      : this.getWindowsKeyDisplay();

    ShortcutRegistry.add(this);
  }

  private getWindowsKeyDisplay(): string {
    const { key, modifierState } = this;

    let display = '';

    if (modifierState.ctrlKey) {
      display += 'Ctrl+';
    }
    if (modifierState.altKey) {
      display += 'Alt+';
    }
    if (modifierState.shiftKey) {
      display += 'Shift+';
    }

    if (key === KEY.ESCAPE) {
      display += 'Esc';
    } else {
      display += key;
    }

    return display;
  }

  private getMacKeyDisplay(): string {
    const { key, modifierState } = this;

    let display = '';

    if (modifierState.ctrlKey) {
      display += '⌃';
    }
    if (modifierState.altKey) {
      display += '⌥';
    }
    if (modifierState.shiftKey) {
      display += '⇧';
    }
    if (modifierState.metaKey) {
      display += '⌘';
    }

    switch (key) {
      case KEY.ENTER:
        display += '⏎';
        break;
      case KEY.ESCAPE:
        display += '⎋';
        break;
      case KEY.BACKSPACE:
        display += '⌫';
        break;
      default:
        display += key;
    }

    return display;
  }

  matchesEvent(e: React.KeyboardEvent): boolean {
    const { key, modifierState } = this;

    return (
      e.key.toUpperCase() === key.toUpperCase() &&
      e.altKey === modifierState.altKey &&
      e.ctrlKey === modifierState.ctrlKey &&
      e.metaKey === modifierState.metaKey &&
      e.shiftKey === modifierState.shiftKey
    );
  }
}
