/* eslint-disable react/jsx-props-no-spreading */
import {
  Text as SpectrumText,
  type TextProps as SpectrumTextProps,
} from '@adobe/react-spectrum';
import { type ColorValue, colorValueStyle } from '../theme/colorUtils';

export type TextProps = SpectrumTextProps & {
  color?: ColorValue;
};

/**
 * A Text component that re-exports the Spectrum Text component.
 * It overrides ColorValues to accept CSS color strings and custom
 * variable names from our color paletee and semantic colors.
 *
 * @param props The props for the Text component
 * @returns The Text component
 *
 */

export function Text(props: TextProps): JSX.Element {
  const { color, UNSAFE_style, ...rest } = props;
  if (color != null) {
    return (
      <SpectrumText
        {...(rest as SpectrumTextProps)}
        UNSAFE_style={{
          ...UNSAFE_style,
          color: colorValueStyle(color),
        }}
      />
    );
  }

  return <SpectrumText {...(props as SpectrumTextProps)} />;
}

export default Text;
