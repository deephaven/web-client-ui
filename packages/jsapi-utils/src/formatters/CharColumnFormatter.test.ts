import CharColumnFormatter from './CharColumnFormatter';

describe('format', () => {
  it('should return a string respresentation of the character code', () => {
    const formatter = new CharColumnFormatter();
    expect(formatter.format(48)).toBe('0');
    expect(formatter.format(65)).toBe('A');
    expect(formatter.format(97)).toBe('a');
  });
});
