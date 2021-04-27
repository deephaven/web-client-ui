import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import Editor from '../../console/notebook/Editor';
import Code from '../../console/common/Code';

export default class MarkdownEditor extends PureComponent {
  constructor(props) {
    super(props);
    this.container = null;
  }

  renderMarkdown = props => {
    const { value, language } = props;
    return (
      <pre>
        <code>
          <Code language={language || 'plaintext'}>{value}</Code>
        </code>
      </pre>
    );
  };

  render() {
    const { isEditing, content, onEditorInitialized } = this.props;
    return (
      <div
        className="markdown-editor-container"
        ref={container => {
          this.container = container;
        }}
      >
        {isEditing ? (
          <Editor
            settings={{
              language: 'markdown',
              value: content,
              lineNumbers: 'off',
            }}
            onEditorInitialized={onEditorInitialized}
          />
        ) : (
          <Markdown
            source={content}
            escapeHtml={false}
            renderers={{ code: this.renderMarkdown }}
          />
        )}
      </div>
    );
  }
}

MarkdownEditor.propTypes = {
  isEditing: PropTypes.bool,
  content: PropTypes.string,
  onEditorInitialized: PropTypes.func.isRequired,
};

MarkdownEditor.defaultProps = {
  isEditing: false,
  content: '',
};
