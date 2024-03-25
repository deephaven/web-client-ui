/* eslint-disable react/jsx-props-no-spreading */
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
  if (backgroundColor != null) {
    return (
      <SpectrumView
        {...(rest as SpectrumViewProps<6>)}
        UNSAFE_style={{
          ...UNSAFE_style,
          backgroundColor: colorValueStyle(backgroundColor),
        }}
      />
    );
  }

  return <SpectrumView {...(props as SpectrumViewProps<6>)} />;
}

export default View;
