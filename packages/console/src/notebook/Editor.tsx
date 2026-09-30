/**
 * Editor editor for large blocks of code
 */
import React, { Component, type ReactElement } from 'react';
import classNames from 'classnames';
import type * as monaco from 'monaco-editor';
import { assertNotNull } from '@deephaven/utils';
import MonacoUtils from '../monaco/MonacoUtils';
import './Editor.scss';

export interface EditorProps {
  className: string;
  onEditorInitialized: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  onEditorWillDestroy: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  settings: monaco.editor.IStandaloneEditorConstructionOptions;
}

class Editor extends Component<EditorProps, { error?: unknown }> {
  static defaultProps = {
    className: 'fill-parent-absolute',
    onEditorInitialized: (): void => undefined,
    onEditorWillDestroy: (): void => undefined,
    settings: {},
  };

  constructor(props: EditorProps) {
    super(props);

    this.handleResize = this.handleResize.bind(this);

    this.container = null;
    this.state = {};
  }

  componentDidMount(): void {
    this.initEditor().catch(error => {
      this.setState({ error });
    });

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);

    this.destroyEditor();
  }

  container: HTMLDivElement | null;

  editor?: monaco.editor.IStandaloneCodeEditor;

  setLanguage(language: string): void {
    if (this.editor) {
      const model = this.editor.getModel();
      assertNotNull(model);
      MonacoUtils.getMonaco().editor.setModelLanguage(model, language);
    }
  }

  handleResize(): void {
    this.updateDimensions();
  }

  toggleFind(): void {
    if (this.editor) {
      // The actions.find action can no longer be triggered when the editor is not in focus, with monaco 0.22.x.
      // As a workaround, just focus the editor before triggering the action
      // https://github.com/microsoft/monaco-editor/issues/2355
      this.editor.focus();
      this.editor.trigger('toggleFind', 'actions.find', undefined);
    }
  }

  updateDimensions(): void {
    this.editor?.layout();
  }

  async initEditor(): Promise<void> {
    const monaco = await MonacoUtils.load();
    // Unmounted, or mounted again, while loading
    if (this.container == null || this.editor != null) {
      return;
    }

    const { onEditorInitialized } = this.props;
    let { settings } = this.props;
    settings = {
      copyWithSyntaxHighlighting: false,
      fixedOverflowWidgets: true,
      folding: false,
      fontFamily: 'Fira Mono',
      glyphMargin: false,
      language: `python`,
      lineNumbersMinChars: 3,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabCompletion: 'on',
      value: '',
      wordWrap: 'off',
      links: true,
      autoClosingBrackets: 'beforeWhitespace',
      ...settings,
    };

    this.editor = monaco.editor.create(this.container, settings);

    this.editor.addAction({
      id: 'find',
      label: 'Find',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
      ],
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.0,

      run: () => {
        this.toggleFind();
      },
    });
    this.editor.layout();

    MonacoUtils.registerLinkProvider();

    onEditorInitialized(this.editor);
  }

  destroyEditor(): void {
    const { onEditorWillDestroy } = this.props;
    if (this.editor == null) {
      return;
    }
    onEditorWillDestroy(this.editor);
    this.editor.dispose();
    this.editor = undefined;
  }

  render(): ReactElement {
    const { className } = this.props;
    const { error } = this.state;
    if (error != null) {
      // Surface a failed Monaco load to the nearest error boundary
      throw error;
    }
    return (
      <div
        className={classNames('editor-container', className)}
        ref={container => {
          this.container = container;
        }}
      />
    );
  }
}

export default Editor;
