import React, { useEffect, useRef, ReactNode, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '@deephaven/components';

interface CodeProps {
  children: ReactNode;
  language: string;
}

function Code({ children, language }: CodeProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { activeThemes } = useTheme();

  const colorize = useCallback(async () => {
    if (containerRef.current && children != null) {
      const result = await monaco.editor.colorize(
        children.toString(),
        language,
        {}
      );
      containerRef.current.innerHTML = result;
    }
  }, [children, language]);

  useEffect(() => {
    if (activeThemes != null) colorize();
  }, [activeThemes, colorize]);

  return (
    <div
      ref={containerRef}
      // Add pointerEvents: 'none' has huge benefits on performance with Hit Test testing on large colorized elements.
      // You can still select the text event with this set
      style={{ pointerEvents: 'none' }}
    />
  );
}

export default Code;
