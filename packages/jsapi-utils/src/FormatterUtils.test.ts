import Formatter from './Formatter';
import FormatterUtils, {
  getColumnFormats,
  getDateTimeFormatterOptions,
} from './FormatterUtils';
import {
  TableColumnFormat,
  TableColumnFormatter,
  TableColumnFormatType,
} from './formatters';
import TableUtils from './TableUtils';
import { ColumnFormatSettings, DateTimeFormatSettings } from './Settings';

function makeFormatter(...settings: ConstructorParameters<typeof Formatter>) {
  return new Formatter(...settings);
}

function makeFormattingRule(
  label: string,
  formatString = '',
  type: TableColumnFormatType = TableColumnFormatter.TYPE_CONTEXT_CUSTOM
): TableColumnFormat {
  return { label, formatString, type };
}

describe('isCustomColumnFormatDefined', () => {
  const columnFormats = [
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      'Col 1',
      makeFormattingRule('format 1 custom')
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      'Col 2',
      makeFormattingRule(
        'format 2 preset',
        '',
        TableColumnFormatter.TYPE_CONTEXT_PRESET
      )
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      'Col 3',
      makeFormattingRule(
        'format 3 global',
        '',
        TableColumnFormatter.TYPE_GLOBAL
      )
    ),
  ];

  it('is true for columns with custom or preset formats', () => {
    const formatter = makeFormatter(columnFormats);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        'Col 1',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(true);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        'Col 2',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(true);
  });

  it('is false for columns with global or no format', () => {
    const formatter = makeFormatter(columnFormats);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        'Col 3',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(false);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        // No format defined for Col 4
        'Col 4',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(false);
  });
});

describe('getColumnFormats', () => {
  it('should return an array of format rules', () => {
    const settings: ColumnFormatSettings = {
      formatter: [
        {
          columnType: 'integer',
          columnName: 'test1',
          format: {
            label: 'test1',
            formatString: '0.0',
            type: 'type-context-custom',
          },
        },
        {
          columnType: 'decimal',
          columnName: 'test2',
          format: {
            label: 'test2',
            formatString: '0.0',
            type: 'type-context-custom',
          },
        },
      ],
    };

    expect(getColumnFormats(settings)).toEqual(settings.formatter);
  });

  it('should return undefined if settings or settings.formatter is undefined', () => {
    expect(getColumnFormats()).toBeUndefined();
  });
});

describe('getDateTimeFormatterOptions', () => {
  it('should return an object containing date and time formatter options', () => {
    const settings: DateTimeFormatSettings = {
      timeZone: 'America/New_York',
      defaultDateTimeFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
      showTimeZone: true,
      showTSeparator: false,
    };
    const expectedObject = {
      ...settings,
      defaultDateTimeFormatString: 'yyyy-MM-dd HH:mm:ss.SSS',
    };
    delete expectedObject.defaultDateTimeFormat;

    expect(getDateTimeFormatterOptions(settings)).toEqual(expectedObject);
  });
});
