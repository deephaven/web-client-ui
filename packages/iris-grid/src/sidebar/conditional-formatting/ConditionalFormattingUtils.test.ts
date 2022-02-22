import { Column } from '@deephaven/jsapi-shim';
import IrisGridTestUtils from '../../IrisGridTestUtils';
import {
  FormatStyleType,
  FormatterType,
  FormattingRule,
  getFormatColumns,
  StringCondition,
} from './ConditionalFormattingUtils';

jest.mock('./ConditionalFormattingAPIUtils', () => ({
  makeTernaryFormatRule: jest.fn(
    (rule, prevRule = null) =>
      `${rule.column.name} - ${rule.style.type} : ${prevRule}`
  ),
  makeColumnFormatColumn: jest.fn((col, rule) => rule),
  makeRowFormatColumn: jest.fn(rule => rule),
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
    ).toEqual([`0 - ${FormatStyleType.POSITIVE} : null`]);
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
    ).toEqual([`0 - ${FormatStyleType.POSITIVE} : null`]);
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
      `0 - ${FormatStyleType.NEGATIVE} : 0 - ${FormatStyleType.POSITIVE} : null`,
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
      `0 - ${FormatStyleType.NEGATIVE} : 0 - ${FormatStyleType.POSITIVE} : null`,
      `1 - ${FormatStyleType.NEGATIVE} : 1 - ${FormatStyleType.POSITIVE} : null`,
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
      `0 - ${FormatStyleType.NEUTRAL} : 0 - ${FormatStyleType.POSITIVE} : null`,
      `0 - ${FormatStyleType.WARN} : 0 - ${FormatStyleType.NEGATIVE} : null`,
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
      `0 - ${FormatStyleType.NEGATIVE} : 0 - ${FormatStyleType.POSITIVE} : null`,
      `1 - ${FormatStyleType.NEGATIVE} : 1 - ${FormatStyleType.POSITIVE} : null`,
    ]);
  });
});
