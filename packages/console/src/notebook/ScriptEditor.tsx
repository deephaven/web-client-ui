/**
 * Script editor for large blocks of code
 */
import React, { Component, ReactElement, RefObject } from 'react';
import { LoadingOverlay, ShortcutRegistry } from '@deephaven/components';
import Log from '@deephaven/log';
import { IdeSession } from '@deephaven/jsapi-shim';
import { assertNotNull } from '@deephaven/utils';
import { editor, IDisposable } from 'monaco-editor';
import Editor from './Editor';
import { MonacoCompletionProvider, MonacoUtils } from '../monaco';
import './ScriptEditor.scss';
import SHORTCUTS from '../ConsoleShortcuts';

const log = Log.module('ScriptEditor');

interface ScriptEditorProps {
  error?: { message?: string };
  isLoading: boolean;
  isLoaded: boolean;
  focusOnMount?: boolean;
  onChange: (e: editor.IModelContentChangedEvent) => void;
  onRunCommand: (command: string) => void;
  onEditorInitialized: (editor: editor.IStandaloneCodeEditor) => void;
  onEditorWillDestroy: (editor: editor.IStandaloneCodeEditor) => void;
  session: IdeSession | null;
  sessionLanguage?: string;
  settings?: editor.IStandaloneEditorConstructionOptions;
}

interface ScriptEditorState {
  model: editor.ITextModel | null;
}

class ScriptEditor extends Component<ScriptEditorProps, ScriptEditorState> {
  static defaultProps = {
    error: null,
    isLoading: false,
    isLoaded: false,
    focusOnMount: true,
    onChange: (): void => undefined,
    onEditorInitialized: (): void => undefined,
    onEditorWillDestroy: (): void => undefined,
    session: null,
  };

  constructor(props: ScriptEditorProps) {
    super(props);
    this.handleEditorInitialized = this.handleEditorInitialized.bind(this);
    this.handleEditorWillDestroy = this.handleEditorWillDestroy.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleRunSelected = this.handleRunSelected.bind(this);
    this.updateShortcuts = this.updateShortcuts.bind(this);

    this.contextActionCleanups = [];
    this.editorComponent = React.createRef();

    this.state = {
      model: null,
    };
  }

  componentDidMount(): void {
    ShortcutRegistry.addEventListener('onUpdate', this.updateShortcuts);
  }

  componentDidUpdate(prevProps: ScriptEditorProps): void {
    const { sessionLanguage, settings } = this.props;

    const language = settings?.language;

    const languageChanged = language !== prevProps.settings?.language;
    if (languageChanged) {
      log.debug('Set language', language);
      this.setLanguage(language);
    }

    const sessionDisconnected =
      sessionLanguage == null && prevProps.sessionLanguage != null;
    const languageMatch = language === sessionLanguage;
    const prevLanguageMatch =
      prevProps.settings?.language === prevProps.sessionLanguage;
    if (
      sessionDisconnected ||
      (sessionLanguage !== undefined && prevLanguageMatch && !languageMatch)
    ) {
      // Session disconnected or language changed from matching the session language to non-matching
      log.debug('De-init completion and context actions');
      this.deInitContextActions();
      this.deInitCodeCompletion();
    }

    const sessionConnected =
      sessionLanguage != null && prevProps.sessionLanguage == null;
    if (
      (sessionConnected && languageMatch) ||
      (sessionLanguage !== undefined && !prevLanguageMatch && languageMatch)
    ) {
      // Session connected with a matching language or notebook language changed to matching
      log.debug('Init completion and context actions');
      this.initContextActions();
      this.initCodeCompletion();
    }
  }

  componentWillUnmount(): void {
    ShortcutRegistry.removeEventListener('onUpdate', this.updateShortcuts);
  }

  contextActionCleanups: IDisposable[];

  completionCleanup?: IDisposable;

  editor?: editor.IStandaloneCodeEditor;

  editorComponent: RefObject<Editor>;

  getValue(): string | null {
    if (this.editor) {
      return this.editor.getValue();
    }
    log.error('Editor not initialized');
    return null;
  }

  getSelectedCommand(): string {
    const range = this.editor?.getSelection();
    assertNotNull(range);
    const model = this.editor?.getModel();
    assertNotNull(model);
    const { startLineNumber, endColumn } = range;
    let { endLineNumber } = range;
    if (endColumn === 1 && endLineNumber > startLineNumber) {
      endLineNumber -= 1;
    }
    const startLineMinColumn = model?.getLineMinColumn(startLineNumber);
    const endLineMaxColumn = model?.getLineMaxColumn(endLineNumber);
    const wholeLineRange = range
      .setStartPosition(startLineNumber, startLineMinColumn)
      .setEndPosition(endLineNumber, endLineMaxColumn);
    return model?.getValueInRange(wholeLineRange);
  }

  handleEditorInitialized(innerEditor: editor.IStandaloneCodeEditor): void {
    const {
      focusOnMount,
      onChange,
      onEditorInitialized,
      settings,
      session,
      sessionLanguage,
    } = this.props;

    log.debug('handleEditorInitialized', sessionLanguage, session, settings);

    this.editor = innerEditor;
    this.setState({ model: this.editor.getModel() });

    MonacoUtils.setEOL(innerEditor);
    MonacoUtils.registerPasteHandler(innerEditor);

    if (session != null && settings && sessionLanguage === settings.language) {
      this.initContextActions();
      this.initCodeCompletion();
    }

    innerEditor.onDidChangeModelContent(onChange);
    if (focusOnMount != null && focusOnMount) {
      innerEditor.focus();
    }

    onEditorInitialized(this.editor);
  }

  handleEditorWillDestroy(innerEditor: editor.IStandaloneCodeEditor): void {
    log.debug('handleEditorWillDestroy');
    const { onEditorWillDestroy } = this.props;
    onEditorWillDestroy(innerEditor);
    this.deInitContextActions();
    this.deInitCodeCompletion();
    this.setState({ model: null });
    this.editor = undefined;
  }

  handleRun(): void {
    const { onRunCommand } = this.props;
    const command = this.getValue();
    if (command != null) {
      onRunCommand(command);
    }
  }

  handleRunSelected(): void {
    const { onRunCommand } = this.props;
    const command = this.getSelectedCommand();
    onRunCommand(command);
  }

  initContextActions(): void {
    if (this.contextActionCleanups.length > 0) {
      log.error('Context actions already initialized.');
      return;
    }

    if (!this.editor) {
      return;
    }

    const cleanups = [];
    cleanups.push(
      this.editor.addAction({
        id: 'run-code',
        label: 'Run',
        keybindings: [
          MonacoUtils.getMonacoKeyCodeFromShortcut(SHORTCUTS.NOTEBOOK.RUN),
        ],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,

        run: () => {
          this.handleRun();
        },
      })
    );

    cleanups.push(
      this.editor.addAction({
        id: 'run-selected-code',
        label: 'Run Selected',
        keybindings: [
          MonacoUtils.getMonacoKeyCodeFromShortcut(
            SHORTCUTS.NOTEBOOK.RUN_SELECTED
          ),
        ],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,

        run: () => {
          this.handleRunSelected();
        },
      })
    );

    this.contextActionCleanups = cleanups;
  }

  deInitContextActions(): void {
    if (this.contextActionCleanups.length > 0) {
      this.contextActionCleanups.forEach(cleanup => cleanup.dispose());
      this.contextActionCleanups = [];
    }
  }

  updateShortcuts(): void {
    this.deInitContextActions();
    this.initContextActions();
  }

  initCodeCompletion(): void {
    if (this.completionCleanup != null) {
      log.error('Code completion already initialized.');
      return;
    }
    const { session } = this.props;
    log.debug('initCodeCompletion', this.editor, session);
    if (this.editor && session != null) {
      this.completionCleanup = MonacoUtils.openDocument(this.editor, session);
    }
  }

  deInitCodeCompletion(): void {
    const { session } = this.props;
    log.debug('deInitCodeCompletion', this.editor, session);
    if (this.completionCleanup) {
      this.completionCleanup.dispose();
      this.completionCleanup = undefined;
      if (this.editor && session != null) {
        MonacoUtils.closeDocument(this.editor, session);
      }
    }
  }

  append(text: string, focus = true): void {
    assertNotNull(this.editor);
    const model = this.editor.getModel();
    assertNotNull(model);
    const currentText = model.getValue();
    if (currentText) {
      model.setValue(`${currentText}\n${text}`);
    } else {
      model.setValue(`${text}`);
    }

    const lastLine = model.getLineCount();
    const column = model.getLineLength(lastLine) + 1;

    this.editor.setPosition({ lineNumber: lastLine, column });

    if (focus) {
      this.editor.focus();
    }
  }

  updateDimensions(): void {
    log.debug('updateDimensions');
    if (this.editor) {
      this.editor.layout();
    }
  }

  focus(): void {
    log.debug('focus');
    if (this.editor) {
      this.editor.focus();
    }
  }

  toggleFind(): void {
    if (this.editorComponent.current) {
      this.editorComponent.current.toggleFind();
    }
  }

  setLanguage(language?: string): void {
    if (this.editorComponent.current && language !== undefined) {
      this.editorComponent.current.setLanguage(language);
    }
  }

  render(): ReactElement {
    const {
      error,
      isLoaded,
      isLoading,
      session,
      sessionLanguage,
      settings,
    } = this.props;
    const { model } = this.state;
    const errorMessage = error ? `Unable to open document. ${error}` : null;
    const editorLanguage = settings ? settings.language ?? null : null;
    const completionProviderEnabled =
      model && session && editorLanguage === sessionLanguage;

    return (
      <>
        {(error || isLoading) && (
          <div className="h-100 w-100 position-relative">
            <LoadingOverlay
              errorMessage={errorMessage}
              isLoading={isLoading}
              isLoaded={isLoaded}
            />
          </div>
        )}

        {isLoaded && (
          <div className="h-100 w-100 script-editor">
            {settings && (
              <>
                <Editor
                  ref={this.editorComponent}
                  settings={settings}
                  onEditorInitialized={this.handleEditorInitialized}
                  onEditorWillDestroy={this.handleEditorWillDestroy}
                />
                {completionProviderEnabled != null &&
                  completionProviderEnabled && (
                    <MonacoCompletionProvider
                      model={model}
                      language={editorLanguage}
                      session={session}
                    />
                  )}
              </>
            )}
          </div>
        )}
      </>
    );
  }
}

export default ScriptEditor;
