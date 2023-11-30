import { Tooltip } from '@deephaven/components';
import React, { ReactNode, useEffect, useState } from 'react';
import { normalizedOptionalAlpha, useContrastFgColorRef } from './colorUtils';

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

    // Css var
    const afterContent = getComputedStyle(
      ref.current,
      ':after'
    ).getPropertyValue('content');

    const dhColorVarName = /"(--dh-color-.*?)"/.exec(afterContent)?.[1];
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

  return (
    <div ref={ref} className={className}>
      {tooltip != null && (
        <Tooltip>
          <div>{tooltip.value}</div>
          <div>{tooltip.normalized}</div>
        </Tooltip>
      )}
      {children}
    </div>
  );
}
