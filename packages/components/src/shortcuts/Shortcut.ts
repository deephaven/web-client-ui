/* eslint-disable no-underscore-dangle */
import { EventTarget } from 'event-target-shim';
import React from 'react';
import { Log } from '@deephaven/log';
import { CustomEventMap, EventShimCustomEvent } from '@deephaven/utils';
import { ContextActionUtils } from '../context-actions';

const log = Log.module('Shortcut');

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
  ZERO = '0',
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  BACKSPACE = 'Backspace',
  ESCAPE = 'Escape',
  ENTER = 'Enter',
  DELETE = 'Delete',
  SLASH = '/',
  QUESTION_MARK = '?',
  BACKSLASH = '\\',
  PIPE = '|',
  MINUS = '-',
  UNDERSCORE = '_',
  EQUALS = '=',
  PLUS = '+',
  BACKTICK = '`',
  TILDE = '~',
  COMMA = ',',
  LEFT_CHEVRON = '<',
  PERIOD = '.',
  RIGHT_CHEVRON = '>',
  SEMICOLON = ';',
  COLON = ':',
  SINGLE_QUOTE = "'",
  DOUBLE_QUOTE = '"',
  LEFT_BRACKET = '[',
  RIGHT_BRACKET = ']',
  LEFT_CURLY = '{',
  RIGHT_CURLY = '}',
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',
}

const ALLOWED_SINGLE_KEY_SET: Set<KEY> = new Set([
  KEY.ENTER,
  KEY.DELETE,
  KEY.F1,
  KEY.F2,
  KEY.F3,
  KEY.F4,
  KEY.F5,
  KEY.F6,
  KEY.F7,
  KEY.F8,
  KEY.F9,
  KEY.F10,
  KEY.F11,
  KEY.F12,
]);

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

export interface ValidKeyState extends KeyState {
  keyValue: KEY | null;
}

type EventMap = CustomEventMap<{
  onUpdate: CustomEvent<Shortcut>;
}>;

export default class Shortcut extends EventTarget<EventMap, 'strict'> {
  readonly id: string; // Unique identifier for the shortcut

  readonly name: string; // e.g. Rename, Save, Run Selected

  readonly tooltip?: string;

  readonly isEditable: boolean;

  private readonly defaultKeyState: ValidKeyState;

  private keyState: ValidKeyState;

  static NULL_KEY_STATE: ValidKeyState = {
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    keyValue: null,
  };

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
    const { keyValue } = state;

    if (keyValue === null) {
      // Null state is valid
      return true;
    }

    if (!Shortcut.isMacPlatform && state.metaKey) {
      // MetaKey not allowed in windows
      return false;
    }

    if (!Shortcut.isAllowedKey(keyValue)) {
      return false;
    }

    const isSingleKey =
      !state.altKey && !state.ctrlKey && !state.metaKey && !state.shiftKey;

    return !isSingleKey || ALLOWED_SINGLE_KEY_SET.has(keyValue);
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
    if (
      eventKey === 'Shift' ||
      eventKey === 'Meta' ||
      eventKey === 'Control' ||
      eventKey === 'Alt'
    ) {
      key = '';
    } else if (
      // This is primarily for Mac which has a symbol keyboard hidden behind the alt key
      // The keyCode still corresponds to the letter keyCode, but the key value will be a symbol
      !Shortcut.isAllowedKey(eventKey) &&
      Shortcut.isAllowedKey(String.fromCharCode(keyCode))
    ) {
      key = String.fromCharCode(keyCode);
    } else {
      key = eventKey;
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
    } else if (keyState.keyValue !== null) {
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
      case null:
        break;
      default:
        display += keyState.keyValue;
    }

    return display;
  }

  /**
   * Checks if 2 KeyStates match
   * @param state1 First KeyState to compare
   * @param state2 Second KeyState to compare
   * @returns True if the KeyStates match and have non-null keyValues
   */
  static doKeyStatesMatch(state1: KeyState, state2: KeyState): boolean {
    return (
      state1.keyValue?.toUpperCase() === state2.keyValue?.toUpperCase() &&
      state1.altKey === state2.altKey &&
      state1.ctrlKey === state2.ctrlKey &&
      state1.metaKey === state2.metaKey &&
      state1.shiftKey === state2.shiftKey
    );
  }

  /**
   * Gets the display string for the current OS from a KeyState.
   * @param keyState KeyState to get the display for
   * @returns Display string for the current OS
   */
  static getDisplayText(keyState: KeyState): string {
    if (keyState.keyValue === null) {
      return '';
    }
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
    super();
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
      log.debug2(`Shortcut ${this.id} updated to ${JSON.stringify(keyState)}`);
      this.keyState = keyState;
      this.dispatchEvent(
        new EventShimCustomEvent('onUpdate', { detail: this })
      );
    } else {
      log.debug2(
        `Shortcut ${
          this.id
        } tried to update to invalid keyState ${JSON.stringify(keyState)}`
      );
    }
  }

  /**
   * Gets the default key state of the shortcut
   * @returns Default key state
   */
  getDefaultKeyState(): ValidKeyState {
    return this.defaultKeyState;
  }

  isDefault(): boolean {
    return Shortcut.doKeyStatesMatch(
      this.getDefaultKeyState(),
      this.getKeyState()
    );
  }

  /**
   * Sets the shortcut to have null keyValue
   */
  setToNull(): void {
    this.setKeyState(Shortcut.NULL_KEY_STATE);
  }

  isNull(): boolean {
    return Shortcut.doKeyStatesMatch(this.keyState, Shortcut.NULL_KEY_STATE);
  }

  /**
   * Sets the shortcut to its default key state
   */
  setToDefault(): void {
    this.setKeyState(this.defaultKeyState);
  }

  /**
   * Checks if a KeyState matches the KeyState for the shortcut
   * @param keyState KeyState to check
   * @returns True if the passed KeyState matches the Shortcut's KeyState
   */
  matchesKeyState(keyState: KeyState): boolean {
    return Shortcut.doKeyStatesMatch(keyState, this.keyState);
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
