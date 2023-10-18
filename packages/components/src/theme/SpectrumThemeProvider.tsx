import { ReactNode, useState } from 'react';
import { Provider } from '@adobe/react-spectrum';
import type { Theme } from '@react-types/provider';
import shortid from 'shortid';
import { themeDHDefault } from '../SpectrumUtils';

export interface SpectrumThemeProviderProps {
  children: ReactNode;
  isPortal?: boolean;
  theme?: Theme;
  colorScheme?: 'light' | 'dark';
}

/**
 * Wrapper around React Spectrum's theme Provider that provides DH mappings of
 * Spectrum's theme variables to DH's theme variables. Also exposes an optional
 * `isPortal` prop that if provided, adds a unique `data-unique-id` attribute to
 * the Provider. This is needed to force the Provider to render the theme wrapper
 * inside of portals.
 */
export function SpectrumThemeProvider({
  children,
  isPortal = false,
  theme = themeDHDefault,
  colorScheme,
}: SpectrumThemeProviderProps): JSX.Element {
  // a unique ID is used per provider to force it to render the theme wrapper element inside portals
  // based on https://github.com/adobe/react-spectrum/issues/1697#issuecomment-999827266
  // won't be needed if https://github.com/adobe/react-spectrum/pull/2669 is merged
  const [id] = useState(isPortal ? shortid() : null);

  return (
    <Provider theme={theme} colorScheme={colorScheme} data-unique-id={id}>
      {children}
    </Provider>
  );
}
