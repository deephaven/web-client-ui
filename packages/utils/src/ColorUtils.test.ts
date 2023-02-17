import ColorUtils from './ColorUtils';

describe('isDark', () => {
  it('returns true if the background is dark', () => {
    expect(ColorUtils.isDark('#000000')).toBe(true);
    expect(ColorUtils.isDark('#000')).toBe(true);
    // expect(ColorUtils.isDark('white')).toBe(true);
    expect(ColorUtils.isDark('rgb(0,0,0)')).toBe(true);
    expect(ColorUtils.isDark('rgba(0,0,0,1)')).toBe(true);
    expect(ColorUtils.isDark('hsl(0,0%,0%)')).toBe(true);
  });

  it('returns false if the background is bright', () => {
    expect(ColorUtils.isDark('#ffffff')).toBe(false);
  });

  it('throws an error if the color is not a valid value', () => {
    expect(() => ColorUtils.isDark('')).toThrowError(/Invalid color received/);
  });
});
