import React, { useEffect, useState, ReactNode } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '@deephaven/components';

interface CodeProps {
  children: ReactNode;
  language: string;
}

function Code({ children, language }: CodeProps): JSX.Element {
  const [colorizedHtml, setColorizedHtml] = useState<string | null>(null);
  const { activeThemes } = useTheme();

  useEffect(() => {
    let isCanceled = false;
    async function colorize() {
      if (children != null && activeThemes != null) {
        const result = await monaco.editor.colorize(
          children.toString(),
          language,
          {}
        );
        if (!isCanceled) {
          setColorizedHtml(result);
        }
      }
    }
    colorize();
    return () => {
      isCanceled = true;
    };
  }, [activeThemes, children, language]);

  return (
    <div
      // Add pointerEvents: 'none' has huge benefits on performance with Hit Test testing on large colorized elements.
      // You can still select the text event with this set
      style={{ pointerEvents: 'none' }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={
        colorizedHtml != null ? { __html: colorizedHtml } : undefined
      }
    />
  );
}

export default Code;
