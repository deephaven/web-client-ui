/* eslint-disable max-classes-per-file */
import { EventTarget } from 'event-target-shim';
import { Log } from '@deephaven/log';
import { CustomEventMap, EventShimCustomEvent } from '@deephaven/utils';
import Shortcut, { KeyState } from './Shortcut';

const log = Log.module('ShortcutRegistry');

type EventMap = CustomEventMap<{
  onUpdate: CustomEvent<Shortcut>;
}>;

class ShortcutRegistry extends EventTarget<EventMap, 'strict'> {
  readonly shortcutMap = new Map<string, Shortcut>();

  readonly shortcutsByCategory = new Map<string, Shortcut[]>();

  /**
   * Creates a Shortcut and adds it to the registry
   * @param params The constructor params for the {@link Shortcut}
   * @returns The created shortcut or the shortcut in the registry if 1 already exists w/ the same ID
   */
  createAndAdd(params: ConstructorParameters<typeof Shortcut>[0]): Shortcut {
    const shortcut = new Shortcut(params);
    return this.add(shortcut);
  }

  /**
   * Adds a shortcut to the registry. Warns and returns existing shortcut if a shortcut with the same ID already exists
   * @param shortcut Shortcut to add to the registry
   * @returns Shortcut passed if it is not in the registry. Shortcut from the registry if one exists for the same ID
   */
  add(shortcut: Shortcut): Shortcut {
    const existingShortcut = this.shortcutMap.get(shortcut.id);
    if (existingShortcut) {
      log.warn(
        `Skipping attempt to add duplicate shortcut ID to registry: ${shortcut.id}`
      );
      return existingShortcut;
    }

    log.debug2(`Adding shortcut to registry: ${shortcut.id}`);

    shortcut.addEventListener('onUpdate', ({ detail }) =>
      this.dispatchEvent(new EventShimCustomEvent('onUpdate', { detail }))
    );

    const category = shortcut.id.split('.')[0];

    this.shortcutMap.set(shortcut.id, shortcut);
    if (this.shortcutsByCategory.has(category)) {
      this.shortcutsByCategory.get(category)?.push(shortcut);
    } else {
      this.shortcutsByCategory.set(category, [shortcut]);
    }

    return shortcut;
  }

  /**
   * Gets a shortcut from the registry from an ID
   * @param id ID of the shortcut
   * @returns The shortcut for that ID if it exists
   */
  get(id: string): Shortcut | undefined {
    return this.shortcutMap.get(id);
  }

  /**
   * Gets an array of any registered shortcuts with conflicting key states.
   * Only checks the key states of the current OS (Mac or Windows/Linux)
   * @param keyState
   * @returns Array of conflicting shortcuts. Empty array if none conflict
   */
  getConflictingShortcuts(keyState: KeyState): Shortcut[] {
    return Array.from(this.shortcutMap.values()).filter(
      shortcut => !shortcut.isNull() && shortcut.matchesKeyState(keyState)
    );
  }
}

const registry = Object.freeze(new ShortcutRegistry());

export default registry;
