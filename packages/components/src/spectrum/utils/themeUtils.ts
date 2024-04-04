import { theme } from '@react-spectrum/theme-default';
import { themeSpectrumClassesCommon } from '../../theme/theme-spectrum';

export {
  useStyleProps,
  baseStyleProps,
  viewStyleProps,
} from '@react-spectrum/utils';

const { global, light, dark, medium, large } = theme;

/**
 * Extend light + dark theme variables with DH defaults.
 *
 * A theme is just a mapped collection of css class names that are generated
 * from a collection of css modules.
 *
 * e.g.
 * {
 *   global: {
 *     spectrum: 'spectrum_9e130c',
 *     'spectrum--medium': 'spectrum--medium_9e130c',
 *     'spectrum--large': 'spectrum--large_9e130c',
 *     'spectrum--darkest': 'spectrum--darkest_9e130c',
 *     'spectrum--dark': 'spectrum--dark_9e130c',
 *     'spectrum--light': 'spectrum--light_9e130c',
 *     'spectrum--lightest': 'spectrum--lightest_9e130c',
 *   },
 *   light: {
 *     'spectrum--light': 'spectrum--light_a40724',
 *     'dh-spectrum-theme--light': '_dh-spectrum-theme--light_1hblg_22',
 *   },
 *   dark: {
 *     'spectrum--darkest': 'spectrum--darkest_256eeb',
 *     'dh-spectrum-theme--dark': '_dh-spectrum-theme--dark_f7kge_22',
 *   },
 *   medium: {
 *     'spectrum--medium': 'spectrum--medium_4b172c',
 *   },
 *   large: {
 *     'spectrum--large': 'spectrum--large_c40598',
 *   },
 * }
 */
/* eslint-disable import/prefer-default-export */
export const themeDHDefault = {
  global,
  light: {
    ...light,
    ...themeSpectrumClassesCommon,
  },
  dark: {
    ...dark,
    ...themeSpectrumClassesCommon,
  },
  // scales
  medium,
  large,
};
