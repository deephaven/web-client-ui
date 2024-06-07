/* eslint-disable react/jsx-props-no-spreading */
import { CSSProperties, forwardRef, useMemo } from 'react';
import {
  View as SpectrumView,
  type ViewProps as SpectrumViewProps,
} from '@adobe/react-spectrum';
import type { DOMRefValue } from '@react-types/shared';
import { type ColorValue, colorValueStyle } from '../theme/colorUtils';

export type ViewProps = Omit<
  SpectrumViewProps<6>,
  | 'backgroundColor'
  | 'borderColor'
  | 'borderStartColor'
  | 'borderEndColor'
  | 'borderTopColor'
  | 'borderBottomColor'
  | 'borderXColor'
  | 'borderYColor'
> & {
  backgroundColor?: ColorValue;
  borderColor?: ColorValue;
  borderStartColor?: ColorValue;
  borderEndColor?: ColorValue;
  borderTopColor?: ColorValue;
  borderBottomColor?: ColorValue;
  borderXColor?: ColorValue;
  borderYColor?: ColorValue;
};

/**
 * A View component that re-exports the Spectrum View component.
 * However, it overrides ColorValues to accept CSS color strings and
 * our custom variable names from our color palette and semantic colors.
 *
 * @param props The props for the View component
 * @returns The View component
 *
 */
export const View = forwardRef<DOMRefValue<HTMLElement>, ViewProps>(
  (props, forwardedRef): JSX.Element => {
    const {
      backgroundColor,
      borderColor,
      borderStartColor,
      borderEndColor,
      borderTopColor,
      borderBottomColor,
      borderXColor,
      borderYColor,
      UNSAFE_style,
      ...rest
    } = props;

    const borderStyle: CSSProperties = {};
    if (borderColor) {
      borderStyle.borderColor = colorValueStyle(borderColor);
    }
    if (borderXColor) {
      borderStyle.borderLeftColor = colorValueStyle(borderXColor);
      borderStyle.borderRightColor = colorValueStyle(borderXColor);
    }
    if (borderYColor) {
      borderStyle.borderTopColor = colorValueStyle(borderYColor);
      borderStyle.borderBottomColor = colorValueStyle(borderYColor);
    }
    if (borderStartColor) {
      borderStyle.borderLeftColor = colorValueStyle(borderStartColor);
    }
    if (borderEndColor) {
      borderStyle.borderRightColor = colorValueStyle(borderEndColor);
    }
    if (borderTopColor) {
      borderStyle.borderTopColor = colorValueStyle(borderTopColor);
    }
    if (borderBottomColor) {
      borderStyle.borderBottomColor = colorValueStyle(borderBottomColor);
    }

    const style = useMemo(
      () => ({
        ...UNSAFE_style,
        backgroundColor: colorValueStyle(backgroundColor),
        ...borderStyle,
      }),
      [backgroundColor, UNSAFE_style, borderStyle]
    );

    return <SpectrumView {...rest} ref={forwardedRef} UNSAFE_style={style} />;
  }
);

View.displayName = 'View';

export default View;
