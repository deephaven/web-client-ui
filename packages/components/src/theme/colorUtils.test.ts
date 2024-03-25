import { colorValueStyle } from './colorUtils';

describe('ColorValues', () => {
  test('should return the correct color style', () => {
    // dh-color variables
    expect(colorValueStyle('blue-1000')).toBe('var(--dh-color-blue-1000)');
    expect(colorValueStyle('accent-1000')).toBe('var(--dh-color-accent-1000)');
    expect(colorValueStyle('bg')).toBe('var(--dh-color-bg)');
    // pass-through variables
    expect(colorValueStyle('red')).toBe('red');
    expect(colorValueStyle('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
    expect(colorValueStyle('#ff0000')).toBe('#ff0000');
  });
});
