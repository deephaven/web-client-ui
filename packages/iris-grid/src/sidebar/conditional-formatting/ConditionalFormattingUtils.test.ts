import { Column } from '@deephaven/jsapi-shim';
import IrisGridTestUtils from '../../IrisGridTestUtils';
import {
  DateCondition,
  FormatStyleType,
  FormatterType,
  FormattingRule,
  getFormatColumns,
  isDateConditionValid,
  StringCondition,
} from './ConditionalFormattingUtils';

jest.mock('./ConditionalFormattingAPIUtils', () => ({
  makeTernaryFormatRule: jest.fn(
    (rule, prevRule = null) =>
      `${rule.column.name} - ${rule.style.type} : ${prevRule}`
  ),
  makeColumnFormatColumn: jest.fn((col, rule) => `[col] ${rule}`),
  makeRowFormatColumn: jest.fn(rule => `[row] ${rule}`),
}));

describe('getFormatColumns', () => {
  function makeColumns(count = 5): Column[] {
    return IrisGridTestUtils.makeColumns(count);
  }

  function makeFormatRule({
    columnName = '0',
    columnType = IrisGridTestUtils.DEFAULT_TYPE,
    formatterType = FormatterType.CONDITIONAL,
    condition = StringCondition.IS_EXACTLY,
    styleType = FormatStyleType.POSITIVE,
  } = {}): FormattingRule {
    return {
      type: formatterType,
      config: {
        column: {
          type: columnType,
          name: columnName,
        },
        condition,
        style: {
          type: styleType,
        },
      },
    };
  }

  it('returns empty array for empty rules array', () => {
    expect(getFormatColumns(makeColumns(), [])).toEqual([]);
  });

  it('returns mocked formatColumn for a given config', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
        }),
      ])
    ).toEqual([`[col] 0 - ${FormatStyleType.POSITIVE} : null`]);
  });

  it('ignores rules referring to missing columns', () => {
    expect(
      getFormatColumns(makeColumns(1), [
        makeFormatRule({
          columnName: '2',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '1',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
        }),
      ])
    ).toEqual([`[col] 0 - ${FormatStyleType.POSITIVE} : null`]);
  });

  it('stacks multiple rules for the same column in the correct order', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.NEGATIVE,
        }),
      ])
    ).toEqual([
      `[col] 0 - ${FormatStyleType.NEGATIVE} : 0 - ${FormatStyleType.POSITIVE} : null`,
    ]);
  });

  it('returns one rule stack for each column', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.NEGATIVE,
        }),
        makeFormatRule({
          columnName: '1',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '1',
          styleType: FormatStyleType.NEGATIVE,
        }),
      ])
    ).toEqual([
      `[col] 0 - ${FormatStyleType.NEGATIVE} : 0 - ${FormatStyleType.POSITIVE} : null`,
      `[col] 1 - ${FormatStyleType.NEGATIVE} : 1 - ${FormatStyleType.POSITIVE} : null`,
    ]);
  });

  it('keeps column/row rule stacks based on the same column separate', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
          formatterType: FormatterType.CONDITIONAL,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.NEGATIVE,
          formatterType: FormatterType.ROWS,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.NEUTRAL,
          formatterType: FormatterType.CONDITIONAL,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.WARN,
          formatterType: FormatterType.ROWS,
        }),
      ])
    ).toEqual([
      `[col] 0 - ${FormatStyleType.NEUTRAL} : 0 - ${FormatStyleType.POSITIVE} : null`,
      `[row] 0 - ${FormatStyleType.WARN} : 0 - ${FormatStyleType.NEGATIVE} : null`,
    ]);
  });

  it('handles rules with mixed column order correctly', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '1',
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.NEGATIVE,
        }),
        makeFormatRule({
          columnName: '1',
          styleType: FormatStyleType.NEGATIVE,
        }),
      ])
    ).toEqual([
      `[col] 0 - ${FormatStyleType.NEGATIVE} : 0 - ${FormatStyleType.POSITIVE} : null`,
      `[col] 1 - ${FormatStyleType.NEGATIVE} : 1 - ${FormatStyleType.POSITIVE} : null`,
    ]);
  });

  it('returns a single condition for multiple rules on the same column', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          formatterType: FormatterType.ROWS,
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '0',
          formatterType: FormatterType.ROWS,
          styleType: FormatStyleType.WARN,
        }),
      ])
    ).toEqual([
      `[row] 0 - ${FormatStyleType.WARN} : 0 - ${FormatStyleType.POSITIVE} : null`,
    ]);
  });

  it('returns a single condition for row rules on different columns', () => {
    expect(
      getFormatColumns(makeColumns(), [
        makeFormatRule({
          columnName: '0',
          formatterType: FormatterType.ROWS,
          styleType: FormatStyleType.POSITIVE,
        }),
        makeFormatRule({
          columnName: '1',
          formatterType: FormatterType.ROWS,
          styleType: FormatStyleType.WARN,
        }),
      ])
    ).toEqual([
      `[row] 1 - ${FormatStyleType.WARN} : 0 - ${FormatStyleType.POSITIVE} : null`,
    ]);
  });
});

describe('isDateConditionValid', () => {
  const values = {
    valid: '2023-02-23T11:46:31.000000000 NY',
    invalid: 'blah',
    empty: '',
    undefined,
  };

  it.each([DateCondition.IS_NULL, DateCondition.IS_NOT_NULL])(
    'should return true for null check conditions: %s',
    condition => {
      const testValues = [
        values.valid,
        values.invalid,
        values.empty,
        values.undefined,
      ];

      testValues.forEach(value => {
        expect(isDateConditionValid(condition, value)).toBeTruthy();
      });
    }
  );

  it.each([
    DateCondition.IS_AFTER,
    DateCondition.IS_AFTER_OR_EQUAL,
    DateCondition.IS_BEFORE_OR_EQUAL,
    DateCondition.IS_BEFORE,
    DateCondition.IS_EXACTLY,
    DateCondition.IS_NOT_EXACTLY,
  ])(
    'should return false for empty value when condition requires it: %s',
    condition => {
      const testValues = [values.empty, values.undefined];

      testValues.forEach(value => {
        expect(isDateConditionValid(condition, value)).toBeFalsy();
      });
    }
  );
});
