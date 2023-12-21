import React, { ReactNode, useMemo } from 'react';
import { Tooltip } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';
import { INVALID_COLOR_BORDER_STYLE } from './colorUtils';
import { useContrastFgColorRef, useDhColorFromPseudoContent } from './hooks';

export interface SwatchProps {
  className: string;
  children: ReactNode;
}

export function Swatch({ className, children }: SwatchProps): JSX.Element {
  const ref = useContrastFgColorRef<HTMLDivElement>();

  // The `swatch-color` mixin parses and exposes the value of css var expressions
  // via a :after { content } selector. The value will be surrounded in double
  // quotes e.g.
  // var(--dh-color-red-500) is exposed as "--dh-color-red-500"
  // var(--dh-color-gray-900, #fcfcfa) is exposed as "--dh-color-gray-900, #fcfcfa"
  const dhColor = useDhColorFromPseudoContent(ref, ':after');

  const tooltip = useMemo(
    () =>
      dhColor != null
        ? {
            value: dhColor,
            normalized: ColorUtils.normalizeCssColor(dhColor, true),
          }
        : null,
    [dhColor]
  );

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
        <Tooltip interactive>
          <div>{tooltip.value}</div>
          <div>{tooltip.normalized}</div>
        </Tooltip>
      )}
      {children}
    </div>
  );
}
