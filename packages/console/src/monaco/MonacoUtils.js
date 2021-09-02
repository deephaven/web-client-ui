/**
 * Exports a function for initializing monaco with the deephaven theme/config
 */
// Instead of importing just 'monaco-editor' and importing all languages and features, just import the features and don't import all the languages we don't care about
// Default list of features here: https://github.com/microsoft/monaco-editor-webpack-plugin
// Mapping to paths here: https://github.com/microsoft/monaco-editor-webpack-plugin/blob/main/src/features.ts
// Importing this way rather than using the plugin because I don't want to hook up react-app-rewired for the build
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp';
import 'monaco-editor/esm/vs/editor/contrib/anchorSelect/anchorSelect';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching';
import 'monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations';
import 'monaco-editor/esm/vs/editor/contrib/clipboard/clipboard';
import 'monaco-editor/esm/vs/editor/contrib/codeAction/codeActionContributions';
import 'monaco-editor/esm/vs/editor/contrib/codelens/codelensController';
import 'monaco-editor/esm/vs/editor/contrib/colorPicker/colorContributions';
import 'monaco-editor/esm/vs/editor/contrib/comment/comment';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu';
import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands';
import 'monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo';
import 'monaco-editor/esm/vs/editor/contrib/dnd/dnd';
import 'monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols';
import 'monaco-editor/esm/vs/editor/contrib/find/findController';
import 'monaco-editor/esm/vs/editor/contrib/folding/folding';
import 'monaco-editor/esm/vs/editor/contrib/fontZoom/fontZoom';
import 'monaco-editor/esm/vs/editor/contrib/format/formatActions';
import 'monaco-editor/esm/vs/editor/contrib/gotoError/gotoError';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess';
import 'monaco-editor/esm/vs/editor/contrib/gotoSymbol/goToCommands';
import 'monaco-editor/esm/vs/editor/contrib/gotoSymbol/link/goToDefinitionAtPosition';
import 'monaco-editor/esm/vs/editor/contrib/hover/hover';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard';
import 'monaco-editor/esm/vs/editor/contrib/inPlaceReplace/inPlaceReplace';
import 'monaco-editor/esm/vs/editor/contrib/indentation/indentation';
import 'monaco-editor/esm/vs/editor/contrib/inlineCompletions/ghostTextController';
import 'monaco-editor/esm/vs/editor/contrib/inlayHints/inlayHintsController';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens';
import 'monaco-editor/esm/vs/editor/contrib/linesOperations/linesOperations';
import 'monaco-editor/esm/vs/editor/contrib/linkedEditing/linkedEditing';
import 'monaco-editor/esm/vs/editor/contrib/links/links';
import 'monaco-editor/esm/vs/editor/contrib/multicursor/multicursor';
import 'monaco-editor/esm/vs/editor/contrib/parameterHints/parameterHints';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch';
import 'monaco-editor/esm/vs/editor/contrib/rename/rename';
import 'monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect';
import 'monaco-editor/esm/vs/editor/contrib/snippet/snippetController2';
import 'monaco-editor/esm/vs/editor/contrib/suggest/suggestController';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast';
import 'monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/toggleTabFocusMode';
import 'monaco-editor/esm/vs/editor/contrib/caretOperations/transpose';
import 'monaco-editor/esm/vs/editor/contrib/unusualLineTerminators/unusualLineTerminators';
import 'monaco-editor/esm/vs/editor/contrib/viewportSemanticTokens/viewportSemanticTokens';
import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter';
import 'monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations';
import 'monaco-editor/esm/vs/editor/contrib/wordPartOperations/wordPartOperations';
import Log from '@deephaven/log';
import MonacoTheme from './MonacoTheme.module.scss';
import PyLang from './lang/python';
import GroovyLang from './lang/groovy';
import DbLang from './lang/db';
import LogLang from './lang/log';

const log = Log.module('MonacoUtils');

class MonacoUtils {
  static init() {
    log.debug('Initializing Monaco...');

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

    registerLanguages([DbLang, PyLang, GroovyLang, LogLang]);

    log.debug('Monaco initialized.');
  }

  /**
   * Remove the hashtag prefix from a CSS color string.
   * Monaco expects colors to be the value only, no hashtag.
   * @param {String} color The hex color string to remove the hashtag from, eg. '#ffffff'
   */
  static removeHashtag(color) {
    return color.substring(1);
  }

  static registerLanguages(languages) {
    // First override the default loader for any language we have a custom definition for
    // https://github.com/Microsoft/monaco-editor/issues/252#issuecomment-482786867
    const languageIds = languages.map(({ id }) => id);
    monaco.languages
      .getLanguages()
      .filter(({ id }) => languageIds.includes(id))
      .forEach(languageParam => {
        const language = languageParam;
        log.debug2('Overriding default language loader:', language.id);
        language.loader = () => ({
          then: () => {},
        });
      });

    // Then register our language definitions
    languages.forEach(language => {
      MonacoUtils.registerLanguage(language);
    });
  }

  static registerLanguage(language) {
    log.debug2('Registering language: ', language.id);
    monaco.languages.register(language);

    monaco.languages.onLanguage(language.id, () => {
      monaco.languages.setLanguageConfiguration(language.id, language.conf);
      monaco.languages.setMonarchTokensProvider(language.id, language.language);
    });
  }

  /**
   * Set EOL preference for the editor
   * @param {monaco.editor.IEditor} editor The editor to set the EOL for
   * @param {monaco.editor.EndOfLineSequence} eolSequence EOL sequence
   */
  static setEOL(editor, eolSequence = monaco.editor.EndOfLineSequence.LF) {
    editor.getModel().setEOL(eolSequence);
  }

  /**
   * Links an editor with a provided session to provide completion items.
   * @param {dh.IdeSession} session The IdeSession to link
   * @param {monaco.editor.IEditor} editor The editor to link the session to
   * @return A cleanup function for disposing of the created listeners
   */
  static openDocument(editor, session) {
    const model = editor.getModel();
    const didOpenDocumentParams = {
      textDocument: {
        uri: `${model.uri}`,
        languageId: model.getModeId(),
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

  static closeDocument(editor, session) {
    const model = editor.getModel();
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
   * @param {Monaco.editor} editor The editor the register the paste handler for
   */
  static registerPasteHandler(editor) {
    editor.onDidPaste(pasteEvent => {
      const smartQuotes = /“|”/g;
      const invalidChars = /\u200b/g;
      const editorModel = editor.getModel();
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

  static isMacPlatform() {
    const { platform } = window.navigator;
    return platform.startsWith('Mac');
  }

  /**
   * Remove any keybindings which are used for our own shortcuts.
   * This allows the key events to bubble up so a component higher up can capture them
   * @param {Monaco.editor} editor The editor to remove the keybindings from
   */
  static removeConflictingKeybindings(editor) {
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
      keybindings.forEach(keybinding =>
        MonacoUtils.removeKeybinding(
          editor,
          MonacoUtils.isMacPlatform() ? keybinding.mac : keybinding.windows
        )
      );
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
   * @param {Monaco.editor} editor The editor to remove the keybinding from
   * @param {string} keybinding The key string to remove. E.g. 'ctrl+C' for copy on Windows
   */
  static removeKeybinding(editor, keybinding) {
    if (!keybinding) {
      return;
    }
    /* eslint-disable no-underscore-dangle */
    // It's possible a single keybinding has multiple commands depending on context
    const keybindings = editor._standaloneKeybindingService
      ._getResolver()
      ._map.get(keybinding);

    if (keybindings) {
      keybindings.forEach(elem => {
        log.debug2(
          `Removing Monaco keybinding ${keybinding} for ${elem.command}`
        );
        editor._standaloneKeybindingService.addDynamicKeybinding(
          `-${elem.command}`,
          null,
          () => {}
        );
      });
    } else {
      log.warn(`Did not find any keybindings to remove for ${keybinding}`);
    }
    /* eslint-enable no-underscore-dangle */
  }
}

export default MonacoUtils;
