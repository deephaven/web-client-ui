/**
 * Editor editor for large blocks of code
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import MonacoUtils from '../monaco/MonacoUtils';

class Editor extends Component {
  constructor(props) {
    super(props);

    this.handleResize = this.handleResize.bind(this);

    this.container = null;
    this.editor = null;

    this.state = {};
  }

  componentDidMount() {
    this.initEditor();

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);

    this.destroyEditor();
  }

  setLanguage(language) {
    if (this.editor) {
      monaco.editor.setModelLanguage(this.editor.getModel(), language);
    }
  }

  handleResize() {
    this.updateDimensions();
  }

  toggleFind() {
    if (this.editor) {
      // The actions.find action can no longer be triggered when the editor is not in focus, with monaco 0.22.x.
      // As a workaround, just focus the editor before triggering the action
      // https://github.com/microsoft/monaco-editor/issues/2355
      this.editor.focus();
      this.editor.trigger('toggleFind', 'actions.find');
    }
  }

  updateDimensions() {
    this.editor.layout();
  }

  initEditor() {
    const { onEditorInitialized } = this.props;
    let { settings } = this.props;
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
    this.editor = monaco.editor.create(this.container, settings);
    this.editor.addAction({
      id: 'find',
      label: 'Find',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F,
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.0,

      run: () => {
        this.toggleFind();
        return null;
      },
    });
    this.editor.layout();
    MonacoUtils.removeConflictingKeybindings(this.editor);

    onEditorInitialized(this.editor);
  }

  destroyEditor() {
    const { onEditorWillDestroy } = this.props;
    onEditorWillDestroy(this.editor);
    this.editor.dispose();
    this.editor = null;
  }

  render() {
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

Editor.propTypes = {
  className: PropTypes.string,
  onEditorInitialized: PropTypes.func,
  onEditorWillDestroy: PropTypes.func,
  settings: PropTypes.shape({}),
};

Editor.defaultProps = {
  className: 'fill-parent-absolute',
  onEditorInitialized: () => {},
  onEditorWillDestroy: () => {},
  settings: {},
};

export default Editor;
