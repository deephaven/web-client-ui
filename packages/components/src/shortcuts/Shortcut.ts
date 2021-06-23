/* eslint-disable no-underscore-dangle */
import React from 'react';
import { ContextActionUtils } from '../context-actions';

export enum MODIFIER {
  CTRL = 'MODIFIER_CTRL',
  CMD = 'MODIFIER_CMD',
  ALT = 'MODIFIER_ALT',
  OPTION = 'MODIFIER_OPTION',
  SHIFT = 'MODIFIER_SHIFT',
}

// The value should match the KeyboardEvent.key value
// This is the value which will be displayed if no display overrides are done in the OS specific getDisplayString methods
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
  DELETE = 'Delete',
  SLASH = '/',
}

type ShortcutKeys = [...MODIFIER[], KEY];

export interface KeyState {
  /**
   * This is purposely keyValue and not key to make KeyboardEvents not match the interface
   * KeyboardEvents need some processing to get the actual value
   * Use Shortcut.getKeyStateFromEvent to get the right KeyState from an event
   */
  keyValue: string | null;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

interface ValidKeyState extends KeyState {
  keyValue: KEY;
}

export default class Shortcut {
  readonly id: string; // Unique identifier for the shortcut

  readonly name: string; // e.g. Rename, Save, Run Selected

  readonly tooltip?: string;

  readonly isEditable: boolean;

  private readonly defaultKeyState: ValidKeyState;

  private keyState: ValidKeyState;

  /**
   * Use to check if a keyCode corresponds to an allowed key for a shortcut
   * @param keyCode The keyCode to check. This should be the charCode of the key
   * @returns Type predicate asserting the key is an allowed KEY
   */
  static isAllowedKey(key: string | null): key is KEY {
    return Object.values(KEY).includes(key as KEY);
  }

  /**
   * Checks if a KeyState has a valid key.
   * @param state KeyState with any string as the key
   * @returns True if KeyState is is using an allowed keyCode
   */
  static isValidKeyState(state: KeyState): state is ValidKeyState {
    return (
      Shortcut.isAllowedKey(state.keyValue) &&
      (state.altKey ||
        state.ctrlKey ||
        state.metaKey ||
        state.shiftKey ||
        state.keyValue === KEY.ENTER ||
        state.keyValue === KEY.DELETE)
    );
  }

  static isMacPlatform = ContextActionUtils.isMacPlatform();

  /**
   * Creates a KeyState from a valid array of modifier and key constants
   * @param keys Array of keys in the shortcut. Modifiers first and key last. Should use the MODIFIER and KEY enums
   * @returns KeyState representing the array of constants
   */
  static createKeyState(keys: ShortcutKeys): ValidKeyState {
    const keyState: ValidKeyState = {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      keyValue: keys[keys.length - 1] as KEY,
    };

    keys.forEach(key => {
      switch (key) {
        case MODIFIER.CTRL:
          keyState.ctrlKey = true;
          break;
        case MODIFIER.ALT:
        case MODIFIER.OPTION:
          keyState.altKey = true;
          break;
        case MODIFIER.CMD:
          keyState.metaKey = true;
          break;
        case MODIFIER.SHIFT:
          keyState.shiftKey = true;
          break;
        default:
          break;
      }
    });

    return keyState;
  }

  static getKeyStateFromEvent(
    e: React.KeyboardEvent | KeyboardEvent
  ): KeyState {
    const { key: eventKey, keyCode } = e;
    let key = '';
    if (Shortcut.isAllowedKey(eventKey)) {
      key = eventKey;
    } else if (Shortcut.isAllowedKey(String.fromCharCode(keyCode))) {
      key = String.fromCharCode(keyCode);
    }

    return {
      keyValue: key,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      shiftKey: e.shiftKey,
    };
  }

  /**
   * Gets display string for Windows (and Linux + any other non-Mac OS)
   * If the key is not an allowed key, the display will only display the modifiers
   * @param keyState KeyState to get the display for
   * @returns The string to display on Windows/non-Mac OS
   */
  private static getWindowsDisplayText(keyState: KeyState): string {
    let display = '';

    if (keyState.ctrlKey) {
      display += 'Ctrl+';
    }
    if (keyState.altKey) {
      display += 'Alt+';
    }
    if (keyState.shiftKey) {
      display += 'Shift+';
    }

    if (keyState.keyValue === KEY.ESCAPE) {
      display += 'Esc';
    } else if (Shortcut.isAllowedKey(keyState.keyValue)) {
      display += keyState.keyValue;
    }

    return display;
  }

  /**
   * Gets display string Mac OS
   * If the key is not an allowed key, the display will only display the modifiers
   * @param keyState KeyState to get the display for
   * @returns The string to display on Mac OS
   */
  private static getMacDisplayText(keyState: KeyState): string {
    let display = '';

    if (keyState.ctrlKey) {
      display += '⌃';
    }
    if (keyState.altKey) {
      display += '⌥';
    }
    if (keyState.shiftKey) {
      display += '⇧';
    }
    if (keyState.metaKey) {
      display += '⌘';
    }

    switch (keyState.keyValue) {
      case KEY.ENTER:
        display += '⏎';
        break;
      case KEY.ESCAPE:
        display += '⎋';
        break;
      case KEY.BACKSPACE:
        display += '⌫';
        break;
      case KEY.DELETE:
        display += '⌦';
        break;
      default:
        if (Shortcut.isAllowedKey(keyState.keyValue)) {
          display += keyState.keyValue;
        }
    }

    return display;
  }

  /**
   * Gets the display string for the current OS from a KeyState.
   * @param keyState KeyState to get the display for
   * @returns Display string for the current OS
   */
  static getDisplayText(keyState: KeyState): string {
    return Shortcut.isMacPlatform
      ? Shortcut.getMacDisplayText(keyState)
      : Shortcut.getWindowsDisplayText(keyState);
  }

  constructor({
    id,
    shortcut,
    macShortcut,
    isEditable = true,
    name,
    tooltip,
  }: {
    id: string;
    shortcut: ShortcutKeys;
    macShortcut: ShortcutKeys;
    isEditable?: boolean;
    name: string;
    tooltip?: string;
  }) {
    this.id = id;
    this.name = name;
    this.tooltip = tooltip;
    this.isEditable = isEditable;

    const isMac = Shortcut.isMacPlatform;
    const activeShortcut = isMac ? macShortcut : shortcut;
    this.defaultKeyState = Shortcut.createKeyState(activeShortcut);
    this.keyState = this.defaultKeyState;
  }

  /**
   * Gets the display string for the current OS
   */
  getDisplayText(): string {
    return Shortcut.getDisplayText(this.keyState);
  }

  /**
   * Gets the current keyState for the Shortcut
   */
  getKeyState(): ValidKeyState {
    return this.keyState;
  }

  /**
   * Sets the KeyState if it is valid
   * @param keyState
   */
  setKeyState(keyState: KeyState): void {
    if (Shortcut.isValidKeyState(keyState)) {
      this.keyState = keyState;
    }
  }

  /**
   * Checks if a KeyState matches the KeyState for the shortcut
   * @param keyState KeyState to check
   * @returns True if the passed KeyState matches the Shortcut's KeyState
   */
  matchesKeyState(keyState: KeyState): boolean {
    return (
      keyState.keyValue !== null &&
      keyState.keyValue.toUpperCase() ===
        this.keyState.keyValue.toUpperCase() &&
      keyState.altKey === this.keyState.altKey &&
      keyState.ctrlKey === this.keyState.ctrlKey &&
      keyState.metaKey === this.keyState.metaKey &&
      keyState.shiftKey === this.keyState.shiftKey
    );
  }

  /**
   * Alias for matchesKeyState
   * @param e KeyboardEvent to check if the Shortcut matches
   * @returns True if the event matches the Shortcut's KeyState
   */
  matchesEvent(e: React.KeyboardEvent | KeyboardEvent): boolean {
    return this.matchesKeyState(Shortcut.getKeyStateFromEvent(e));
  }
}
