import React, { useState, useEffect } from 'react';
import { ThemeContextType } from './ThemeProvider';
import useTheme from './useTheme';

type ThemeVariables = Record<string, string | boolean | number | null>;

function getComputedStyles(
  theme: ThemeContextType['theme'],
  colorScheme: ThemeContextType['colorScheme'],
  variables: ThemeVariables
) {
  if (theme == null || colorScheme == null) return variables;
  const spectrumClass = theme.global?.spectrum;
  if (spectrumClass == null) return variables;
  const el = document.querySelector(`.${spectrumClass}`);
  if (!el) return variables;

  const computedStyles = Object.fromEntries(
    Object.entries(variables).map(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('--')) {
        // allow a space separated list of css variables
        // used in colorways  e.g. '--gray-50 --gray-100'
        const computedValue = v
          .trim()
          .split(' ')
          .map(
            variable =>
              getComputedStyle(el).getPropertyValue(variable) || variable
          )
          .join(' ');
        return [k, computedValue];
      }
      return [k, v];
    })
  );

  return computedStyles;
}

/**
 * Converts an object with keys and css variable names to hex colors
 * based on the current theme. If the theme is not set, returns original values.
 * If the variable is not found, returns the original value.
 *
 * Must be used within a ThemeProvider.
 *
 * @param variables {key: --css-variable-name or value}
 * @example
 * const theme = useThemeVariables({
 *   text-color: '--spectrum-alias-text-color',
 *   background-color: '#000000',
 * });
 * console.log(theme);
 * {
 *   text-color: '#ffffff',
 *   background-color: '#000000'
 * }
 */
const useThemeVariables = (
  theme,
  colorScheme,
  variables: ThemeVariables
): ThemeVariables => {
  const [computedStyles, setComputedStyles] =
    useState<ThemeVariables>(variables);

  useEffect(() => {
    if (theme == null || colorScheme == null) return;
    setComputedStyles(getComputedStyles(theme, colorScheme, variables));
  }, [theme, colorScheme, variables]);

  return computedStyles;
};

export default useThemeVariables;
