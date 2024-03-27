/* eslint-disable react/jsx-props-no-spreading */
import { useMemo } from 'react';
import {
  View as SpectrumView,
  type ViewProps as SpectrumViewProps,
} from '@adobe/react-spectrum';
import { type ColorValue, colorValueStyle } from '../theme/colorUtils';

export type ViewProps = Omit<SpectrumViewProps<6>, 'backgroundColor'> & {
  backgroundColor?: ColorValue;
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

export function View(props: ViewProps): JSX.Element {
  const { backgroundColor, UNSAFE_style, ...rest } = props;
  const style = useMemo(
    () => ({
      ...UNSAFE_style,
      backgroundColor: colorValueStyle(backgroundColor),
    }),
    [backgroundColor, UNSAFE_style]
  );

  return <SpectrumView {...rest} UNSAFE_style={style} />;
}

export default View;
