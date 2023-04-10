import React from 'react';
import { defaultTheme, Provider, ProviderProps } from '@adobe/react-spectrum';
import Log from '@deephaven/log';

import darkDH from '../scss/SpectrumThemeDark.module.scss';
import lightDH from '../scss/SpectrumThemeLight.module.scss';

const log = Log.module('SpectrumProvider');

const { global, light, dark, medium, large } = defaultTheme;

// Extend light + dark theme variables with DH defaults.
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
