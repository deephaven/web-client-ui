import Shortcut from './Shortcut';

export default class ShortcutRegistry {
  static shortcutMap = new Map<string, Shortcut>();

  static add(shortcut: Shortcut): void {
    if (ShortcutRegistry.shortcutMap.has(shortcut.id)) {
      throw new Error(
        `Trying to add duplicate shortcut to registry ${shortcut.id}`
      );
    }
    ShortcutRegistry.shortcutMap.set(shortcut.id, shortcut);
  }

  static getFromID(id: string): Shortcut | undefined {
    return ShortcutRegistry.shortcutMap.get(id);
  }
}
