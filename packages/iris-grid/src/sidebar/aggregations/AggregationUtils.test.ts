import AggregationOperation from './AggregationOperation';
import { isValidOperation } from './AggregationUtils';

describe('isValidOperation', () => {
  const numberTypes = ['int', 'long', 'double', 'float', 'short', 'byte'];
  const dateTypes = ['java.time.Instant', 'java.time.ZonedDateTime'];
  const textTypes = ['java.lang.String', 'char'];
  const arrayTypes = ['int[]', 'java.lang.String[]', 'double[]'];

  describe('COUNT, FIRST, LAST', () => {
    const ops = [
      AggregationOperation.COUNT,
      AggregationOperation.FIRST,
      AggregationOperation.LAST,
    ];

    it.each(ops)('%s returns true for any column type', op => {
      [...numberTypes, ...dateTypes, ...textTypes, ...arrayTypes].forEach(
        type => {
          expect(isValidOperation(op, type)).toBe(true);
        }
      );
    });
  });

  describe('COUNT_DISTINCT, DISTINCT, UNIQUE', () => {
    const ops = [
      AggregationOperation.COUNT_DISTINCT,
      AggregationOperation.DISTINCT,
      AggregationOperation.UNIQUE,
    ];

    it.each(ops)('%s returns true for non-array types', op => {
      [...numberTypes, ...dateTypes, ...textTypes].forEach(type => {
        expect(isValidOperation(op, type)).toBe(true);
      });
    });

    it.each(ops)('%s returns false for array types', op => {
      arrayTypes.forEach(type => {
        expect(isValidOperation(op, type)).toBe(false);
      });
    });
  });

  describe('MEDIAN, MIN, MAX', () => {
    const ops = [
      AggregationOperation.MEDIAN,
      AggregationOperation.MIN,
      AggregationOperation.MAX,
    ];

    it.each(ops)('%s returns true for number types', op => {
      numberTypes.forEach(type => {
        expect(isValidOperation(op, type)).toBe(true);
      });
    });

    it.each(ops)('%s returns true for date types', op => {
      dateTypes.forEach(type => {
        expect(isValidOperation(op, type)).toBe(true);
      });
    });

    it.each(ops)('%s returns true for text types', op => {
      textTypes.forEach(type => {
        expect(isValidOperation(op, type)).toBe(true);
      });
    });

    it.each(ops)('%s returns false for boolean type', op => {
      expect(isValidOperation(op, 'boolean')).toBe(false);
    });
  });

  describe('SUM, ABS_SUM, VAR, AVG, STD', () => {
    const ops = [
      AggregationOperation.SUM,
      AggregationOperation.ABS_SUM,
      AggregationOperation.VAR,
      AggregationOperation.AVG,
      AggregationOperation.STD,
    ];

    it.each(ops)('%s returns true for number types', op => {
      numberTypes.forEach(type => {
        expect(isValidOperation(op, type)).toBe(true);
      });
    });

    it.each(ops)('%s returns false for non-number types', op => {
      [...textTypes, ...dateTypes, ...arrayTypes].forEach(type => {
        expect(isValidOperation(op, type)).toBe(false);
      });
    });
  });

  describe('SKIP', () => {
    it('returns false for any type', () => {
      [...numberTypes, ...dateTypes, ...textTypes, ...arrayTypes].forEach(
        type => {
          expect(isValidOperation(AggregationOperation.SKIP, type)).toBe(false);
        }
      );
    });
  });
});
