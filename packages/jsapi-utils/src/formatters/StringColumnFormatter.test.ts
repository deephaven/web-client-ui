import StringColumnFormatter from './StringColumnFormatter';

describe('format', () => {
  it('should return a string containing the given value', () => {
    const formatter = new StringColumnFormatter();
    expect(formatter.format('test')).toBe('test');
  });
});
