import { Tooltip } from '@deephaven/components';
import React, { ReactNode, useEffect, useState } from 'react';
import {
  INVALID_COLOR_BORDER_STYLE,
  normalizedOptionalAlpha,
  useContrastFgColorRef,
} from './colorUtils';

export interface SwatchProps {
  className: string;
  children: ReactNode;
}

export function Swatch({ className, children }: SwatchProps): JSX.Element {
  const ref = useContrastFgColorRef<HTMLDivElement>();

  const [tooltip, setTooltip] = useState<{
    value: string;
    normalized: string;
  } | null>(null);

  useEffect(() => {
    if (ref.current == null) {
      return;
    }

    // Css var expression content is parsed and exposed via `swatch-color` mixin
    // in :after { content } . The value will be surrounded in double quotes
    // e.g.
    // var(--dh-color-red-500) is exposed as "--dh-color-red-500"
    // var(--dh-color-gray-900, #fcfcfa) is exposed as "--dh-color-gray-900, #fcfcfa"
    const afterContent = getComputedStyle(
      ref.current,
      ':after'
    ).getPropertyValue('content');

    // Extract the var name from the content (e.g. '--dh-color-gray-900')
    const dhColorVarName = /"(--dh-color-.*?)[,"]/.exec(afterContent)?.[1];
    if (dhColorVarName == null) {
      setTooltip(null);
      return;
    }

    const dhColorValue = getComputedStyle(ref.current).getPropertyValue(
      dhColorVarName
    );

    setTooltip({
      value: dhColorValue,
      normalized: normalizedOptionalAlpha(dhColorValue),
    });
  }, [ref]);

  const hasValue = tooltip != null && tooltip.value !== '';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        border: hasValue ? undefined : INVALID_COLOR_BORDER_STYLE,
      }}
    >
      {hasValue && (
        <Tooltip>
          <div>{tooltip.value}</div>
          <div>{tooltip.normalized}</div>
        </Tooltip>
      )}
      {children}
    </div>
  );
}
