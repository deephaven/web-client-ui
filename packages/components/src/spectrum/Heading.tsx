/* eslint-disable react/jsx-props-no-spreading */
import { forwardRef, useMemo } from 'react';
import {
  Heading as SpectrumHeading,
  type HeadingProps as SpectrumHeadingProps,
} from '@adobe/react-spectrum';
import type { DOMRefValue } from '@react-types/shared';
import { type ColorValue, colorValueStyle } from '../theme/colorUtils';

export type HeadingProps = SpectrumHeadingProps & {
  color?: ColorValue;
};

/**
 * A Heading component that re-exports the Spectrum Heading component.
 * It overrides ColorValues to accept CSS color strings and custom
 * variable names from our color paletee and semantic colors.
 *
 * @param props The props for the Heading component
 * @returns The Heading component
 *
 */

export const Heading = forwardRef<
  DOMRefValue<HTMLHeadingElement>,
  HeadingProps
>((props, forwardedRef): JSX.Element => {
  const { color, UNSAFE_style, ...rest } = props;
  const style = useMemo(
    () => ({
      ...UNSAFE_style,
      color: colorValueStyle(color),
    }),
    [color, UNSAFE_style]
  );

  return <SpectrumHeading {...rest} ref={forwardedRef} UNSAFE_style={style} />;
});

Heading.displayName = 'Heading';

export default Heading;
