import TableUtils, { DataType } from './TableUtils';
import {
  BooleanColumnFormatter,
  CharColumnFormatter,
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  DefaultColumnFormatter,
  IntegerColumnFormatter,
  TableColumnFormat,
  TableColumnFormatter,
} from './formatters';
import StringColumnFormatter from './formatters/StringColumnFormatter';

type ColumnName = string;

export interface FormattingRule {
  columnType: string;
  columnName: string;
  format: TableColumnFormat;
}

class Formatter {
  /**
   * Converts FormattingRule[] to Map
   * @param columnFormattingRules Array or column formatting rules
   * @returns Map of columnName-to-format Maps indexed by normalized dataType
   */
  static makeColumnFormatMap(
    columnFormattingRules: FormattingRule[]
  ): Map<DataType, Map<ColumnName, TableColumnFormat>> {
    if (columnFormattingRules == null) {
      return new Map();
    }
    return columnFormattingRules.reduce((map, next) => {
      const dataType = TableUtils.getNormalizedType(next.columnType);
      if (dataType === null) {
        return map;
      }

      if (!map.has(dataType)) {
        map.set(dataType, new Map());
      }
      const formatMap = map.get(dataType);
      formatMap?.set(next.columnName, next.format);
      return map;
    }, new Map<DataType, Map<ColumnName, TableColumnFormat>>());
  }

  /**
   * Creates a column formatting rule
   * @param columnType Normalized data type
   * @param columnName Column name
   * @param format Format object
   */
  static makeColumnFormattingRule(
    columnType: DataType,
    columnName: string,
    format: TableColumnFormat
  ): FormattingRule {
    return {
      columnType,
      columnName,
      format,
    };
  }

  /**
   * @param columnFormattingRules Optional array of column formatting rules
   * @param dateTimeOptions Optional object with DateTime configuration
   * @param decimalFormatOptions Optional object with Decimal configuration
   * @param integerFormatOptions Optional object with Integer configuration
   * @param truncateNumbersWithPound Determine if numbers should be truncated w/ repeating # instead of ellipsis at the end
   */
  constructor(
    columnFormattingRules: FormattingRule[] = [],
    dateTimeOptions?: ConstructorParameters<typeof DateTimeColumnFormatter>[0],
    decimalFormatOptions?: ConstructorParameters<
      typeof DecimalColumnFormatter
    >[0],
    integerFormatOptions?: ConstructorParameters<
      typeof IntegerColumnFormatter
    >[0],
    truncateNumbersWithPound = false
  ) {
    // Formatting order:
    // - columnFormatMap[type][name]
    // - typeFormatterMap[type]
    // - defaultColumnFormatter

    this.defaultColumnFormatter = new DefaultColumnFormatter();

    // Default formatters by data type
    this.typeFormatterMap = new Map<DataType, TableColumnFormatter>([
      [TableUtils.dataType.BOOLEAN, new BooleanColumnFormatter()],
      [TableUtils.dataType.CHAR, new CharColumnFormatter()],
      [
        TableUtils.dataType.DATETIME,
        new DateTimeColumnFormatter(dateTimeOptions),
      ],
      [
        TableUtils.dataType.DECIMAL,
        new DecimalColumnFormatter(decimalFormatOptions),
      ],
      [
        TableUtils.dataType.INT,
        new IntegerColumnFormatter(integerFormatOptions),
      ],
      [TableUtils.dataType.STRING, new StringColumnFormatter()],
    ]);

    // Formats indexed by data type and column name
    this.columnFormatMap = Formatter.makeColumnFormatMap(columnFormattingRules);
    this.truncateNumbersWithPound = truncateNumbersWithPound;
  }

  defaultColumnFormatter: TableColumnFormatter;

  typeFormatterMap: Map<DataType, TableColumnFormatter>;

  columnFormatMap: Map<DataType, Map<string, TableColumnFormat>>;

  truncateNumbersWithPound: boolean;

  /**
   * Gets columnFormatMap indexed by name for a given column type, creates new Map entry if necessary
   * @param columnType column type
   * @param createIfNecessary create new entry if true
   * @returns Map of format strings indexed by column name or undefined if it doesn't exist
   */
  getColumnFormatMapForType(
    columnType: string,
    createIfNecessary = false
  ): Map<string, TableColumnFormat> | undefined {
    const dataType = TableUtils.getNormalizedType(columnType);
    if (dataType === null) {
      return undefined;
    }

    if (createIfNecessary && !this.columnFormatMap.has(dataType)) {
      this.columnFormatMap.set(dataType, new Map());
    }
    return this.columnFormatMap.get(dataType);
  }

  /**
   * Gets a column format object for a given column type and name
   * @param columnType column type
   * @param columnName column name
   * @returns format object or null for Default
   */
  getColumnFormat(
    columnType: string,
    columnName: string
  ): TableColumnFormat | null {
    const columnFormatMap = this.getColumnFormatMapForType(columnType);
    return columnFormatMap?.get(columnName) ?? null;
  }

  getColumnTypeFormatter(columnType: string): TableColumnFormatter {
    const dataType = TableUtils.getNormalizedType(columnType);
    let columnTypeFormatter = this.defaultColumnFormatter;
    if (dataType) {
      columnTypeFormatter =
        this.typeFormatterMap.get(dataType) ?? columnTypeFormatter;
    }
    return columnTypeFormatter;
  }

  /**
   * Gets formatted string for a given value, column type and name
   * @param value Value to format
   * @param columnType Column type used to determine the formatting settings
   * @param columnName Column name used to determine the formatting settings
   * @param formatOverride Format object passed to the formatter in place of the format defined in columnFormatMap
   */
  getFormattedString(
    value: unknown,
    columnType: string,
    columnName = '',
    formatOverride?: TableColumnFormat
  ): string {
    if (value == null) {
      return '';
    }

    const formatter = this.getColumnTypeFormatter(columnType);
    const format =
      formatOverride || this.getColumnFormat(columnType, columnName);

    return formatter.format(value, format ?? undefined);
  }

  /**
   * Gets the timeZone name
   * @returns The time zone name E.g. America/New_York
   */
  get timeZone(): string {
    const formatter = this.typeFormatterMap.get(
      TableUtils.dataType.DATETIME
    ) as DateTimeColumnFormatter;
    return formatter?.dhTimeZone?.id;
  }
}

export default Formatter;
