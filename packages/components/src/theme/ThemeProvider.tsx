import React, { createContext, useMemo, useState } from 'react';
import {
  themeDHDefault,
  useTheme,
  useThemeVariables,
} from '@deephaven/components';
import { Provider, ProviderProps } from '@adobe/react-spectrum';
import shortid from 'shortid';
import type { editor } from 'monaco-editor';
import useMonacoTheme from './useMonacoTheme';
import MonacoTheme from './MonacoTheme';
import IrisGridTheme from './IrisGridTheme';

export type ThemeContextType = {
  theme: ProviderProps['theme'];
  setTheme: React.Dispatch<React.SetStateAction<ProviderProps['theme']>>;
  colorScheme: ProviderProps['colorScheme'];
  setColorScheme: React.Dispatch<
    React.SetStateAction<ProviderProps['colorScheme']>
  >;
  monacoTheme: editor.IStandaloneThemeData | null;
  setMonacoTheme: React.Dispatch<
    React.SetStateAction<editor.IStandaloneThemeData>
  >;
  irisGridTheme: Record<string, string>;
};

type ThemeProviderProps = {
  isPortal?: boolean;
  children: React.ReactNode;
};

type CreateThemeContextProps = {
  children: React.ReactNode;
};

const ThemeContext = createContext({} as ThemeContextType);

/**
 * ThemeProvider provides theme contexts for all Deephaven components.
 * This includes the React Spectrum ThemeProvider, and themes for IrisGrid,
 * Monaco Editor and a Plotly.
 *
 * @param isPortal Whether this is around a portal
 * @param children Child components
 * @returns A ThemeProvider component
 *
 */
const CreateThemeContext = function CreateThemeContext({
  children,
}: CreateThemeContextProps) {
  const [theme, setTheme] = useState<ThemeContextType['theme']>(themeDHDefault);

  const [colorScheme, setColorScheme] =
    useState<ThemeContextType['colorScheme']>('dark');

  const [monacoTheme, setMonacoTheme] = useMonacoTheme({
    theme,
    colorScheme,
    MonacoTheme,
  });

  const irisGridTheme = useThemeVariables(theme, colorScheme, IrisGridTheme);

  const value = useMemo(
    (): ThemeContextType => ({
      theme,
      setTheme,
      colorScheme,
      setColorScheme,
      monacoTheme,
      setMonacoTheme,
      irisGridTheme,
    }),
    [
      theme,
      setTheme,
      colorScheme,
      setColorScheme,
      monacoTheme,
      setMonacoTheme,
      irisGridTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

const ThemeProvider = function ThemeProvider({
  isPortal = false,
  children,
}: ThemeProviderProps): JSX.Element {
  const value = useTheme();
  // a unique ID is used per provider to force it to render the theme wrapper element inside portals
  // based on https://github.com/adobe/react-spectrum/issues/1697#issuecomment-999827266
  // won't be needed if https://github.com/adobe/react-spectrum/pull/2669 is merged
  const [id] = useState(isPortal ? shortid() : null);
  return (
    <Provider
      theme={value.theme}
      colorScheme={value.colorScheme}
      data-unique-id={id}
    >
      {children}
    </Provider>
  );
};

export { CreateThemeContext, ThemeProvider, ThemeContext };
