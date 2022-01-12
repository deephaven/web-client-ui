import DecimalColumnFormatter from './DecimalColumnFormatter';
import IntegerColumnFormatter from './IntegerColumnFormatter';
import { TableColumnFormat } from './TableColumnFormatter';

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

const INVALID_FORMAT = ({
  formatString: {},
} as unknown) as TableColumnFormat;

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
    it('returns empty string for invalid formatString in format argument', () => {
      expect(formatter.format(0, INVALID_FORMAT)).toBe('');
    });

    it('returns empty string for null value ', () => {
      expect(formatter.format(null)).toBe('');
    });
  });
});
