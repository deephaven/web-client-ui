import { defaultTheme } from '@adobe/react-spectrum';
import { themeDHDefault } from './SpectrumUtils';

describe('themeDHDefault', () => {
  it('should merge Spectrum default with DH custom styles', () => {
    const { global, light, dark, medium, large } = defaultTheme;

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
