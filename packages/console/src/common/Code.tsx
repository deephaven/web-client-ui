import React, { useEffect, useRef, ReactNode } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '@deephaven/components';

interface CodeProps {
  children: ReactNode;
  language: string;
}

function Code({ children, language }: CodeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { activeThemes } = useTheme();

  useEffect(() => {
    if (activeThemes != null) colorize();
  }, [activeThemes]);

  const colorize = async () => {
    if (containerRef.current && children != null) {
      const result = await monaco.editor.colorize(
        children.toString(),
        language,
        {}
      );
      containerRef.current.innerHTML = result;
    }
  };

  return (
    <div
      ref={containerRef}
      // Add pointerEvents: 'none' has huge benefits on performance with Hit Test testing on large colorized elements.
      // You can still select the text event with this set
      style={{ pointerEvents: 'none' }}
    ></div>
  );
}

export default Code;
