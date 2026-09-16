import React, { useEffect, useState, type ReactNode } from 'react';
import Log from '@deephaven/log';
import { useTheme } from '@deephaven/components';
import MonacoUtils from '../monaco/MonacoUtils';

const log = Log.module('Code');

interface CodeProps {
  children: ReactNode;
  language: string;
}

function Code({ children, language }: CodeProps): JSX.Element {
  const [colorizedHtml, setColorizedHtml] = useState<string | null>(null);
  const [isColorizeFailed, setIsColorizeFailed] = useState(false);
  const { activeThemes } = useTheme();

  useEffect(() => {
    let isCanceled = false;
    async function colorize() {
      if (children != null && activeThemes != null) {
        const monaco = await MonacoUtils.load();
        const result = await monaco.editor.colorize(
          children.toString(),
          language,
          {}
        );
        if (!isCanceled) {
          setColorizedHtml(result);
          setIsColorizeFailed(false);
        }
      }
    }
    colorize().catch(err => {
      log.error('Unable to colorize code, showing it as plain text', err);
      if (!isCanceled) {
        setIsColorizeFailed(true);
      }
    });
    return () => {
      isCanceled = true;
    };
  }, [activeThemes, children, language]);

  if (isColorizeFailed) {
    return (
      <div style={{ pointerEvents: 'none', whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    );
  }

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
