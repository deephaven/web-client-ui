import React from 'react';
import { defaultTheme, Provider, ProviderProps } from '@adobe/react-spectrum';
import Log from '@deephaven/log';

import darkDH from '../scss/SpectrumThemeDark.module.scss';
import lightDH from '../scss/SpectrumThemeLight.module.scss';

const log = Log.module('SpectrumProvider');

const { global, light, dark, medium, large } = defaultTheme;

// Extend light + dark theme variables with DH defaults.
// A theme is just a mapped collection of css class names that are generated
// from various css modules.
// e.g.
// {
//   global: {
//     spectrum: 'spectrum_9e130c',
//     'spectrum--medium': 'spectrum--medium_9e130c',
//     'spectrum--large': 'spectrum--large_9e130c',
//     'spectrum--darkest': 'spectrum--darkest_9e130c',
//     'spectrum--dark': 'spectrum--dark_9e130c',
//     'spectrum--light': 'spectrum--light_9e130c',
//     'spectrum--lightest': 'spectrum--lightest_9e130c',
//   },
//   light: {
//     'spectrum--light': 'spectrum--light_a40724',
//     'dh-spectrum-theme--light': '_dh-spectrum-theme--light_1hblg_22',
//   },
//   dark: {
//     'spectrum--darkest': 'spectrum--darkest_256eeb',
//     'dh-spectrum-theme--dark': '_dh-spectrum-theme--dark_f7kge_22',
//   },
//   medium: {
//     'spectrum--medium': 'spectrum--medium_4b172c',
//   },
//   large: {
//     'spectrum--large': 'spectrum--large_c40598',
//   },
// }
const themeDHDefault = {
  global,
  light: {
    ...light,
    ...lightDH,
  },
  dark: {
    ...dark,
    ...darkDH,
  },
  // scales
  medium,
  large,
};

export interface SpectrumProviderProps {
  colorScheme?: 'dark' | 'light';
  theme?: ProviderProps['theme'];
  /**
   * Since this provider may be used to wrap components that are not at the root
   * of the application, we may want to leave the background color alone so that
   * components can "inherit" parent component background colors.
   */
  transparentBackground?: boolean;
}

/**
 * Custom React Spectrum provider with theme customization overrides.
 */
function SpectrumProvider({
  children,
  colorScheme = 'dark',
  theme: themeCustom,
  transparentBackground = false,
}: React.PropsWithChildren<SpectrumProviderProps>): JSX.Element {
  const style = React.useMemo(
    () => ({
      backgroundColor: transparentBackground ? 'transparent' : undefined,
    }),
    [transparentBackground]
  );

  const theme = React.useMemo(
    () => ({
      ...themeDHDefault,
      ...themeCustom,
    }),
    [themeCustom]
  );

  log.debug('Theme', theme);

  return (
    <Provider UNSAFE_style={style} colorScheme={colorScheme} theme={theme}>
      {children}
    </Provider>
  );
}

export default SpectrumProvider;
