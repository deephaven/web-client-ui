import ColorUtils from './ColorUtils';

describe('isDark', () => {
  it('returns true if the background is dark', () => {
    expect(ColorUtils.isDark('#000000')).toBe(true);
  });

  it('returns false if the background is bright', () => {
    expect(ColorUtils.isDark('#ffffff')).toBe(false);
  });

  it('throws an error if the color is not a valid value', () => {
    expect(() => ColorUtils.isDark('')).toThrowError(/Invalid color received/);
  });
});
