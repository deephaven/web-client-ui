import { IconDefinition } from '@deephaven/icons';
import React from 'react';
import type { Shortcut } from '../shortcuts';

export type ResolvableContextAction =
  | ContextAction
  | Promise<ContextAction[]>
  | (() => Promise<ContextAction[]> | ContextAction[] | ContextAction);

export type MenuItem = ContextAction | Promise<ContextAction[]>;

export interface ContextAction {
  title?: string;
  description?: string;
  action?(event?: Event): void;
  actions?: ResolvableContextAction[];
  icon?: IconDefinition | React.ReactElement;
  iconColor?: string;
  shortcut?: Shortcut;
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

export function isPromise<A, T>(value: A | Promise<T>): value is Promise<T> {
  return (value as Promise<T>).then !== undefined;
}

class ContextActionUtils {
  static actionsDisabled = false;

  static disableAllActions(): void {
    ContextActionUtils.actionsDisabled = true;
  }

  static enableAllActions(): void {
    ContextActionUtils.actionsDisabled = false;
  }

  static isContextActionEvent(e: MouseEvent): e is ContextActionEvent {
    return Array.isArray((e as ContextActionEvent).contextActions);
  }

  /**
   * Compare two action items. Useful in Array.sort
   * @param a First context action to compare
   * @param b Second context action to compare
   */
  static compareActions(a: ContextAction, b: ContextAction): number {
    if (a.group !== b.group) {
      return (a.group ?? 0) > (b.group ?? 0) ? 1 : -1;
    }

    if (a.order !== b.order) {
      return (a.order ?? 0) > (b.order ?? 0) ? 1 : -1;
    }

    if (a.title !== b.title) {
      return (a.title ?? '') > (b.title ?? '') ? 1 : -1;
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
    if (actions == null || !Array.isArray(actions)) {
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

  /**
   * Copy the passed in text to the clipboard.
   * @param text The text to copy
   * @returns Promise Resolved on success, rejected on failure
   */
  static copyToClipboard(text: string): Promise<void> {
    const { clipboard } = navigator;
    if (clipboard === undefined) {
      ContextActionUtils.copyToClipboardExecCommand(text);
      return Promise.resolve();
    }
    return navigator.clipboard.writeText(text).catch(() => {
      ContextActionUtils.copyToClipboardExecCommand(text);
    });
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
    actionsParam: ResolvableContextAction | ResolvableContextAction[],
    includePromises?: true
  ): MenuItem[];

  // If ignoring promises, then the return type is narrowed
  static getMenuItems(
    actionsParam: ResolvableContextAction | ResolvableContextAction[],
    includePromises: false
  ): ContextAction[];

  static getMenuItems(
    actionsParam: ResolvableContextAction | ResolvableContextAction[],
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
        (action as ContextAction).title !== undefined ||
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
