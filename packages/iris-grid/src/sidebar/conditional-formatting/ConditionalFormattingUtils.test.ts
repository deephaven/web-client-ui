import dh from '@deephaven/jsapi-shim';
import type { Column } from '@deephaven/jsapi-types';
import IrisGridTestUtils from '../../IrisGridTestUtils';
import {
  BooleanCondition,
  CharCondition,
  type BaseFormatConfig,
  type Condition,
  DateCondition,
  FormatStyleType,
  FormatterType,
  type FormattingRule,
  getConditionDBString,
  getFormatColumns,
  isDateConditionValid,
  type ModelColumn,
  NumberCondition,
  StringCondition,
} from './ConditionalFormattingUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

jest.mock('./ConditionalFormattingAPIUtils', () => ({
  makeTernaryFormatRule: jest.fn(
    (_dh, rule, prevRule = null) =>
      `${rule.leftHandValue.name} - ${rule.style.type} : ${prevRule}`
  ),
  makeColumnFormatColumn: jest.fn((col, rule) => `[col] ${rule}`),
  makeRowFormatColumn: jest.fn((_dh, rule) => `[row] ${rule}`),
}));

describe('getFormatColumns', () => {
  function makeColumns(count = 5): Column[] {
    return irisGridTestUtils.makeColumns(count);
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
        leftHandValue: {
          type: columnType,
          name: columnName,
        },
        formattedColumns: [],
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

/**
 * Tests for getConditionDBString, which exercises all private condition-text
 * helpers (getStringConditionText, getNumberConditionText, etc.) and the
 * formatRHV / formatDateRHV utilities.
 *
 * Each test iterates over an array of cases so every condition is covered
 * without an explosion of individual `it` blocks.
 */
describe('getConditionDBString', () => {
  const lhv = 'A';
  const rhvName = 'B';
  const rhvCol: ModelColumn = { name: rhvName, type: 'java.lang.String' };
  const style = { type: FormatStyleType.POSITIVE };

  function makeConfig(
    type: string,
    condition: Condition,
    rightHandValue?: string | ModelColumn
  ): BaseFormatConfig {
    return {
      leftHandValue: { name: lhv, type },
      formattedColumns: [],
      condition,
      rightHandValue,
      style,
    };
  }

  it('formats string conditions: double-quoted string rhv, bare column name rhv', () => {
    const type = 'java.lang.String';
    const val = 'foo';
    const cases: [StringCondition, string, string][] = [
      [
        StringCondition.IS_EXACTLY,
        `${lhv} == "${val}"`,
        `${lhv} == ${rhvName}`,
      ],
      [
        StringCondition.IS_NOT_EXACTLY,
        `${lhv} != "${val}"`,
        `${lhv} != ${rhvName}`,
      ],
      [
        StringCondition.CONTAINS,
        `${lhv} != null && ${lhv}.contains("${val}")`,
        `${lhv} != null && ${lhv}.contains(${rhvName})`,
      ],
      [
        StringCondition.DOES_NOT_CONTAIN,
        `${lhv} != null && !${lhv}.contains("${val}")`,
        `${lhv} != null && !${lhv}.contains(${rhvName})`,
      ],
      [
        StringCondition.STARTS_WITH,
        `${lhv} != null && ${lhv}.startsWith("${val}")`,
        `${lhv} != null && ${lhv}.startsWith(${rhvName})`,
      ],
      [
        StringCondition.ENDS_WITH,
        `${lhv} != null && ${lhv}.endsWith("${val}")`,
        `${lhv} != null && ${lhv}.endsWith(${rhvName})`,
      ],
      [StringCondition.IS_NULL, `${lhv} == null`, `${lhv} == null`],
      [StringCondition.IS_NOT_NULL, `${lhv} != null`, `${lhv} != null`],
    ];
    cases.forEach(([condition, expectedStr, expectedCol]) => {
      expect(getConditionDBString(dh, makeConfig(type, condition, val))).toBe(
        expectedStr
      );
      expect(
        getConditionDBString(dh, makeConfig(type, condition, rhvCol))
      ).toBe(expectedCol);
    });
  });

  it('formats number conditions: unquoted string rhv, bare column name rhv', () => {
    const type = 'int';
    const val = '42';
    const cases: [NumberCondition, string, string][] = [
      [NumberCondition.IS_EQUAL, `${lhv} == ${val}`, `${lhv} == ${rhvName}`],
      [
        NumberCondition.IS_NOT_EQUAL,
        `${lhv} != ${val}`,
        `${lhv} != ${rhvName}`,
      ],
      [NumberCondition.GREATER_THAN, `${lhv} > ${val}`, `${lhv} > ${rhvName}`],
      [
        NumberCondition.GREATER_THAN_OR_EQUAL,
        `${lhv} >= ${val}`,
        `${lhv} >= ${rhvName}`,
      ],
      [NumberCondition.LESS_THAN, `${lhv} < ${val}`, `${lhv} < ${rhvName}`],
      [
        NumberCondition.LESS_THAN_OR_EQUAL,
        `${lhv} <= ${val}`,
        `${lhv} <= ${rhvName}`,
      ],
      [NumberCondition.IS_NULL, `${lhv} == null`, `${lhv} == null`],
      [NumberCondition.IS_NOT_NULL, `${lhv} != null`, `${lhv} != null`],
    ];
    cases.forEach(([condition, expectedStr, expectedCol]) => {
      expect(getConditionDBString(dh, makeConfig(type, condition, val))).toBe(
        expectedStr
      );
      expect(
        getConditionDBString(dh, makeConfig(type, condition, rhvCol))
      ).toBe(expectedCol);
    });
  });

  it('formats boolean conditions (rightHandValue is irrelevant)', () => {
    const type = 'boolean';
    const cases: [BooleanCondition, string][] = [
      [BooleanCondition.IS_TRUE, `${lhv} == true`],
      [BooleanCondition.IS_FALSE, `${lhv} == false`],
      [BooleanCondition.IS_NULL, `${lhv} == null`],
      [BooleanCondition.IS_NOT_NULL, `${lhv} != null`],
    ];
    cases.forEach(([condition, expected]) => {
      expect(getConditionDBString(dh, makeConfig(type, condition))).toBe(
        expected
      );
    });
  });

  it('formats char conditions: single-quoted string rhv, bare column name rhv', () => {
    const type = 'char';
    const val = 'x';
    const cases: [CharCondition, string, string][] = [
      [CharCondition.IS_EQUAL, `${lhv} == '${val}'`, `${lhv} == ${rhvName}`],
      [
        CharCondition.IS_NOT_EQUAL,
        `${lhv} != '${val}'`,
        `${lhv} != ${rhvName}`,
      ],
      [CharCondition.IS_NULL, `isNull(${lhv})`, `isNull(${lhv})`],
      [CharCondition.IS_NOT_NULL, `!isNull(${lhv})`, `!isNull(${lhv})`],
    ];
    cases.forEach(([condition, expectedStr, expectedCol]) => {
      expect(getConditionDBString(dh, makeConfig(type, condition, val))).toBe(
        expectedStr
      );
      expect(
        getConditionDBString(dh, makeConfig(type, condition, rhvCol))
      ).toBe(expectedCol);
    });
  });

  // formatDateRHV: for string values, reformats the timezone and wraps in single
  // quotes. The mock TimeZone.getTimeZone returns { id: tzCode } unchanged, so
  // the timezone id in the output matches the input.
  it('formats date conditions: timezone-processed single-quoted string rhv (formatDateRHV), bare column name rhv', () => {
    const type = 'io.deephaven.time.DateTime';
    const dateStr = '2023-01-01T00:00:00 NY';
    const q = `'2023-01-01T00:00:00 NY'`;
    const cases: [DateCondition, string, string][] = [
      [DateCondition.IS_EXACTLY, `${lhv} == ${q}`, `${lhv} == ${rhvName}`],
      [DateCondition.IS_NOT_EXACTLY, `${lhv} != ${q}`, `${lhv} != ${rhvName}`],
      [DateCondition.IS_BEFORE, `${lhv} < ${q}`, `${lhv} < ${rhvName}`],
      [
        DateCondition.IS_BEFORE_OR_EQUAL,
        `${lhv} <= ${q}`,
        `${lhv} <= ${rhvName}`,
      ],
      [DateCondition.IS_AFTER, `${lhv} > ${q}`, `${lhv} > ${rhvName}`],
      [
        DateCondition.IS_AFTER_OR_EQUAL,
        `${lhv} >= ${q}`,
        `${lhv} >= ${rhvName}`,
      ],
      [DateCondition.IS_NULL, `${lhv} == null`, `${lhv} == null`],
      [DateCondition.IS_NOT_NULL, `${lhv} != null`, `${lhv} != null`],
    ];
    cases.forEach(([condition, expectedStr, expectedCol]) => {
      expect(
        getConditionDBString(dh, makeConfig(type, condition, dateStr))
      ).toBe(expectedStr);
      expect(
        getConditionDBString(dh, makeConfig(type, condition, rhvCol))
      ).toBe(expectedCol);
    });
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
