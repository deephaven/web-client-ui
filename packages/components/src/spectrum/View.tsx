/* eslint-disable react/jsx-props-no-spreading */
import { forwardRef, useMemo, useEffect, CSSProperties } from 'react';
import {
  View as SpectrumView,
  type ViewProps as SpectrumViewProps,
} from '@adobe/react-spectrum';
import type { DOMRefValue } from '@react-types/shared';
import { type ColorValue, colorValueStyle } from '../theme/colorUtils';

export type ViewProps = Omit<SpectrumViewProps<6>, 'backgroundColor'> & {
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
 * our custom variable names from our color paletee and semantic colors.
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

    const defaultBorderColor = colorValueStyle(borderColor) ?? 'transparent';
    const defaultBorderXColor =
      colorValueStyle(borderXColor) ?? defaultBorderColor;
    const defaultBorderYColor =
      colorValueStyle(borderYColor) ?? defaultBorderColor;
    const topColor = colorValueStyle(borderTopColor) ?? defaultBorderYColor;
    const bottomColor =
      colorValueStyle(borderBottomColor) ?? defaultBorderYColor;
    const leftColor = colorValueStyle(borderStartColor) ?? defaultBorderXColor;
    const rightColor = colorValueStyle(borderEndColor) ?? defaultBorderXColor;

    const style = useMemo(() => {
      return {
        ...UNSAFE_style,
        backgroundColor: colorValueStyle(backgroundColor),
        borderColor: `${topColor} ${rightColor} ${bottomColor} ${leftColor}`,
      };
    }, [
      backgroundColor,
      UNSAFE_style,
      borderColor,
      borderStartColor,
      borderEndColor,
      borderTopColor,
      borderBottomColor,
      borderXColor,
      borderYColor,
    ]);
    
    return <SpectrumView {...rest} ref={forwardedRef} UNSAFE_style={style} />;
  }
);

View.displayName = 'View';

export default View;
