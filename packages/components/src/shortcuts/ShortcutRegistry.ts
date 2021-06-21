import Shortcut, { KeyState } from './Shortcut';

export default class ShortcutRegistry {
  static readonly shortcutMap = new Map<string, Shortcut>();

  /**
   * Creates a Shortcut and adds it to the registry
   * @param params The constructor params for the {@link Shortcut}
   * @returns The created Shortcut
   */
  static createAndAdd(
    ...params: ConstructorParameters<typeof Shortcut>
  ): Shortcut {
    const shortcut = new Shortcut(...params);
    ShortcutRegistry.add(shortcut);
    return shortcut;
  }

  /**
   * Adds a shortcut to the registry. Throws if a shortcut with the same ID already exists
   * @param shortcut Shortcut to add to the registry
   */
  static add(shortcut: Shortcut): void {
    if (ShortcutRegistry.shortcutMap.has(shortcut.id)) {
      throw new Error(
        `Trying to add duplicate shortcut to registry ${shortcut.id}`
      );
    }
    ShortcutRegistry.shortcutMap.set(shortcut.id, shortcut);
  }

  /**
   * Gets a shortcut from the registry from an ID
   * @param id ID of the shortcut
   * @returns The shortcut for that ID if it exists
   */
  static get(id: string): Shortcut | undefined {
    return ShortcutRegistry.shortcutMap.get(id);
  }

  /**
   * Gets an array of any registered shortcuts with conflicting key states.
   * Only checks the key states of the current OS (Mac or Windows/Linux)
   * Note that a keyboard event satisfies the KeyState interface
   * @param keyState
   * @returns Array of conflicting shortcuts. Empty array if none conflict
   */
  static getConflictingShortcuts(keyState: KeyState): Shortcut[] {
    return Array.from(ShortcutRegistry.shortcutMap.values()).filter(shortcut =>
      shortcut.matchesKeyState(keyState)
    );
  }
}
