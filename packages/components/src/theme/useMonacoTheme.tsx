// react functional component

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { ThemeContextType } from './ThemeProvider';

/**
 * Function to walk an object of key values, nested objects, and objects
 * nested in arrays, and then update the values in a new object.
 * @example
 * const obj = {
 *  rules: [{
 *   token: 'keyword',
 *   foreground: '--spectrum-blue-visual-color',
 *   }],
 * colors: {
 *  'editor.background': '--spectrum-gray-50'
 *  };
 * const newColors = walkObject(obj, removeHashtag);
 * console.log(newColors);
 */
function walkObject(
  obj: { [key: string]: unknown },
  fn: (v: unknown) => unknown
) {
  if (obj == null) return obj;
  const newObj = obj;
  Object.entries(newObj).forEach(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      walkObject(v as Record<string, unknown>, fn);
    } else {
      newObj[k] = fn(v);
    }
  });
  return newObj;
}

/**
 * Function to replace an unknown value with its computed value
 * if it's a string and starts with '--'
 * @param el The element to use to get the computed value
 * @param variable The variable to replace
 * @returns {any} The computed value or the original variable
 * @example
 * const el = document.querySelector('.spectrum');
 * const computedValue = replaceCSSVariable(el, '--spectrum-alias-text-color');
 * console.log(computedValue);
 * // #ffffff
 * @example
 * const el = document.querySelector('.spectrum');
 * const computedValue = replaceCSSVariable(el, '2');
 * console.log(computedValue);
 * // 2
 */
function replaceCSSVariable(el: Element, variable: unknown) {
  let computedValue = variable;
  if (el != null && typeof variable === 'string' && variable.startsWith('--')) {
    computedValue = getComputedStyle(el).getPropertyValue(variable) || variable;
    // convert 3 digit hex colors to 6 digit hex colors
    // monaco only works with 6 or 8 digit hex colors
    // e.g. #fff -> #ffffff
    if (
      typeof computedValue === 'string' &&
      computedValue.startsWith('#') &&
      computedValue.length === 4
    ) {
      computedValue = computedValue
        .split('')
        .map((v, i) => (i === 0 ? v : v + v))
        .join('');
    }
    // if the computed value starts with rgba(0-255,0-255,0-255,0-1), convert it to 8 digit hex
    else if (
      typeof computedValue === 'string' &&
      computedValue.startsWith('rgba')
    ) {
      const [r, g, b, a] = computedValue
        .replace('rgba(', '')
        .replace(')', '')
        .split(',')
        .map(v => v.trim());
      // convert the rgba values to hex, and pad with 0s if needed
      // alpha is a number between 0-1, and needs to be converted to 0-255 first
      computedValue = `#${Number(r).toString(16).padStart(2, '0')}${Number(g)
        .toString(16)
        .padStart(2, '0')}${Number(b)
        .toString(16)
        .padStart(2, '0')}${Math.round(Number(a) * 255)
        .toString(16)
        .padStart(2, '0')}`;
    }
  }
  return computedValue;
}

// type definition for useMonacoTheme
type useMonacoThemeType = {
  theme: ThemeContextType['theme'];
  colorScheme: ThemeContextType['colorScheme'];
  MonacoTheme: monaco.editor.IStandaloneThemeData;
};

function useMonacoTheme({
  theme,
  colorScheme,
  MonacoTheme,
}: useMonacoThemeType) {
  const [monacoTheme, _setMonacoTheme] =
    useState<monaco.editor.IStandaloneThemeData | null>(null);
  const [rawTheme, setRawTheme] =
    useState<monaco.editor.IStandaloneThemeData>(MonacoTheme);

  const setMonacoTheme = useCallback(
    monacoThemeVariables => {
      if (
        theme == null ||
        colorScheme == null ||
        monacoThemeVariables == null
      ) {
        return null;
      }

      const el = document.querySelector(`.${theme.global?.spectrum}`);
      if (!el) return null;

      setRawTheme(monacoThemeVariables);
      // needs a deep clone to preserve the original object
      const copy = structuredClone(monacoThemeVariables);
      const convertedTheme = walkObject(copy, v => replaceCSSVariable(el, v));
      _setMonacoTheme(convertedTheme);
    },
    [theme, colorScheme]
  );

  useEffect(() => {
    if (rawTheme == null || setMonacoTheme == null) return;
    setMonacoTheme(rawTheme);
  }, [rawTheme, setMonacoTheme, theme, colorScheme]);

  useEffect(() => {
    if (monacoTheme == null) return;
    monaco.editor.defineTheme('myTheme', monacoTheme);
    monaco.editor.setTheme('myTheme');
  }, [monacoTheme]);

  return [monacoTheme, setMonacoTheme];
}

export default useMonacoTheme;
