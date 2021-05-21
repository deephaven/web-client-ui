/**
 * Script editor for large blocks of code
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { LoadingOverlay } from '@deephaven/components';
import Log from '@deephaven/log';
import Editor from './Editor';
import MonacoCompletionProvider from '../MonacoCompletionProvider';
import MonacoUtils from '../monaco/MonacoUtils';

import './ScriptEditor.scss';

const log = Log.module('ScriptEditor');

class ScriptEditor extends Component {
  constructor(props) {
    super(props);
    this.handleEditorInitialized = this.handleEditorInitialized.bind(this);
    this.handleEditorWillDestroy = this.handleEditorWillDestroy.bind(this);
    this.handleRun = this.handleRun.bind(this);
    this.handleRunSelected = this.handleRunSelected.bind(this);

    this.contextActionCleanups = [];
    this.completionCleanup = null;
    this.editor = null;
    this.editorComponent = React.createRef();

    this.state = {
      model: null,
    };
  }

  componentDidUpdate(prevProps) {
    const { sessionLanguage, settings } = this.props;
    const { language } = settings;

    const languageChanged = language !== prevProps.settings.language;
    if (languageChanged) {
      log.debug('Set language', language);
      this.setLanguage(language);
    }

    const sessionDisconnected =
      sessionLanguage == null && prevProps.sessionLanguage != null;
    const languageMatch = language === sessionLanguage;
    const prevLanguageMatch =
      prevProps.settings.language === prevProps.sessionLanguage;
    if (
      sessionDisconnected ||
      (sessionLanguage && prevLanguageMatch && !languageMatch)
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
      (sessionLanguage && !prevLanguageMatch && languageMatch)
    ) {
      // Session connected with a matching language or notebook language changed to matching
      log.debug('Init completion and context actions');
      this.initContextActions();
      this.initCodeCompletion();
    }
  }

  getValue() {
    if (this.editor) {
      return this.editor.getValue();
    }
    log.error('Editor not initialized');
    return null;
  }

  getSelectedCommand() {
    const range = this.editor.getSelection();
    const model = this.editor.getModel();
    const { startLineNumber, endLineNumber } = range;
    const startLineMinColumn = model.getLineMinColumn(startLineNumber);
    const endLineMaxColumn = model.getLineMaxColumn(endLineNumber);
    const wholeLineRange = range
      .setStartPosition(startLineNumber, startLineMinColumn)
      .setEndPosition(endLineNumber, endLineMaxColumn);
    return model.getValueInRange(wholeLineRange);
  }

  handleEditorInitialized(editor) {
    const {
      focusOnMount,
      onChange,
      settings,
      session,
      sessionLanguage,
    } = this.props;

    log.debug('handleEditorInitialized', sessionLanguage, session, settings);

    this.editor = editor;
    this.setState({ model: this.editor.getModel() });

    MonacoUtils.setEOL(editor);
    MonacoUtils.registerPasteHandler(editor);

    if (session && settings && sessionLanguage === settings.language) {
      this.initContextActions();
      this.initCodeCompletion();
    }

    editor.onDidChangeModelContent(onChange);
    if (focusOnMount) {
      editor.focus();
    }
  }

  handleEditorWillDestroy() {
    log.debug('handleEditorWillDestroy');
    this.deInitContextActions();
    this.deInitCodeCompletion();
    this.setState({ model: null });
    this.editor = null;
  }

  handleRun() {
    const { onRunCommand } = this.props;
    const command = this.getValue();
    onRunCommand(command);
  }

  handleRunSelected() {
    const { onRunCommand } = this.props;
    const command = this.getSelectedCommand();
    onRunCommand(command);
  }

  initContextActions() {
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
        // eslint-disable-next-line no-bitwise
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KEY_R],
        precondition: null,

        keybindingContext: null,
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,

        run: () => {
          this.handleRun();
          return null;
        },
      })
    );

    cleanups.push(
      this.editor.addAction({
        id: 'run-selected-code',
        label: 'Run Selected',
        keybindings: [
          // eslint-disable-next-line no-bitwise
          monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KEY_R,
        ],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,

        run: () => {
          this.handleRunSelected();
          return null;
        },
      })
    );

    this.contextActionCleanups = cleanups;
  }

  deInitContextActions() {
    if (this.contextActionCleanups.length > 0) {
      this.contextActionCleanups.forEach(cleanup => cleanup.dispose());
      this.contextActionCleanups = [];
    }
  }

  initCodeCompletion() {
    if (this.completionCleanup != null) {
      log.error('Code completion already initialized.');
      return;
    }
    const { session } = this.props;
    log.debug('initCodeCompletion', this.editor, session);
    if (this.editor && session) {
      // this.completionCleanup = MonacoUtils.openDocument(this.editor, session);
    }
  }

  deInitCodeCompletion() {
    const { session } = this.props;
    log.debug('deInitCodeCompletion', this.editor, session);
    if (this.completionCleanup) {
      this.completionCleanup.dispose();
      this.completionCleanup = null;
    }
    if (this.editor && session) {
      // MonacoUtils.closeDocument(this.editor, session);
    }
  }

  append(text, focus = true) {
    const model = this.editor.getModel();
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

  updateDimensions() {
    log.debug('updateDimensions');
    if (this.editor) {
      this.editor.layout();
    }
  }

  focus() {
    log.debug('focus');
    if (this.editor) {
      this.editor.focus();
    }
  }

  toggleFind() {
    if (this.editorComponent.current) {
      this.editorComponent.current.toggleFind();
    }
  }

  setLanguage(language) {
    if (this.editorComponent.current) {
      this.editorComponent.current.setLanguage(language);
    }
  }

  render() {
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
    const editorLanguage = settings ? settings.language : null;
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
                {completionProviderEnabled && (
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

ScriptEditor.propTypes = {
  error: PropTypes.shape({ message: PropTypes.string }),
  isLoading: PropTypes.bool,
  isLoaded: PropTypes.bool,
  focusOnMount: PropTypes.bool,
  onChange: PropTypes.func,
  onRunCommand: PropTypes.func.isRequired,
  session: PropTypes.shape({}),
  sessionLanguage: PropTypes.string,
  settings: PropTypes.shape({
    language: PropTypes.string,
    value: PropTypes.string,
  }),
};

ScriptEditor.defaultProps = {
  error: null,
  isLoading: false,
  isLoaded: false,
  focusOnMount: true,
  onChange: () => {},
  session: null,
  sessionLanguage: null,
  settings: null,
};

export default ScriptEditor;
