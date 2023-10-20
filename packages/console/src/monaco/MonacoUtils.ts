/* eslint-disable @typescript-eslint/ban-ts-comment */
import shortid from 'shortid';
/**
 * Exports a function for initializing monaco with the deephaven theme/config
 */
import { resolveCssVariablesInRecord, Shortcut } from '@deephaven/components';
import type { IdeSession } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
import { find as linkifyFind } from 'linkifyjs';
import * as monaco from 'monaco-editor';
import type { Environment } from 'monaco-editor';
// @ts-ignore
import { KeyCodeUtils } from 'monaco-editor/esm/vs/base/common/keyCodes.js';
import Log from '@deephaven/log';
import MonacoThemeRaw from './MonacoTheme.module.scss';
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
  static init({
    getWorker,
  }: { getWorker?: Environment['getWorker'] } = {}): void {
    log.debug('Initializing Monaco...');

    if (getWorker !== undefined) {
      MonacoUtils.registerGetWorker(getWorker);
    }

    const { registerLanguages, removeHashtag } = MonacoUtils;

    const MonacoTheme = resolveCssVariablesInRecord(MonacoThemeRaw);
    log.debug2('Monaco theme:', MonacoThemeRaw);
    log.debug2('Monaco theme derived:', MonacoTheme);

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
      'editorSuggestWidget.selectedForeground':
        MonacoTheme['editor-suggest-widget-selected-foreground'],
      'editorSuggestWidget.highlightForeground':
        MonacoTheme['editor-suggest-widget-highlightForeground'],
      'editorSuggestWidget.focusHighlightForeground':
        MonacoTheme['editor-suggest-widget-focus-highlight-foreground'],
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
      'textLink.foreground': MonacoTheme['text-link-foreground'],
      'textLink.activeForeground': MonacoTheme['text-link-active-foreground'],
      'editorLink.activeForeground':
        MonacoTheme['editor-link-active-foreground'],
    };

    monaco.editor.defineTheme('dh-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: dhDarkRules,
      colors: dhDarkColors,
    });

    monaco.editor.setTheme('dh-dark');

    registerLanguages([DbLang, PyLang, GroovyLang, LogLang, ScalaLang]);

    MonacoUtils.removeConflictingKeybindings();

    log.debug('Monaco initialized.');
  }

  /**
   * Register the getWorker function for Monaco
   * @param getWorker The getWorker function for Monaco
   */
  static registerGetWorker(getWorker: Environment['getWorker']): void {
    window.MonacoEnvironment = {
      ...window.MonacoEnvironment,
      getWorker,
    };
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
      const invalidChars = /\u200b/g; // zero width space
      const invalidSpaces = /\u00A0/g; // non-breaking space
      const editorModel = editor.getModel();
      assertNotNull(editorModel);
      const pastedText = editorModel.getValueInRange(pasteEvent.range);
      if (
        smartQuotes.test(pastedText) ||
        invalidChars.test(pastedText) ||
        invalidSpaces.test(pastedText)
      ) {
        editorModel.applyEdits([
          {
            range: pasteEvent.range,
            text: pastedText
              .replace(smartQuotes, '"')
              .replace(invalidChars, '')
              .replace(invalidSpaces, ' '),
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
   * This allows the key events to bubble up so a component higher up can capture
   * them. Note that this is a global configuration, so all editor instances will
   * be impacted.
   */
  static removeConflictingKeybindings(): void {
    // All editor instances share a global keybinding registry which is where
    // default keybindings are set. There doesn't appear to be a way to remove
    // default bindings, but we can add new ones that will override the existing
    // ones and set `command` to null. This will treat the key events as unhandled
    // and allow them to bubble up.
    monaco.editor.addKeybindingRule(
      // Restart console in Enterprise (see Shortcuts.ts)
      {
        /* eslint-disable-next-line no-bitwise */
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
        command: null,
      }
    );

    // Ctrl+H is used to focus Community console history in Windows + Linux.
    // An alternate shortcut is used for Mac, so no need to override it
    // (See ConsoleShortcuts.ts)
    if (!MonacoUtils.isMacPlatform()) {
      monaco.editor.addKeybindingRule({
        /* eslint-disable-next-line no-bitwise */
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH,
        command: null,
      });
    }
  }

  /**
   * Creates actions with a `noop` run function to disable specified keybindings.
   * Note that this will swallow the events. To disable default keybindings in a
   * way that allows events to propagate upward, see `removeConflictingKeybindings`
   * @param editor Editor to disable keybindings for
   * @param keybindings List of monaco keybindings to disable. Often a bitwise
   * combination like `monaco.KeyMod.Alt | monaco.KeyMod.KeyJ`
   */
  static disableKeyBindings(
    editor: monaco.editor.IStandaloneCodeEditor,
    keybindings: number[]
  ): void {
    editor.addAction({
      // This shouldn't be referenced by anything so using an arbitrary unique id
      id: `disable-keybindings-${shortid()}`,
      label: '', // This action won't be shown in the UI so no need for a label
      keybindings,
      run: () => undefined,
    });
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

  static provideLinks(model: monaco.editor.ITextModel): {
    links: monaco.languages.ILink[];
  } {
    const newTokens: monaco.languages.ILink[] = [];

    for (let i = 1; i <= model.getLineCount(); i += 1) {
      const lineText = model.getLineContent(i);
      const originalTokens = linkifyFind(lineText);

      const tokens = originalTokens.filter(token => {
        if (token.type === 'url') {
          return /^https?:\/\//.test(token.value);
        }
        return true;
      });
      // map the tokens to the ranges - you know the line number now, use the token start/end as the startColumn/endColumn
      tokens.forEach(token => {
        newTokens.push({
          url: token.href,
          range: new monaco.Range(i, token.start + 1, i, token.end + 1),
        });
      });
    }

    return {
      links: newTokens,
    };
  }
}

export default MonacoUtils;
