import dh from '@deephaven/jsapi-shim';
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
      expect(NumberColumnFormatter.isValid(dh, validFormat)).toBe(true);
    });

    it('returns true for custom format with valid formatString', () => {
      const validFormat = NumberColumnFormatter.makeCustomFormat('0.0');
      expect(NumberColumnFormatter.isValid(dh, validFormat)).toBe(true);
    });

    it('does not throw exceptions for invalid format', () => {
      expect(() =>
        NumberColumnFormatter.isValid(dh, INVALID_FORMAT)
      ).not.toThrow();
    });

    it('returns false for invalid format', () => {
      expect(NumberColumnFormatter.isValid(dh, INVALID_FORMAT)).toBe(false);
    });
  });

  describe(`${name} instance format method`, () => {
    const formatter = new NumberColumnFormatter(dh);
    it('returns empty string for invalid formatString in format argument', () => {
      expect(formatter.format(0, INVALID_FORMAT)).toBe('');
    });

    it('returns empty string for null value ', () => {
      expect(formatter.format(null)).toBe('');
    });
  });

  describe(`${name}.makePresetFormat`, () => {
    it('should return an object with preset type', () => {
      const expectedObject = {
        label: 'test',
        formatString: '##0.00%',
        type: 'type-context-preset',
        multiplier: 2,
      };

      expect(
        NumberColumnFormatter.makePresetFormat('test', '##0.00%', 2)
      ).toEqual(expectedObject);
    });
  });

  describe(`${name}.makeCustomFormat`, () => {
    it('should return an object with preset type', () => {
      const expectedObject = {
        label: 'Custom Format',
        formatString: '##0.00%',
        type: 'type-context-custom',
        multiplier: 2,
      };

      expect(NumberColumnFormatter.makeCustomFormat('##0.00%', 2)).toEqual(
        expectedObject
      );
    });
  });

  describe(`${name}.isSameFormat`, () => {
    it('should return true if two format objects are the same excluding label', () => {
      const format1 = NumberColumnFormatter.makeFormat(
        'format1',
        '##0.00%',
        'type-context-custom',
        2
      );
      const format2 = NumberColumnFormatter.makeFormat(
        'format2',
        '##0.00%',
        'type-context-custom',
        2
      );
      expect(NumberColumnFormatter.isSameFormat(format1, format2)).toBe(true);
    });

    it('should return false if two format objects are different excluding label', () => {
      const format1 = NumberColumnFormatter.makeFormat(
        'format1',
        '##0.00%',
        'type-context-custom',
        2
      );
      const format2 = NumberColumnFormatter.makeFormat(
        'format2',
        '##0.000%',
        'type-context-preset',
        3
      );
      expect(NumberColumnFormatter.isSameFormat(format1, format2)).toBe(false);
    });
  });
});
