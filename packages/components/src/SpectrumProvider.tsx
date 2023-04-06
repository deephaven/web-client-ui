import React from 'react';
import cl from 'classnames';
import { defaultTheme, Provider } from '@adobe/react-spectrum';
import styles from './SpectrumProvider.module.scss';

export interface SpectrumProviderProps {
  colorScheme?: 'dark' | 'light';
}

/**
 * Custom React Spectrum provider with theme customization overrides.
 */
function SpectrumProvider({
  colorScheme = 'dark',
  children,
}: React.PropsWithChildren<SpectrumProviderProps>): JSX.Element {
  return (
    <Provider
      UNSAFE_className={cl(
        styles.component,
        styles[`component-${colorScheme}`]
      )}
      colorScheme={colorScheme}
      theme={defaultTheme}
    >
      {children}
    </Provider>
  );
}

export default SpectrumProvider;
