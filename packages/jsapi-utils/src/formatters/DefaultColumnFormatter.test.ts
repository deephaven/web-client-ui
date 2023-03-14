import DefaultColumnFormatter from './DefaultColumnFormatter';

describe('format', () => {
  it('should return a string containing the given value', () => {
    const formatter = new DefaultColumnFormatter();
    expect(formatter.format(null)).toBe('null');
    expect(formatter.format(2)).toBe('2');
    expect(formatter.format('test')).toBe('test');
  });
});
