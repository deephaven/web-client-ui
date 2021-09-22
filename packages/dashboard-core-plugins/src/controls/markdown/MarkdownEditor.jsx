import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import { Code, Editor } from '@deephaven/console';

export default class MarkdownEditor extends PureComponent {
  constructor(props) {
    super(props);
    this.container = null;
  }

  renderMarkdown = props => {
    const { children, className } = props;
    const language = className?.startsWith('language-')
      ? className.substring(9)
      : 'plaintext';
    return (
      <pre>
        <code>
          <Code language={language}>
            {React.Children.map(children, child =>
              typeof child === 'string' ? child.trim() : child
            )}
          </Code>
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
          <Markdown components={{ code: this.renderMarkdown }}>
            {content}
          </Markdown>
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
