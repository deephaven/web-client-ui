import React, { PureComponent, type ReactElement } from 'react';
import Markdown from 'react-markdown';
import { type CodeComponent } from 'react-markdown/lib/ast-to-react';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import { Code, Editor } from '@deephaven/console';
import type * as monaco from 'monaco-editor';

interface MarkdownEditorProps {
  isEditing: boolean;
  content: string;
  onEditorInitialized: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

const renderMarkdown: CodeComponent = props => {
  const { children, inline, className } = props;
  if (inline === true) {
    return (
      <code>
        {React.Children.map(children, child =>
          typeof child === 'string' ? child.trim() : child
        )}
      </code>
    );
  }
  const language =
    className !== undefined && className?.startsWith('language-')
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
export default class MarkdownEditor extends PureComponent<
  MarkdownEditorProps,
  Record<string, never>
> {
  static defaultProps = {
    isEditing: false,
    content: '',
  };

  constructor(props: MarkdownEditorProps) {
    super(props);
    this.container = null;
  }

  container: HTMLDivElement | null;

  render(): ReactElement {
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
            components={{ code: renderMarkdown }}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeMathjax]}
          >
            {content}
          </Markdown>
        )}
      </div>
    );
  }
}
