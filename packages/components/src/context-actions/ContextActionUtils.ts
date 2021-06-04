import { IconDefinition } from '@deephaven/icons';
import React from 'react';

export interface KeyState {
  key: string | null;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
}

export type ResolvableContextAction =
  | ContextAction
  | Promise<ContextAction[]>
  | (() => Promise<ContextAction[]> | ContextAction[] | ContextAction);

export type MenuItem = ContextAction | Promise<ContextAction[]>;

export interface ContextAction {
  title?: string;
  description?: string;
  action?(event?: KeyboardEvent): void;
  actions?: ResolvableContextAction[];
  icon?: IconDefinition | React.ReactElement;
  iconColor?: string;
  shortcut?: string;
  macShortcut?: string;
  isGlobal?: boolean;
  group?: number;
  order?: number;
  disabled?: boolean;
  menuElement?: React.ReactElement;
  iconOutline?: boolean;
}

export interface ContextActionEvent extends MouseEvent {
  contextActions: ResolvableContextAction[];
}

class ContextActionUtils {
  /**
   * Use these chars for defining shortcuts
   * Order should be Ctrl/Alt/Shift/Meta for modifiers
   */
  static SHIFT_KEY = '⇧';

  static META_KEY = '⌘';

  static ALT_KEY = '⌥';

  static CTRL_KEY = '⌃';

  static ENTER_KEY = '⏎';

  static ESCAPE_KEY = '⎋'; // https://en.wikipedia.org/wiki/Esc_key

  static BACKSPACE_KEY = '⌫';

  static isContextActionEvent(e: MouseEvent): e is ContextActionEvent {
    return Array.isArray((e as ContextActionEvent).contextActions);
  }

  static getKeyStateFromShortcut(shortcutParam: string | undefined): KeyState {
    const keyState: KeyState = {
      key: null,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
    };

    if (shortcutParam === '' || shortcutParam === undefined) {
      return keyState;
    }

    const shortcut = shortcutParam.replace('^', ContextActionUtils.CTRL_KEY);

    if (shortcut.indexOf(ContextActionUtils.CTRL_KEY) >= 0) {
      keyState.ctrlKey = true;
    }
    if (shortcut.indexOf(ContextActionUtils.META_KEY) >= 0) {
      keyState.metaKey = true;
    }
    if (shortcut.indexOf(ContextActionUtils.SHIFT_KEY) >= 0) {
      keyState.shiftKey = true;
    }
    if (shortcut.indexOf(ContextActionUtils.ALT_KEY) >= 0) {
      keyState.altKey = true;
    }

    let key = shortcut.charAt(shortcut.length - 1);
    key = key.replace(/[⏎↵↩]/, 'Enter');
    key = key.replace(/[⎋]/, 'Escape');
    key = key.replace(/[⌫]/, 'Backspace');
    keyState.key = key;

    return keyState;
  }

  /**
   * Returns true if the shortcut matches the keyboard event
   * @param event The event to compare against the shortcut
   * @param shortcut The string representation of the keyboard shortcut
   */
  static isEventForShortcut(event: KeyboardEvent, shortcut: string): boolean {
    const keyState = ContextActionUtils.getKeyStateFromShortcut(shortcut);
    return ContextActionUtils.isEventForKeyState(event, keyState);
  }

  static isEventForKeyState(event: KeyboardEvent, keyState: KeyState): boolean {
    if (!event || !event.key || !keyState || !keyState.key) {
      return false;
    }

    const keyMatches =
      event.key.toUpperCase() === keyState.key.toUpperCase() ||
      String.fromCharCode(event.keyCode).toUpperCase() ===
        keyState.key.toUpperCase();

    return (
      keyMatches &&
      event.metaKey === keyState.metaKey &&
      event.shiftKey === keyState.shiftKey &&
      event.altKey === keyState.altKey &&
      event.ctrlKey === keyState.ctrlKey
    );
  }

  /**
   * Compare two action items. Useful in Array.sort
   * @param a First context action to compare
   * @param b Second context action to compare
   */
  static compareActions(a: ContextAction, b: ContextAction): number {
    if (a.group !== b.group) {
      return (a.group || 0) > (b.group || 0) ? 1 : -1;
    }

    if (a.order !== b.order) {
      return (a.order || 0) > (b.order || 0) ? 1 : -1;
    }

    if (a.title !== b.title) {
      return (a.title || '') > (b.title || '') ? 1 : -1;
    }

    if (a !== b) {
      return a > b ? 1 : -1;
    }

    return 0;
  }

  /**
   *
   * @param actions The array of actions to sort
   */
  static sortActions(actions: ContextAction[]): ContextAction[] {
    if (!actions || !Array.isArray(actions)) {
      return [];
    }

    const sortedActions = actions.slice();
    sortedActions.sort(ContextActionUtils.compareActions);
    return sortedActions;
  }

  static isMacPlatform(): boolean {
    const { platform } = window.navigator;
    return platform.startsWith('Mac');
  }

  /**
   * Retrieve the preferred modifier key based on the current platform
   */
  static getModifierKey(): 'metaKey' | 'ctrlKey' {
    if (ContextActionUtils.isMacPlatform()) {
      return 'metaKey';
    }

    return 'ctrlKey';
  }

  /**
   * Returns true if the modifier key for the current platform is down for the event (Ctrl for windows/linux, Command (meta) for mac)
   * @param event The event to get the meta key status from
   */
  static isModifierKeyDown(
    event: KeyboardEvent | MouseEvent | React.KeyboardEvent | React.MouseEvent
  ): boolean {
    const modifierKey = ContextActionUtils.getModifierKey();
    return event[modifierKey];
  }

  static getShortcutFromAction(action: ContextAction): string | undefined {
    if (ContextActionUtils.isMacPlatform()) {
      return action.macShortcut;
    }
    return action.shortcut;
  }

  static getDisplayShortcut(action: ContextAction): string | null {
    const shortcut = ContextActionUtils.getShortcutFromAction(action);
    return ContextActionUtils.getDisplayShortcutText(shortcut);
  }

  static getDisplayShortcutText(shortcut?: string): string | null {
    if (shortcut == null) {
      return null;
    }

    if (ContextActionUtils.isMacPlatform()) {
      return shortcut;
    }

    return shortcut
      .replace(/[\^⌃]/, 'Ctrl+')
      .replace(/[⌥]/, 'Alt+')
      .replace(/[⇧]/, 'Shift+')
      .replace(/[⏎↵↩]/, 'Enter');
  }

  /**
   * Copy the passed in text to the clipboard.
   * @param text The text to copy
   * @returns Promise Resolved on success, rejected on failure
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      const permissions = await navigator.permissions.query({
        name: 'clipboard-write',
      });
      if (permissions.state !== 'granted' && permissions.state !== 'prompt') {
        throw new Error('Invalid permissions for clipboard-write');
      }
    } catch (e) {
      // Fallback if we can't get permissions for some reason
      ContextActionUtils.copyToClipboardExecCommand(text);
      return;
    }

    await navigator.clipboard.writeText(text);
  }

  /**
   * Copy the passed in text to the clipboard using the `execCommand` functionality
   * Throws on error/failure
   * @param text The text to copy
   */
  static copyToClipboardExecCommand(text: string): void {
    const oldFocus = document.activeElement;
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    if (!document.execCommand('copy')) {
      throw new Error('Unable to execute copy command');
    }

    document.body.removeChild(textArea);

    if (oldFocus instanceof HTMLElement) {
      oldFocus.focus();
    }
  }

  /**
   * Returns the menu items for the provided context actions, or empty array if none found.
   * @param actionsParam The actions to get menu items for
   * @param includePromises Whether or not to include promises in the returned menu items
   */
  static getMenuItems(
    actionsParam: ResolvableContextAction[],
    includePromises?: true
  ): MenuItem[];

  // If ignoring promises, then the return type is narrowed
  static getMenuItems(
    actionsParam: ResolvableContextAction[],
    includePromises: false
  ): ContextAction[];

  static getMenuItems(
    actionsParam: ResolvableContextAction[],
    includePromises = true
  ): MenuItem[] {
    let menuItems: MenuItem[] = [];
    let actions = actionsParam;
    if (!Array.isArray(actions)) {
      actions = [actions];
    }

    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      let newMenuItems:
        | ContextAction
        | ContextAction[]
        | Promise<ContextAction[]>;
      if (typeof action === 'function') {
        newMenuItems = action();
      } else {
        newMenuItems = action;
      }

      if (newMenuItems != null) {
        if (newMenuItems instanceof Promise) {
          if (includePromises) {
            menuItems.push(newMenuItems);
          }
        } else if (Array.isArray(newMenuItems)) {
          menuItems = menuItems.concat(newMenuItems);
        } else {
          menuItems.push(newMenuItems);
        }
      }
    }

    menuItems = menuItems.filter(
      action =>
        (action as ContextAction).title ||
        (action as Promise<ContextAction[]>).then ||
        (action as ContextAction).menuElement
    );

    return menuItems;
  }

  /**
   * Returns the index of the next menu item in a list that doesn't have a disabled=true prop
   * @param startIndex the starting position for the iteration
   * @param delta the direction of travel, -1 or 1
   * @param menuItems an array of menuItems
   */
  static getNextMenuItem(
    startIndex: number,
    delta: -1 | 1,
    menuItems: MenuItem[]
  ): number {
    let firstIndex = startIndex;
    if (firstIndex < 0 && delta < 0) {
      // if menu index is -1 and delta -1 manually set start point
      firstIndex = menuItems.length;
    }
    // find the next non disabled menu option, iterating the list only once
    for (let i = 1; i < menuItems.length + 1; i += 1) {
      const menuIndex =
        (firstIndex + delta * i + menuItems.length) % menuItems.length;
      const item = menuItems[menuIndex];
      if (!(item instanceof Promise) && item.disabled !== true) {
        return menuIndex;
      }
    }
    return startIndex;
  }
}

export default ContextActionUtils;
