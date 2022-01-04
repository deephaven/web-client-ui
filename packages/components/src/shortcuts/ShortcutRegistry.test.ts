import Shortcut, { KEY, MODIFIER } from './Shortcut';
import ShortcutRegistry from './ShortcutRegistry';

const CATEGORY = 'TEST';

const SINGLE_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: `${CATEGORY}.SINGLE.MOD`,
  name: '',
  shortcut: [MODIFIER.CTRL, KEY.A],
  macShortcut: [MODIFIER.CMD, KEY.B],
};

beforeEach(() => {
  ShortcutRegistry.shortcutMap.clear();
  ShortcutRegistry.shortcutsByCategory.clear();
});

it('Creates and adds a shortcut', () => {
  const shortcut = ShortcutRegistry.createAndAdd(SINGLE_MOD_PARAMS);
  expect(shortcut).toEqual(new Shortcut(SINGLE_MOD_PARAMS));
  expect(ShortcutRegistry.shortcutMap.size).toBe(1);
  expect(ShortcutRegistry.shortcutsByCategory.get(CATEGORY)).toEqual([
    shortcut,
  ]);
});

it('Adds a shortcut', () => {
  const shortcut = new Shortcut(SINGLE_MOD_PARAMS);
  ShortcutRegistry.add(shortcut);
  expect(ShortcutRegistry.shortcutMap.size).toBe(1);
  expect(ShortcutRegistry.shortcutsByCategory.get(CATEGORY)).toEqual([
    shortcut,
  ]);
});

it('Does not register a shortcut with a duplicate id', () => {
  const shortcutA = ShortcutRegistry.createAndAdd(SINGLE_MOD_PARAMS);
  expect(ShortcutRegistry.shortcutMap.size).toBe(1);
  const shortcutB = ShortcutRegistry.createAndAdd(SINGLE_MOD_PARAMS);
  expect(ShortcutRegistry.shortcutMap.size).toBe(1);
  expect(shortcutA).toBe(shortcutB);
});

it('Gets a shortcut by ID', () => {
  const shortcut = ShortcutRegistry.createAndAdd(SINGLE_MOD_PARAMS);
  expect(ShortcutRegistry.get(shortcut.id)).toBe(shortcut);
});

it('Returns undefined when getting by an unknown shortcut ID', () => {
  expect(ShortcutRegistry.get('unknown')).toBeUndefined();
});

it('Gets a list conflicting shortcuts for a KeyState', () => {
  const shortcut = ShortcutRegistry.createAndAdd(SINGLE_MOD_PARAMS);
  expect(
    ShortcutRegistry.getConflictingShortcuts(shortcut.getKeyState())
  ).toEqual([shortcut]);
});

it('Returns an empty list if there are no conflicting shortcuts for a KeyState', () => {
  const shortcut = ShortcutRegistry.createAndAdd(SINGLE_MOD_PARAMS);
  expect(
    ShortcutRegistry.getConflictingShortcuts({
      ...shortcut.getKeyState(),
      keyValue: KEY.C,
    })
  ).toEqual([]);
});
