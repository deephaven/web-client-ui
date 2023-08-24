import React, { Component, ReactElement, ReactNode } from 'react';
import * as monaco from 'monaco-editor';

interface CodeProps {
  children: ReactNode;
  language: string;
}

class Code extends Component<CodeProps, Record<string, never>> {
  constructor(props: CodeProps) {
    super(props);

    this.container = null;
  }

  componentDidMount(): void {
    this.colorize();
  }

  container: HTMLDivElement | null;

  colorize(): void {
    const { children } = this.props;
    if (this.container && children != null) {
      monaco.editor.colorizeElement(this.container, {
        theme: 'myTheme', // TODO EXTRACT CONSTANT
      });
    }
  }

  render(): ReactElement {
    const { children, language } = this.props;
    return (
      <div>
        <div
          data-lang={language}
          ref={container => {
            this.container = container;
          }}
          // Add pointerEvents: 'none' has huge benefits on performance with Hit Test testing on large colorized elements.
          // You can still select the text event with this set
          style={{ pointerEvents: 'none' }}
        >
          {children}
        </div>
      </div>
    );
  }
}

export default Code;
