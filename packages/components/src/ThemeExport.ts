import ThemeExport from './ThemeExport.module.css';

// Note that TypeScript does not know what keys exist on ThemeExport.module.css
// It only knows it's an object with strings for keys and values

const transitions = {
  transitionMs: 150,
  transitionMidMs: 200,
  transitionLongMs: 300,
  transitionSlowMs: 1000,
} as const;

type Theme = {
  [Property in keyof typeof transitions]: (typeof transitions)[Property];
} & { [key: string]: string };

export default Object.freeze({
  ...transitions,
  ...ThemeExport,
}) as Theme;
