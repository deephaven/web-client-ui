import IntegerColumnFormatter from './IntegerColumnFormatter';

describe('multiplier tests', () => {
  const formatter = new IntegerColumnFormatter();
  const value = 10;
  it('handles null multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: null,
      })
    ).toBe('10');
  });
  it('handles undefined multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: undefined,
      })
    ).toBe('10');
  });
  it('ignores 0 multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: 0,
      })
    ).toBe('10');
  });
  it('handles 1 multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: 1,
      })
    ).toBe('10');
  });
  it('handles 2 multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: 2,
      })
    ).toBe('20');
  });
});
