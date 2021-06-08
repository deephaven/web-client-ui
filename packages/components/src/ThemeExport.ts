import ThemeExport from './ThemeExport.module.scss';

// Note that TypeScript does not know what keys exist on ThemeExport.module.scss
// It only knows it's an object with strings for keys and values
export default Object.freeze({
  transitionMs: 150,
  transitionMidMs: 200,
  transitionLongMs: 300,
  transitionSlowMs: 1000,
  ...ThemeExport,
});
