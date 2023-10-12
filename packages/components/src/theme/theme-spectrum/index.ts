import palette from './theme-spectrum-palette.module.css';
import alias from './theme-spectrum-alias.module.css';

/**
 * Spectrum theme variables are exported as a map of css class names. The keys
 * come from css classes in the imported css modules. The values are generated
 * by Vite.
 *
 * e.g.
 * {
 *   'dh-spectrum-palette': '_dh-spectrum-palette_abr16_1',
 *   'dh-spectrum-alias': '_dh-spectrum-alias_18mbe_1',
 * }
 */
export const themeSpectrumClassesCommon = {
  ...palette,
  ...alias,
};

export default themeSpectrumClassesCommon;
