import { themeDHDefault } from './themeUtils';

describe('themeDHDefault', () => {
  it('should merge Spectrum default with DH custom styles', () => {
    expect(themeDHDefault).toMatchSnapshot();
  });
});
