import { theme } from '@react-spectrum/theme-default';
import { themeDHDefault } from './SpectrumUtils';

describe('themeDHDefault', () => {
  it('should merge Spectrum default with DH custom styles', () => {
    const { global, light, dark, medium, large } = theme;

    expect(themeDHDefault).toEqual({
      global,
      light: {
        ...light,
        'dh-spectrum-theme--light': 'mock.light',
      },
      dark: {
        ...dark,
        'dh-spectrum-theme--dark': 'mock.dark',
      },
      medium,
      large,
    });
  });
});
