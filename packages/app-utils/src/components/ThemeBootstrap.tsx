import {
  ThemeContext,
  useInitializeThemeContextValue,
} from '@deephaven/components';

export interface ThemeBootstrapProps {
  children: React.ReactNode;
}

export function ThemeBootstrap({ children }: ThemeBootstrapProps): JSX.Element {
  const themeContextValue = useInitializeThemeContextValue();

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {themeContextValue.activeThemes?.map(theme => (
        <style data-theme-key={theme.themeKey} key={theme.themeKey}>
          {theme.styleContent}
        </style>
      ))}
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeBootstrap;
