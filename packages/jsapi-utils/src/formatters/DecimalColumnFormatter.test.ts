import dh from '@deephaven/jsapi-shim';
import DecimalColumnFormatter from './DecimalColumnFormatter';

describe('multiplier tests', () => {
  const formatter = new DecimalColumnFormatter(dh);
  const value = 10.4;
  it('handles null multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: null,
      })
    ).toBe('10.4000');
  });
  it('handles undefined multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: undefined,
      })
    ).toBe('10.4000');
  });
  it('ignores 0 multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: 0,
      })
    ).toBe('10.4000');
  });
  it('handles 1 multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: 1,
      })
    ).toBe('10.4000');
  });
  it('handles 2 multiplier correctly', () => {
    expect(
      formatter.format(value, {
        multiplier: 2,
      })
    ).toBe('20.8000');
  });
});
