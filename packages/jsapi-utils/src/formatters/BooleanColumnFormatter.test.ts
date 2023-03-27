import BooleanColumnFormatter from './BooleanColumnFormatter';

describe('format', () => {
  it('should return "true" when the value is 1 or true', () => {
    const formatter = new BooleanColumnFormatter();
    expect(formatter.format(1)).toBe('true');
    expect(formatter.format(true)).toBe('true');
  });

  it('should return "false" when the value is 0 or false', () => {
    const formatter = new BooleanColumnFormatter();
    expect(formatter.format(0)).toBe('false');
    expect(formatter.format(false)).toBe('false');
  });

  it('should return the empty string when the value is not 0, 1, true, or false', () => {
    const formatter = new BooleanColumnFormatter();
    expect(formatter.format(2)).toBe('');
  });
});
