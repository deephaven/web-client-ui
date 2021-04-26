import DecimalColumnFormatter from './DecimalColumnFormatter';
import IntegerColumnFormatter from './IntegerColumnFormatter';

const numberColumnFormatters = [
  {
    name: 'DecimalColumnFormatter',
    formatter: DecimalColumnFormatter,
  },
  {
    name: 'IntegerColumnFormatter',
    formatter: IntegerColumnFormatter,
  },
];

const INVALID_FORMAT = {
  formatString: {},
};

numberColumnFormatters.forEach(({ name, formatter: NumberColumnFormatter }) => {
  describe(`${name}.isValid`, () => {
    it('returns true for format with valid formatString', () => {
      const validFormat = NumberColumnFormatter.makeFormat(
        'Valid Format',
        '0.0'
      );
      expect(NumberColumnFormatter.isValid(validFormat)).toBe(true);
    });

    it('returns true for custom format with valid formatString', () => {
      const validFormat = NumberColumnFormatter.makeCustomFormat('0.0');
      expect(NumberColumnFormatter.isValid(validFormat)).toBe(true);
    });

    it('does not throw exceptions for invalid format', () => {
      expect(() => NumberColumnFormatter.isValid(INVALID_FORMAT)).not.toThrow();
    });

    it('returns false for invalid format', () => {
      expect(NumberColumnFormatter.isValid(INVALID_FORMAT)).toBe(false);
    });
  });

  describe(`${name} instance format method`, () => {
    const formatter = new NumberColumnFormatter();
    it('does not throw error for invalid formatString in format argument', () => {
      expect(() => {
        formatter.format(INVALID_FORMAT, 0);
      }).not.toThrow();
    });

    it('does not throw error for invalid value argument', () => {
      expect(() => {
        formatter.format(null, null);
      }).not.toThrow();
    });

    it('returns empty string for invalid formatString in format argument', () => {
      expect(formatter.format(INVALID_FORMAT, 0)).toBe('');
    });

    it('returns empty string for null value ', () => {
      expect(formatter.format(null, null)).toBe('');
    });
  });
});
