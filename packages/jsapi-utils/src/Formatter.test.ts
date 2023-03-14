import Formatter from './Formatter';
import {
  BooleanColumnFormatter,
  CharColumnFormatter,
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  DefaultColumnFormatter,
  IntegerColumnFormatter,
  TableColumnFormat,
  TableColumnFormatType,
} from './formatters';
import TableUtils from './TableUtils';

function makeFormatter(...settings: ConstructorParameters<typeof Formatter>) {
  return new Formatter(...settings);
}

function makeFormattingRule(
  label: string,
  formatString = '',
  type: TableColumnFormatType = 'type-context-custom'
): TableColumnFormat {
  return { label, formatString, type };
}

const TYPE_DATETIME = 'io.deephaven.time.DateTime';

describe('makeColumnFormatMap', () => {
  const conflictingColumnName = 'Conflicting name';
  const lastFormat = {
    label: 'Last format',
    formatString: 'yyyy',
    type: 'type-context-custom' as const,
  };
  const formatArray = [
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DATETIME,
      'Col 1',
      makeFormattingRule('format 1')
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DATETIME,
      'Col 2',
      makeFormattingRule('format 2')
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      conflictingColumnName,
      makeFormattingRule('format 3')
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      conflictingColumnName,
      lastFormat
    ),
  ];

  it('converts empty array of format definitions to empty map of name-to-format maps', () => {
    const formatMap = Formatter.makeColumnFormatMap([]);
    expect(formatMap.size).toBe(0);
  });

  it('converts array of format definitions to map of name-to-format maps', () => {
    const formatMap = Formatter.makeColumnFormatMap(formatArray);
    expect(formatMap.size).toBe(2);
    expect(formatMap.get(TableUtils.dataType.DATETIME)?.size).toBe(2);
  });

  it('uses the last format definition in case of conflicting column names', () => {
    const formatMap = Formatter.makeColumnFormatMap(formatArray);
    expect(formatMap.get(TableUtils.dataType.DECIMAL)?.size).toBe(1);
    expect(
      formatMap.get(TableUtils.dataType.DECIMAL)?.get(conflictingColumnName)
    ).toBe(lastFormat);
  });

  it('returns an empty map if columnFormattingRules is null', () => {
    // @ts-expect-error test null columnFormattingRules
    const formatMap = Formatter.makeColumnFormatMap(null);
    expect(formatMap.size).toBe(0);
  });
});

it('returns correct formatters for given column types', () => {
  const formatter = makeFormatter();
  expect(formatter.getColumnTypeFormatter(TYPE_DATETIME)).toBeInstanceOf(
    DateTimeColumnFormatter
  );
  expect(formatter.getColumnTypeFormatter('java.lang.Integer')).toBeInstanceOf(
    IntegerColumnFormatter
  );
  expect(formatter.getColumnTypeFormatter('java.lang.Float')).toBeInstanceOf(
    DecimalColumnFormatter
  );
  expect(formatter.getColumnTypeFormatter('java.lang.Boolean')).toBeInstanceOf(
    BooleanColumnFormatter
  );
  expect(
    formatter.getColumnTypeFormatter('java.lang.Character')
  ).toBeInstanceOf(CharColumnFormatter);
});

it('uses default formatter for types that have no custom formatter', () => {
  expect(
    makeFormatter().getColumnTypeFormatter('randomTypeWithNoCustomFormatter')
  ).toBeInstanceOf(DefaultColumnFormatter);
});

describe('getColumnFormat', () => {
  const customFormatString = 'customFormatString';
  const columnNameWithCustomFormat = 'columnNameWithCustomFormat';
  const customFormat = DateTimeColumnFormatter.makeFormat(
    'Format Label',
    customFormatString
  );
  const columnFormats = [
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DATETIME,
      columnNameWithCustomFormat,
      customFormat
    ),
  ];

  const formatter = makeFormatter(columnFormats);
  it('returns null for DateTime column with no custom format', () => {
    const formatString = formatter.getColumnFormat(
      TYPE_DATETIME,
      'randomColumnNameWithNoCustomFormat'
    );
    expect(formatString).toBeNull();
  });

  it('returns null for DateTime column with default format defined but no custom format', () => {
    expect(formatter.getColumnFormat(TYPE_DATETIME, 'Timestamp')).toBeNull();
  });

  it('returns format object for DateTime column with defined custom format', () => {
    expect(
      formatter.getColumnFormat(TYPE_DATETIME, columnNameWithCustomFormat)
    ).toBe(customFormat);
  });
});

describe('getFormattedString', () => {
  it('returns an empty string when value is null', () => {
    const formatter = makeFormatter();
    expect(formatter.getFormattedString(null, 'decimal')).toBe('');
  });

  it('passes undefined to formatter.format for column with no custom format', () => {
    const value = 'randomValue';
    const columnType = TYPE_DATETIME;
    const columnName = 'randomColumnName';
    const formatter = makeFormatter();
    const columnTypeFormatter = formatter.getColumnTypeFormatter(columnType);
    const originalFormatFn = columnTypeFormatter.format;
    columnTypeFormatter.format = jest.fn();
    formatter.getFormattedString(value, columnType, columnName);
    expect(columnTypeFormatter.format).toHaveBeenCalledWith(value, undefined);
    columnTypeFormatter.format = originalFormatFn;
  });

  it('passes custom format to formatter.format for column with custom format', () => {
    const value = 'randomValue';
    const customFormatString = 'customFormatString';
    const columnNameWithCustomFormat = 'columnNameWithCustomFormat';
    const columnType = TYPE_DATETIME;
    const customFormat = DateTimeColumnFormatter.makeFormat(
      'Format Label',
      customFormatString
    );
    const customColumnFormats = [
      Formatter.makeColumnFormattingRule(
        TableUtils.dataType.DATETIME,
        columnNameWithCustomFormat,
        customFormat
      ),
    ];
    const formatter = makeFormatter(customColumnFormats);

    const columnTypeFormatter = formatter.getColumnTypeFormatter(columnType);
    const originalFormatFn = columnTypeFormatter.format;
    columnTypeFormatter.format = jest.fn();
    const columnFormat = formatter.getColumnFormat(
      columnType,
      columnNameWithCustomFormat
    );
    formatter.getFormattedString(value, columnType, columnNameWithCustomFormat);
    expect(columnTypeFormatter.format).toHaveBeenCalledWith(
      value,
      columnFormat
    );
    columnTypeFormatter.format = originalFormatFn;
  });
});

describe('getColumnFormatMapForType', () => {
  it('should get columnFormatMap for a given column type and create new map entry', () => {
    const formatter = makeFormatter();
    const formatMap = formatter.getColumnFormatMapForType('decimal', true);
    if (formatMap) {
      expect(formatMap).not.toBeUndefined();
      expect(formatMap.size).toBe(0);
    }
  });

  it('returns undefined if no formatmap exists and createIfNecessary is false', () => {
    const formatter = new Formatter();
    const formatMap = formatter.getColumnFormatMapForType('decimal');
    expect(formatMap).toBeUndefined();
  });
});

describe('timeZone', () => {
  it('should return the time zone name', () => {
    const formatter = makeFormatter();
    expect(formatter.timeZone).toBe('America/New_York');
  });
});
