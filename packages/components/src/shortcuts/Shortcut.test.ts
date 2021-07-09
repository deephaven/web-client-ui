import Shortcut, { KEY, MODIFIER } from './Shortcut';
import ShortcutRegistry from './ShortcutRegistry';

const SINGLE_KEY_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Test single key',
  name: '',
  shortcut: [KEY.A],
  macShortcut: [KEY.B],
};

const DIFF_LEN_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Test diff length shortcuts',
  name: '',
  shortcut: [MODIFIER.CTRL, KEY.A],
  macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.B],
};

const SINGLE_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Test single mod',
  name: '',
  shortcut: [MODIFIER.CTRL, KEY.A],
  macShortcut: [MODIFIER.CMD, KEY.B],
};

const MULTI_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Test multi mod',
  name: '',
  shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.A],
  macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.B],
};

const DEFAULT_MODIFIER_STATE = {
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

describe('Windows shortcuts', () => {
  beforeAll(() => {
    ShortcutRegistry.shortcutMap.clear();
    Shortcut.isMacPlatform = false;
  });

  it('Creates a valid single key shortcut', () => {
    const s = new Shortcut(SINGLE_KEY_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      keyValue: KEY.A,
    });
    expect(s.getDisplayText()).toBe('A');
  });

  it('Creates a valid shortcut with a single modifier', () => {
    const s = new Shortcut(SINGLE_MOD_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      ctrlKey: true,
      keyValue: KEY.A,
    });
    expect(s.getDisplayText()).toBe('Ctrl+A');
  });

  it('Creates a valid shortcut with multiple modifiers', () => {
    const s = new Shortcut(MULTI_MOD_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      ctrlKey: true,
      shiftKey: true,
      keyValue: KEY.A,
    });
    expect(s.getDisplayText()).toBe('Ctrl+Shift+A');
  });

  it('Creates the right shortcut when the 2 platform shortcuts are different lengths', () => {
    const s = new Shortcut(DIFF_LEN_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      ctrlKey: true,
      keyValue: KEY.A,
    });
  });

  it('Shortens Escape display to Esc', () => {
    const a = new Shortcut({
      ...SINGLE_KEY_PARAMS,
      id: 'esc_test',
      shortcut: [KEY.ESCAPE],
    });
    expect(a.getDisplayText()).toBe('Esc');
  });
});

describe('Mac shortcuts', () => {
  beforeAll(() => {
    ShortcutRegistry.shortcutMap.clear();
    Shortcut.isMacPlatform = true;
  });

  it('Creates a valid single key shortcut', () => {
    const s = new Shortcut(SINGLE_KEY_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      keyValue: KEY.B,
    });
    expect(s.getDisplayText()).toBe('B');
  });

  it('Creates a valid shortcut with a single modifier', () => {
    const s = new Shortcut(SINGLE_MOD_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      metaKey: true,
      keyValue: KEY.B,
    });
    expect(s.getDisplayText()).toBe('⌘B');
  });

  it('Creates a valid shortcut with multiple modifiers', () => {
    const s = new Shortcut(MULTI_MOD_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      metaKey: true,
      shiftKey: true,
      keyValue: KEY.B,
    });
    expect(s.getDisplayText()).toBe('⇧⌘B');
  });

  it('Creates the right shortcut when the 2 platform shortcuts are different lengths', () => {
    const s = new Shortcut(DIFF_LEN_PARAMS);
    expect(s.getKeyState()).toEqual({
      ...DEFAULT_MODIFIER_STATE,
      metaKey: true,
      shiftKey: true,
      keyValue: KEY.B,
    });
  });

  it('Replaces the enter key display', () => {
    const a = new Shortcut({
      ...SINGLE_KEY_PARAMS,
      id: 'enter_test',
      macShortcut: [KEY.ENTER],
    });
    expect(a.getDisplayText()).toBe('⏎');
  });

  it('Replaces the escape key display', () => {
    const a = new Shortcut({
      ...SINGLE_KEY_PARAMS,
      id: 'escape_test',
      macShortcut: [KEY.ESCAPE],
    });
    expect(a.getDisplayText()).toBe('⎋');
  });

  it('Replaces the backspace key display', () => {
    const a = new Shortcut({
      ...SINGLE_KEY_PARAMS,
      id: 'backspace_test',
      macShortcut: [KEY.BACKSPACE],
    });
    expect(a.getDisplayText()).toBe('⌫');
  });
});
