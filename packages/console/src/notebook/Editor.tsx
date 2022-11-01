/**
 * Editor editor for large blocks of code
 */
import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import * as monaco from 'monaco-editor';
import { assertNotNull } from '@deephaven/utils';
import MonacoUtils from '../monaco/MonacoUtils';

interface EditorProps {
  className: string;
  onEditorInitialized: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  onEditorWillDestroy: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  handleToggleMinimap: () => void;
  handleToggleWordWrap: () => void;
  settings: Record<string, unknown>;
}

class Editor extends Component<EditorProps, Record<string, never>> {
  static defaultProps = {
    className: 'fill-parent-absolute',
    onEditorInitialized: (): void => undefined,
    onEditorWillDestroy: (): void => undefined,
    handleToggleMinimap: (): void => undefined,
    handleToggleWordWrap: (): void => undefined,
    settings: {},
  };

  constructor(props: EditorProps) {
    super(props);

    this.handleResize = this.handleResize.bind(this);

    this.container = null;
    this.state = {};

    this.isMinimapEnabled = false;
    this.isWordWrapEnabled = false;
  }

  componentDidMount(): void {
    this.initEditor();

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);

    this.destroyEditor();
  }

  container: HTMLDivElement | null;

  editor?: monaco.editor.IStandaloneCodeEditor;

  isMinimapEnabled: boolean;

  isWordWrapEnabled: boolean;

  setLanguage(language: string): void {
    if (this.editor) {
      const model = this.editor.getModel();
      assertNotNull(model);
      monaco.editor.setModelLanguage(model, language);
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

  toggleMinimap(): void {
    if (this.editor) {
      const { handleToggleMinimap } = this.props;
      this.isMinimapEnabled = !this.isMinimapEnabled;
      handleToggleMinimap();
      this.editor.updateOptions({
        minimap: { enabled: this.isMinimapEnabled },
      });
    }
  }

  toggleWordWrap(): void {
    if (this.editor) {
      const { handleToggleWordWrap } = this.props;
      this.isWordWrapEnabled = !this.isWordWrapEnabled;
      handleToggleWordWrap();
      this.editor.updateOptions({
        wordWrap: this.isWordWrapEnabled ? 'on' : 'off',
      });
    }
  }

  updateDimensions(): void {
    this.editor?.layout();
  }

  initEditor(): void {
    const { onEditorInitialized } = this.props;
    let { settings } = this.props;
    if (typeof settings.wordWrap === 'string') {
      this.isWordWrapEnabled = settings.wordWrap === 'on';
    }
    if (typeof settings.minimap === 'boolean') {
      this.isMinimapEnabled = settings.minimap;
      settings.minimap = { enabled: settings.minimap };
    }
    settings = {
      copyWithSyntaxHighlighting: 'false',
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
      ...settings,
    };
    assertNotNull(this.container);
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
    this.editor.addAction({
      id: 'minimap',
      label: 'Minimap',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.Alt | monaco.KeyCode.KeyM,
      ],
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 2.0,

      run: () => {
        this.toggleMinimap();
      },
    });
    this.editor.addAction({
      id: 'wordWrap',
      label: 'Word wrap',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.Alt | monaco.KeyCode.KeyZ,
      ],
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 3.0,

      run: () => {
        this.toggleWordWrap();
      },
    });
    this.editor.layout();
    MonacoUtils.removeConflictingKeybindings(this.editor);

    onEditorInitialized(this.editor);
  }

  destroyEditor(): void {
    const { onEditorWillDestroy } = this.props;
    assertNotNull(this.editor);
    onEditorWillDestroy(this.editor);
    this.editor.dispose();
    this.editor = undefined;
  }

  render(): ReactElement {
    const { className } = this.props;
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
