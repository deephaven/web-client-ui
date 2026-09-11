import React, { Component, type ReactElement } from 'react';
import type * as monaco from 'monaco-editor';
import { Editor } from '@deephaven/console';
import classNames from 'classnames';
import './InputEditor.scss';

interface InputEditorProps {
  className?: string;
  placeholder?: string;
  value: string;
  onContentChanged: (value?: string) => void;
  editorSettings: Partial<monaco.editor.IStandaloneEditorConstructionOptions>;
  editorIndex: number;
  onTab: (editorIndex: number, shiftKey: boolean) => void;
  invalid: boolean;
}

interface InputEditorState {
  isEditorFocused: boolean;
  isEditorEmpty: boolean;
}
/**
 * A monaco editor that looks like an general input
 */

export class InputEditor extends Component<InputEditorProps, InputEditorState> {
  static defaultProps = {
    value: '',
    onContentChanged: (): void => undefined,
    editorSettings: {},
    editorIndex: 0,
    onTab: (): void => undefined,
    invalid: false,
  };

  constructor(props: InputEditorProps) {
    super(props);

    this.handleContentChanged = this.handleContentChanged.bind(this);
    this.handleEditorInitialized = this.handleEditorInitialized.bind(this);
    this.handleEditorWillDestroy = this.handleEditorWillDestroy.bind(this);
    this.handleEditorFocus = this.handleEditorFocus.bind(this);
    this.handleEditorBlur = this.handleEditorBlur.bind(this);
    this.handleContainerClick = this.handleContainerClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.state = {
      isEditorFocused: false,
      isEditorEmpty: true,
    };
  }

  editor?: monaco.editor.IStandaloneCodeEditor;

  getEditorSettings(): monaco.editor.IStandaloneEditorConstructionOptions {
    const { value, editorSettings, placeholder } = this.props;
    return {
      ariaLabel: placeholder === '' ? undefined : placeholder,
      copyWithSyntaxHighlighting: false,
      fixedOverflowWidgets: true,
      folding: false,
      fontFamily: 'Fira Mono',
      glyphMargin: false,
      language: 'groovyDB',
      lineDecorationsWidth: 8,
      lineNumbers: 'off',
      minimap: { enabled: false },
      renderLineHighlight: 'none',
      scrollbar: {
        arrowSize: 0,
        horizontal: 'hidden',
        horizontalScrollbarSize: 0,
      },
      scrollBeyondLastLine: false,
      padding: {
        top: 6,
        bottom: 6,
      },
      tabCompletion: 'off',
      useTabStops: true,
      value,
      wordWrap: 'on',
      automaticLayout: true,
      autoClosingBrackets: 'beforeWhitespace',
      ...editorSettings,
    };
  }

  handleEditorInitialized(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.editor = editor;

    // disable tab to spaces in this editor to improve tab navigation
    editor.getModel()?.updateOptions({ tabSize: 0 });

    // monaco does not propagate tab or enter events
    editor.onKeyDown(this.handleKeyDown);

    editor.onDidChangeModelContent(this.handleContentChanged);
    editor.onDidFocusEditorText(this.handleEditorFocus);
    editor.onDidBlurEditorText(this.handleEditorBlur);
  }

  handleEditorWillDestroy(): void {
    this.editor = undefined;
  }

  handleContentChanged(): void {
    const { onContentChanged } = this.props;
    const value = this.editor?.getModel()?.getValue();
    if (value !== undefined) {
      this.setState({ isEditorEmpty: value.length === 0 });
    }
    onContentChanged(value);
  }

  handleEditorFocus(): void {
    this.setState({ isEditorFocused: true });
  }

  handleEditorBlur(): void {
    const value = this.editor?.getModel()?.getValue() ?? '';
    this.setState({
      isEditorEmpty: value.length === 0,
      isEditorFocused: false,
    });
  }

  // force editor to focus if clicked
  handleContainerClick(): void {
    const { isEditorFocused } = this.state;
    if (isEditorFocused) {
      return;
    }
    this.editor?.focus();
  }

  handleKeyDown(event: monaco.IKeyboardEvent): void {
    const { onTab, editorIndex } = this.props;
    if (event.code === 'Tab') {
      event.stopPropagation();
      event.preventDefault();
      onTab(editorIndex, event.shiftKey);
    }
  }

  render(): ReactElement {
    const { className, invalid, placeholder = '', value } = this.props;
    const { isEditorFocused, isEditorEmpty } = this.state;
    return (
      <div
        className={classNames(
          'input-editor-wrapper',
          {
            focused: isEditorFocused,
            invalid,
          },
          className
        )}
        role="presentation"
        onClick={this.handleContainerClick}
      >
        <Editor
          className="w-100"
          settings={this.getEditorSettings()}
          onEditorInitialized={this.handleEditorInitialized}
          onEditorWillDestroy={this.handleEditorWillDestroy}
        />
        {isEditorEmpty && !value && placeholder.length > 0 && (
          <div className="editor-placeholder text-muted">{placeholder}</div>
        )}
      </div>
    );
  }
}

export default InputEditor;
