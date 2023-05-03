import dh from '@deephaven/jsapi-shim';
import { Column } from '@deephaven/jsapi-types';
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
  makeRowFormatColumn: jest.fn((dh, rule) => `[row] ${rule}`),
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
    expect(getFormatColumns(dh, makeColumns(), [])).toEqual([]);
  });

  it('returns mocked formatColumn for a given config', () => {
    expect(
      getFormatColumns(dh, makeColumns(), [
        makeFormatRule({
          columnName: '0',
          styleType: FormatStyleType.POSITIVE,
        }),
      ])
    ).toEqual([`[col] 0 - ${FormatStyleType.POSITIVE} : null`]);
  });

  it('ignores rules referring to missing columns', () => {
    expect(
      getFormatColumns(dh, makeColumns(1), [
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
      getFormatColumns(dh, makeColumns(), [
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
      getFormatColumns(dh, makeColumns(), [
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
      getFormatColumns(dh, makeColumns(), [
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
      getFormatColumns(dh, makeColumns(), [
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
      getFormatColumns(dh, makeColumns(), [
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
      getFormatColumns(dh, makeColumns(), [
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
    valid: [
      '2023-02-23T11:46:31.000000000 NY',
      '2023-02-23T00:00:00 NY',
      '2023-02-23 NY',
    ],
    invalid: ['blah', '2023-02-23', '2023-02-23T00:00:00 NY blah'],
    empty: '',
    undefined,
  };

  const conditions = {
    valueNotRequired: [DateCondition.IS_NULL, DateCondition.IS_NOT_NULL],
    valueRequired: [
      DateCondition.IS_AFTER,
      DateCondition.IS_AFTER_OR_EQUAL,
      DateCondition.IS_BEFORE_OR_EQUAL,
      DateCondition.IS_BEFORE,
      DateCondition.IS_EXACTLY,
      DateCondition.IS_NOT_EXACTLY,
    ],
  };

  describe.each(conditions.valueNotRequired)(
    'Not-Required condition: %s',
    condition => {
      it.each([
        ...values.valid,
        ...values.invalid,
        values.empty,
        values.undefined,
      ])('should ignore value when not required: %s', testValue => {
        expect(isDateConditionValid(dh, condition, testValue)).toBeTruthy();
      });
    }
  );

  describe.each(conditions.valueRequired)(
    'Required condition: %s',
    condition => {
      it.each([
        [values.empty, false],
        [values.undefined, false],
        [values.invalid, false],
        [values.valid, true],
      ] as const)(
        'should return true only if value is valid date format: %s, %s',
        (testValues, expected) => {
          [testValues].flat().forEach(value => {
            expect(isDateConditionValid(dh, condition, value)).toEqual(
              expected
            );
          });
        }
      );
    }
  );
});
