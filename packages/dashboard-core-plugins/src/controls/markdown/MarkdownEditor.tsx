import React, { PureComponent, ReactElement } from 'react';
import Markdown from 'react-markdown';
import { CodeComponent } from 'react-markdown/lib/ast-to-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Code, Editor } from '@deephaven/console';
import type * as monaco from 'monaco-editor';
import 'katex/dist/katex.min.css';

interface MarkdownEditorProps {
  isEditing: boolean;
  content: string;
  onEditorInitialized: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

const renderMarkdown: CodeComponent = props => {
  const { children, className } = props;
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
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </Markdown>
        )}
      </div>
    );
  }
}
