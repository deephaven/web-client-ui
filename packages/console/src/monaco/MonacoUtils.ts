/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Exports a function for initializing monaco with the deephaven theme/config
 */
import { Shortcut } from '@deephaven/components';
import { IdeSession } from '@deephaven/jsapi-shim';
import { assertNotNull } from '@deephaven/utils';
import * as monaco from 'monaco-editor';
import type { Environment } from 'monaco-editor';
// @ts-ignore
import { KeyCodeUtils } from 'monaco-editor/esm/vs/base/common/keyCodes.js';
// @ts-ignore
// import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker';
import Log from '@deephaven/log';
import MonacoTheme from './MonacoTheme.module.scss';
import PyLang from './lang/python';
import GroovyLang from './lang/groovy';
import ScalaLang from './lang/scala';
import DbLang from './lang/db';
import LogLang from './lang/log';
import { Language } from './lang/Language';

const log = Log.module('MonacoUtils');

declare global {
  interface Window {
    MonacoEnvironment?: Environment;
  }
}

class MonacoUtils {
  /**
   * Initializes Monaco for the environment
   * @param getWorker The getWorker function Monaco should use
   *                  The workers should be provided by the caller and bundled by their build system (e.g. Vite, Webpack)
   */
  static init({ getWorker }: { getWorker?: Environment['getWorker'] }): void {
    log.debug('Initializing Monaco...');

    if (getWorker !== undefined) {
      window.MonacoEnvironment = {
        getWorker,
      };
    }

    const { registerLanguages, removeHashtag } = MonacoUtils;

    const dhDarkRules = [
      { token: '', foreground: removeHashtag(MonacoTheme.foreground) },
      { token: 'string', foreground: removeHashtag(MonacoTheme.string) },
      {
        token: 'string.delim',
        foreground: removeHashtag(MonacoTheme['string-delim']),
      },
      { token: 'keyword', foreground: removeHashtag(MonacoTheme.keyword) },
      {
        token: 'identifier.js',
        foreground: removeHashtag(MonacoTheme['identifier-js']),
      },
      {
        token: 'delimiter',
        foreground: removeHashtag(MonacoTheme.delimiter),
      },
      { token: 'comment', foreground: removeHashtag(MonacoTheme.comment) },
      { token: 'number', foreground: removeHashtag(MonacoTheme.number) },
      { token: 'storage', foreground: removeHashtag(MonacoTheme.storage) },
      {
        token: 'identifier',
        foreground: removeHashtag(MonacoTheme.identifier),
      },
      {
        token: 'namespace.identifier',
        foreground: removeHashtag(MonacoTheme['namespace-identifier']),
      },
      { token: 'operator', foreground: removeHashtag(MonacoTheme.operator) },
      {
        token: 'predefined',
        foreground: removeHashtag(MonacoTheme.predefined),
      },
      {
        token: 'error.log',
        foreground: MonacoTheme['log-error'].substring(1),
      },
      {
        token: 'warn.log',
        foreground: removeHashtag(MonacoTheme['log-warn']),
      },
      {
        token: 'info.log',
        foreground: removeHashtag(MonacoTheme['log-info']),
      },
      {
        token: 'stdout.log',
        foreground: removeHashtag(MonacoTheme['log-stdout']),
      },
      {
        token: 'trace.log',
        foreground: removeHashtag(MonacoTheme['log-trace']),
      },
      {
        token: 'debug.log',
        foreground: removeHashtag(MonacoTheme['log-debug']),
      },
      {
        token: 'date.log',
        foreground: removeHashtag(MonacoTheme['log-date']),
      },
    ];

    const dhDarkColors = {
      errorForeground: MonacoTheme['error-foreground'],
      'inputOption.activeBorder': MonacoTheme['input-option-active-border'],
      'editor.background': MonacoTheme.background,
      'editor.foreground': MonacoTheme.foreground,
      'editor.lineHighlightBackground': MonacoTheme['editor-line-highlight-bg'],
      'editorLineNumber.foreground':
        MonacoTheme['editor-line-number-foreground'],
      'editor.selectionBackground': MonacoTheme['editor-selection-background'],
      'editor.findMatchBackground': MonacoTheme['editor-find-match-background'],
      'editor.findMatchHighlightBackground':
        MonacoTheme['editor-find-match-highlight-background'],
      'editorSuggestWidget.background':
        MonacoTheme['editor-suggest-widget-background'],
      'editorSuggestWidget.border': MonacoTheme['editor-suggest-widget-border'],
      'editorSuggestWidget.foreground':
        MonacoTheme['editor-suggest-widget-foreground'],
      'editorSuggestWidget.selectedBackground':
        MonacoTheme['editor-suggest-widget-selected-background'],
      'editorSuggestWidget.highlightForeground':
        MonacoTheme['editor-suggest-widget-highlightForeground'],
      'list.hoverBackground': MonacoTheme['list-hover-background'],
      'dropdown.background': MonacoTheme['context-menu-background'],
      'dropdown.foreground': MonacoTheme['context-menu-foreground'],
      'menu.selectionBackground': MonacoTheme['menu-selection-background'],
      'list.focusBackground': MonacoTheme['menu-selection-background'],
      'editorWidget.background': MonacoTheme['editor-widget-background'],
      'inputOption.activeBackground':
        MonacoTheme['input-option-active-background'],
      'inputOption.activeForeground':
        MonacoTheme['input-option-active-foreground'],
      focusBorder: MonacoTheme['focus-border'],
      'input.background': MonacoTheme['input-background'],
      'input.foreground': MonacoTheme['input-foreground'],
      'input.border': MonacoTheme['input-border'],
    };

    monaco.editor.defineTheme('dh-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: dhDarkRules,
      colors: dhDarkColors,
    });
    log.debug2('monaco theme: ', MonacoTheme);
    monaco.editor.setTheme('dh-dark');

    registerLanguages([DbLang, PyLang, GroovyLang, LogLang, ScalaLang]);

    log.debug('Monaco initialized.');
  }

  /**
   * Remove the hashtag prefix from a CSS color string.
   * Monaco expects colors to be the value only, no hashtag.
   * @param color The hex color string to remove the hashtag from, eg. '#ffffff'
   */
  static removeHashtag(color: string): string {
    return color.substring(1);
  }

  static registerLanguages(languages: Language[]): void {
    // First override the default loader for any language we have a custom definition for
    // https://github.com/Microsoft/monaco-editor/issues/252#issuecomment-482786867
    const languageIds = languages.map(({ id }) => id);
    monaco.languages
      .getLanguages()
      .filter(({ id }) => languageIds.includes(id))
      .forEach(languageParam => {
        const language = languageParam;
        log.debug2('Overriding default language loader:', language.id);
      });

    // Then register our language definitions
    languages.forEach(language => {
      MonacoUtils.registerLanguage(language);
    });
  }

  static registerLanguage(language: Language): void {
    log.debug2('Registering language: ', language.id);
    monaco.languages.register(language);

    monaco.languages.onLanguage(language.id, () => {
      monaco.languages.setLanguageConfiguration(language.id, language.conf);
      monaco.languages.setMonarchTokensProvider(language.id, language.language);
    });
  }

  /**
   * Set EOL preference for the editor
   * @param editor The editor to set the EOL for
   * @param eolSequence EOL sequence
   */
  static setEOL(
    editor: monaco.editor.IStandaloneCodeEditor,
    eolSequence = monaco.editor.EndOfLineSequence.LF
  ): void {
    editor.getModel()?.setEOL(eolSequence);
  }

  /**
   * Links an editor with a provided session to provide completion items.
   * @param session The IdeSession to link
   * @param editor The editor to link the session to
   * @returns A cleanup function for disposing of the created listeners
   */
  static openDocument(
    editor: monaco.editor.IStandaloneCodeEditor,
    session: IdeSession
  ): monaco.IDisposable {
    const model = editor.getModel();
    assertNotNull(model);
    const didOpenDocumentParams = {
      textDocument: {
        uri: `${model.uri}`,
        languageId: model.getLanguageId(),
        version: model.getVersionId(),
        text: model.getValue(),
      },
    };
    log.debug2('didOpenDocumentParams: ', didOpenDocumentParams);

    session.openDocument(didOpenDocumentParams);

    const dispose = editor.onDidChangeModelContent(changedEvent => {
      const { changes, versionId } = changedEvent;

      const contentChanges = [];
      for (let i = 0; i < changes.length; i += 1) {
        const change = changes[i];
        const { range, rangeLength, text } = change;
        const contentChange = {
          range: {
            start: {
              line: range.startLineNumber - 1,
              character: range.startColumn - 1,
            },
            end: {
              line: range.endLineNumber - 1,
              character: range.endColumn - 1,
            },
          },
          rangeLength,
          text,
        };

        contentChanges.push(contentChange);
      }

      if (contentChanges.length > 0) {
        const didChangeDocumentParams = {
          textDocument: {
            version: versionId,
            uri: `${model.uri}`,
          },
          contentChanges,
        };
        log.debug2('didChangeDocumentParams', didChangeDocumentParams);
        session.changeDocument(didChangeDocumentParams);
      }
    });

    return dispose;
  }

  static closeDocument(
    editor: monaco.editor.IStandaloneCodeEditor,
    session: IdeSession
  ): void {
    const model = editor.getModel();
    assertNotNull(model);
    const didCloseDocumentParams = {
      textDocument: {
        uri: `${model.uri}`,
      },
    };
    session.closeDocument(didCloseDocumentParams);
  }

  /**
   * Register a paste handle to clean up any garbage code pasted.
   * Most of this comes from copying from Slack, which has a bad habit of injecting their own characters in your code snippets.
   * I've emailed Slack about the issue and they're working on it. I can't reference a ticket number because their ticket system is entirely internally facing.
   * @param editor The editor the register the paste handler for
   */
  static registerPasteHandler(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    editor.onDidPaste(pasteEvent => {
      const smartQuotes = /“|”/g;
      const invalidChars = /\u200b/g;
      const editorModel = editor.getModel();
      assertNotNull(editorModel);
      const pastedText = editorModel.getValueInRange(pasteEvent.range);
      if (smartQuotes.test(pastedText) || invalidChars.test(pastedText)) {
        editorModel.applyEdits([
          {
            range: pasteEvent.range,
            text: pastedText
              .replace(smartQuotes, '"')
              .replace(invalidChars, ''),
          },
        ]);
      }
    });
  }

  static isMacPlatform(): boolean {
    const { platform } = window.navigator;
    return platform.startsWith('Mac');
  }

  /**
   * Remove any keybindings which are used for our own shortcuts.
   * This allows the key events to bubble up so a component higher up can capture them
   * @param editor The editor to remove the keybindings from
   */
  static removeConflictingKeybindings(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    // Multi-mod key events have a specific order
    // E.g. ctrl+alt+UpArrow is not found, but alt+ctrl+UpArrow is found
    // meta is WindowsKey on Windows and cmd on Mac
    // ctrl is ctrl Windows and ctrl on Mac
    // alt is alt on Windows and option on Mac
    const keybindings = [
      {
        windows: 'ctrl+D',
        mac: 'meta+D',
      },
      {
        windows: 'ctrl+H',
      },
    ];

    try {
      keybindings.forEach(keybinding => {
        if (
          (MonacoUtils.isMacPlatform() && keybinding.mac === '') ||
          (!MonacoUtils.isMacPlatform() && keybinding.windows === '')
        ) {
          return;
        }
        MonacoUtils.removeKeybinding(
          editor,
          MonacoUtils.isMacPlatform() ? keybinding.mac : keybinding.windows
        );
      });
    } catch (err) {
      // This is probably only caused by Monaco changing private methods used here
      log.error(err);
    }
  }

  /**
   * Remove a keybinding and allow the events to bubble up
   * If you want the keybinding removed for all editors, add it to removeConflictingKeybindings
   * Monaco still captures the event if you choose to override the keybinding with a no-op function
   *
   * Based on the following comment to remove a keybinding and let the event bubble up
   * https://github.com/microsoft/monaco-editor/issues/287#issuecomment-331447475
   * The issue for an API for this has apparently been open since 2016. Link below
   * https://github.com/microsoft/monaco-editor/issues/102
   * @param editor The editor to remove the keybinding from
   * @param keybinding The key string to remove. E.g. 'ctrl+C' for copy on Windows
   */
  static removeKeybinding(
    editor: monaco.editor.IStandaloneCodeEditor,
    keybinding: string | undefined
  ): void {
    if (keybinding === undefined) {
      return;
    }

    /* eslint-disable no-underscore-dangle */
    // It's possible a single keybinding has multiple commands depending on context
    // @ts-ignore
    const keybindings = editor._standaloneKeybindingService
      ._getResolver()
      ._map.get(keybinding);

    if (keybindings != null) {
      keybindings.forEach((elem: { command: unknown }) => {
        log.debug2(
          `Removing Monaco keybinding ${keybinding} for ${elem.command}`
        );
        // @ts-ignore
        editor._standaloneKeybindingService.addDynamicKeybinding(
          `-${elem.command}`,
          null,
          () => undefined
        );
      });
    } else {
      log.warn(`Did not find any keybindings to remove for ${keybinding}`);
    }
    /* eslint-enable no-underscore-dangle */
  }

  static getMonacoKeyCodeFromShortcut(shortcut: Shortcut): number {
    const { keyState } = shortcut;
    const { keyValue } = keyState;
    if (keyValue === null) {
      return 0;
    }

    const isMac = MonacoUtils.isMacPlatform();

    if (isMac) {
      return (
        // eslint-disable-next-line no-bitwise
        (keyState.metaKey ? monaco.KeyMod.CtrlCmd : 0) |
        (keyState.shiftKey ? monaco.KeyMod.Shift : 0) |
        (keyState.altKey ? monaco.KeyMod.Alt : 0) |
        (keyState.ctrlKey ? monaco.KeyMod.WinCtrl : 0) |
        KeyCodeUtils.fromString(keyValue)
      );
    }

    return (
      // eslint-disable-next-line no-bitwise
      (keyState.ctrlKey ? monaco.KeyMod.CtrlCmd : 0) |
      (keyState.shiftKey ? monaco.KeyMod.Shift : 0) |
      (keyState.altKey ? monaco.KeyMod.Alt : 0) |
      (keyState.metaKey ? monaco.KeyMod.WinCtrl : 0) |
      KeyCodeUtils.fromString(keyValue)
    );
  }
}

export default MonacoUtils;
