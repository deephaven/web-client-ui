import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import classNames from 'classnames';
import './InputEditor.scss';

/**
 * A monaco editor that looks like an general input
 */

export default class InputEditor extends Component {
  constructor(props) {
    super(props);

    this.handleContentChanged = this.handleContentChanged.bind(this);
    this.handleEditorFocus = this.handleEditorFocus.bind(this);
    this.handleEditorBlur = this.handleEditorBlur.bind(this);
    this.handleContainerClick = this.handleContainerClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.state = {
      isEditorFocused: false,
      isEditorEmpty: true,
    };
    this.editorContainer = null;
    this.editor = null;
  }

  componentDidMount() {
    this.initEditor();
  }

  componentWillUnmount() {
    this.destroyEditor();
  }

  initEditor() {
    const { value, editorSettings } = this.props;
    const inputEditorSettings = {
      copyWithSyntaxHighlighting: 'false',
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
      ...editorSettings,
    };
    this.editor = monaco.editor.create(
      this.editorContainer,
      inputEditorSettings
    );
    this.editor.layout();

    // disable tab to spaces in this editor to improve tab navigation
    this.editor.getModel().updateOptions({ tabSize: 0 });

    this.editor.onDidChangeModelContent(this.handleContentChanged);
    this.editor.onDidFocusEditorText(this.handleEditorFocus);
    this.editor.onDidBlurEditorText(this.handleEditorBlur);
  }

  destroyEditor() {
    this.editor.dispose();
    this.editor = null;
  }

  handleContentChanged() {
    const { onContentChanged } = this.props;
    const value = this.editor.getModel().getValue();
    this.setState({ isEditorEmpty: value.length === 0 });

    onContentChanged(value);
  }

  handleEditorFocus() {
    this.setState({ isEditorFocused: true });
  }

  handleEditorBlur() {
    const value = this.editor.getModel().getValue();
    this.setState({
      isEditorEmpty: value.length === 0,
      isEditorFocused: false,
    });
  }

  // force editor to focus if clicked
  handleContainerClick() {
    const { isEditorFocused } = this.state;
    if (isEditorFocused) {
      return;
    }
    this.editor.focus();
  }

  handleKeyDown(event) {
    const { onTab, editorIndex } = this.props;
    if (event.key === 'Tab') {
      onTab(editorIndex, event.shiftKey);
    }
  }

  render() {
    const { value, invalid } = this.props;
    const { isEditorFocused, isEditorEmpty } = this.state;
    return (
      <div
        className={classNames('input-editor-wrapper', {
          focused: isEditorFocused,
          invalid,
        })}
        onKeyDown={this.handleKeyDown}
        role="presentation"
        onClick={this.handleContainerClick}
      >
        <div
          className="editor-container"
          ref={editorContainer => {
            this.editorContainer = editorContainer;
          }}
        />
        {isEditorEmpty && !value && (
          <div className="editor-placeholder text-muted">Column Formula</div>
        )}
      </div>
    );
  }
}

InputEditor.propTypes = {
  value: PropTypes.string,
  onContentChanged: PropTypes.func,
  editorSettings: PropTypes.shape({}),
  editorIndex: PropTypes.number,
  onTab: PropTypes.func,
  invalid: PropTypes.bool,
};

InputEditor.defaultProps = {
  value: '',
  onContentChanged: () => {},
  editorSettings: {},
  editorIndex: 0,
  onTab: () => {},
  invalid: false,
};
