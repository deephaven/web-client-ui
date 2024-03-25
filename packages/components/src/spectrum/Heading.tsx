/* eslint-disable react/jsx-props-no-spreading */
import {
  Heading as SpectrumHeading,
  type HeadingProps as SpectrumHeadingProps,
} from '@adobe/react-spectrum';
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

export function Heading(props: HeadingProps): JSX.Element {
  const { color, UNSAFE_style, ...rest } = props;
  if (color != null) {
    return (
      <SpectrumHeading
        {...(rest as SpectrumHeadingProps)}
        UNSAFE_style={{
          ...UNSAFE_style,
          color: colorValueStyle(color),
        }}
      />
    );
  }

  return <SpectrumHeading {...(props as SpectrumHeadingProps)} />;
}

export default Heading;
