/* eslint-disable no-bitwise */
import * as monaco from 'monaco-editor';
import { Shortcut, KEY, MODIFIER } from '@deephaven/components';
import { TestUtils } from '@deephaven/utils';
import MonacoUtils from './MonacoUtils';

const { asMock, createMockProxy } = TestUtils;

const SINGLE_KEY_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Single key',
  name: '',
  shortcut: [KEY.A],
  macShortcut: [KEY.B],
};

const CTRL_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Ctrl mod',
  name: '',
  shortcut: [MODIFIER.CTRL, KEY.A],
  macShortcut: [MODIFIER.CTRL, KEY.B],
};

const SHIFT_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Shift mod',
  name: '',
  shortcut: [MODIFIER.SHIFT, KEY.A],
  macShortcut: [MODIFIER.SHIFT, KEY.B],
};

const ALT_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Alt mod',
  name: '',
  shortcut: [MODIFIER.ALT, KEY.A],
  macShortcut: [MODIFIER.OPTION, KEY.B],
};

const META_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Meta mod',
  name: '',
  shortcut: [MODIFIER.CMD, KEY.A], // This isn't actually allowed by our shortcuts, but it's in the util as a possibility
  macShortcut: [MODIFIER.CMD, KEY.B],
};

const MULTI_MOD_PARAMS: ConstructorParameters<typeof Shortcut>[0] = {
  id: 'Multi mod',
  name: '',
  shortcut: [MODIFIER.CTRL, MODIFIER.SHIFT, KEY.A],
  macShortcut: [MODIFIER.CMD, MODIFIER.SHIFT, KEY.B],
};

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('Register worker', () => {
  it('Registers the getWorker function', () => {
    const getWorker = () => ({}) as Worker;
    MonacoUtils.registerGetWorker(getWorker);
    expect(window.MonacoEnvironment?.getWorker).toBe(getWorker);
  });
});

describe('Windows shortcuts', () => {
  beforeAll(() => {
    Shortcut.isMacPlatform = false;
    MonacoUtils.isMacPlatform = () => false;
  });

  it('Converts a single key shortcut', () => {
    const s = new Shortcut(SINGLE_KEY_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyCode.KeyA
    );
  });

  it('Converts a shortcut with ctrl', () => {
    const s = new Shortcut(CTRL_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA
    );
  });

  it('Converts a shortcut with shift', () => {
    const s = new Shortcut(SHIFT_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.Shift | monaco.KeyCode.KeyA
    );
  });

  it('Converts a shortcut with alt', () => {
    const s = new Shortcut(ALT_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.Alt | monaco.KeyCode.KeyA
    );
  });

  it('Converts a shortcut with meta', () => {
    const s = new Shortcut(META_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyA
    );
  });

  it('Converts a shortcut with multiple modifiers', () => {
    const s = new Shortcut(MULTI_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA
    );
  });
});

describe('Mac shortcuts', () => {
  beforeAll(() => {
    Shortcut.isMacPlatform = true;
    MonacoUtils.isMacPlatform = () => true;
  });

  it('Converts a single key shortcut', () => {
    const s = new Shortcut(SINGLE_KEY_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyCode.KeyB
    );
  });

  it('Converts a shortcut with ctrl', () => {
    const s = new Shortcut(CTRL_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.WinCtrl | monaco.KeyCode.KeyB
    );
  });

  it('Converts a shortcut with shift', () => {
    const s = new Shortcut(SHIFT_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.Shift | monaco.KeyCode.KeyB
    );
  });

  it('Converts a shortcut with alt', () => {
    const s = new Shortcut(ALT_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.Alt | monaco.KeyCode.KeyB
    );
  });

  it('Converts a shortcut with meta', () => {
    const s = new Shortcut(META_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB
    );
  });

  it('Converts a shortcut with multiple modifiers', () => {
    const s = new Shortcut(MULTI_MOD_PARAMS);
    expect(MonacoUtils.getMonacoKeyCodeFromShortcut(s)).toEqual(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyB
    );
  });
});

describe('disableKeyBindings', () => {
  const editor = createMockProxy<monaco.editor.IStandaloneCodeEditor>();

  it('should disable key bindings for the given editor', () => {
    const keybindings = [1, 2, 3];

    MonacoUtils.disableKeyBindings(editor, keybindings);

    expect(editor.addAction).toHaveBeenCalledWith({
      id: expect.stringMatching(/^disable-keybindings-.+/),
      label: '',
      keybindings,
      run: expect.any(Function),
    });
  });
});

describe('provideLinks', () => {
  it('it should get a provideLinks function which should return an object with the links', () => {
    const { provideLinks } = MonacoUtils;
    const mockModel: monaco.editor.ITextModel = {
      getLineCount: jest.fn(() => 2),
      getLineContent: jest.fn(lineNumber =>
        lineNumber === 1
          ? 'https://google.com http://www.example.com/'
          : 'mail@gmail.com'
      ),
    } as unknown as monaco.editor.ITextModel;

    const expectedValue = {
      links: [
        { url: 'https://google.com', range: new monaco.Range(1, 1, 1, 19) },
        {
          url: 'http://www.example.com/',
          range: new monaco.Range(1, 20, 1, 43),
        },
        { url: 'mailto:mail@gmail.com', range: new monaco.Range(2, 1, 2, 15) },
      ],
    };

    expect(provideLinks(mockModel)).toEqual(expectedValue);
  });
});

describe('removeConflictingKeybindings', () => {
  beforeEach(() => {
    jest.spyOn(monaco.editor, 'addKeybindingRule');
    jest.spyOn(MonacoUtils, 'isMacPlatform');
  });

  it.each([true, false])(
    'should override keybinding rules - isMac:%s',
    isMac => {
      asMock(MonacoUtils.isMacPlatform).mockReturnValue(isMac);

      MonacoUtils.removeConflictingKeybindings();

      expect(monaco.editor.addKeybindingRule).toHaveBeenCalledWith({
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
        command: null,
      });

      if (isMac) {
        expect(monaco.editor.addKeybindingRule).toHaveBeenCalledTimes(1);
      } else {
        expect(monaco.editor.addKeybindingRule).toHaveBeenCalledWith({
          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH,
          command: null,
        });
      }
    }
  );
});
