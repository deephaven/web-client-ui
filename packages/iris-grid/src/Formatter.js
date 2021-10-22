import TableUtils from './TableUtils';
import {
  BooleanColumnFormatter,
  CharColumnFormatter,
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  DefaultColumnFormatter,
  IntegerColumnFormatter,
} from './formatters';

class Formatter {
  /**
   * Converts [{columnType, columnName, format}] to Map { dataType, Map { columnName, format }}
   * @param {Array} columnFormattingRules Array or column formatting rules
   * @returns Map of columnName-to-format Maps indexed by normalized dataType
   */
  static makeColumnFormatMap(columnFormattingRules) {
    if (columnFormattingRules == null) {
      return new Map();
    }
    return columnFormattingRules.reduce((map, next) => {
      const dataType = TableUtils.getNormalizedType(next.columnType);
      if (!map.has(dataType)) {
        map.set(dataType, new Map());
      }
      const formatMap = map.get(dataType);
      formatMap.set(next.columnName, next.format);
      return map;
    }, new Map());
  }

  /**
   * Creates a column formatting rule
   * @param {String} columnType Normalized data type
   * @param {String} columnName Column name
   * @param {String} format Format string
   */
  static makeColumnFormattingRule(columnType, columnName, format) {
    return {
      columnType,
      columnName,
      format,
    };
  }

  /**
   * @param {Array} columnFormattingRules Optional array of column formatting rules
   * @param {Object} dateTimeOptions Optional object with DateTime configuration
   * @param {string} dateTimeOptions.timeZone Time zone
   * @param {boolean} dateTimeOptions.showTimeZone Show time zone in DateTime values
   * @param {boolean} dateTimeOptions.showTSeparator Show 'T' separator in DateTime values
   * @param {string} dateTimeOptions.defaultDateTimeFormatString DateTime format to use if columnFormats for DateTime isn't set
   */
  constructor(columnFormattingRules = [], dateTimeOptions = {}) {
    // Formatting order:
    // - columnFormatMap[type][name]
    // - typeFormatterMap[type]
    // - defaultColumnFormatter

    this.defaultColumnFormatter = new DefaultColumnFormatter();

    // Default formatters by data type
    this.typeFormatterMap = new Map([
      [TableUtils.dataType.BOOLEAN, new BooleanColumnFormatter()],
      [TableUtils.dataType.CHAR, new CharColumnFormatter()],
      [
        TableUtils.dataType.DATETIME,
        new DateTimeColumnFormatter(dateTimeOptions),
      ],
      [TableUtils.dataType.DECIMAL, new DecimalColumnFormatter()],
      [TableUtils.dataType.INT, new IntegerColumnFormatter()],
    ]);

    // Formats indexed by data type and column name
    this.columnFormatMap = Formatter.makeColumnFormatMap(columnFormattingRules);
  }

  /**
   * Gets columnFormatMap indexed by name for a given column type, creates new Map entry if necessary
   * @param {String} columnType column type
   * @param {Boolean} createIfNecessary create new entry if true
   * @returns Map of format strings indexed by column name or undefined if it doesn't exist
   */
  getColumnFormatMapForType(columnType, createIfNecessary = false) {
    const dataType = TableUtils.getNormalizedType(columnType);
    if (createIfNecessary && !this.columnFormatMap.has(dataType)) {
      this.columnFormatMap.set(dataType, new Map());
    }
    return this.columnFormatMap.get(dataType);
  }

  /**
   * Gets a column format object for a given column type and name
   * @param {String} columnType column type
   * @param {String} columnName column name
   * @returns format object or null for Default
   */
  getColumnFormat(columnType, columnName) {
    const columnFormatMap = this.getColumnFormatMapForType(columnType);
    if (columnFormatMap && columnFormatMap.has(columnName)) {
      return columnFormatMap.get(columnName);
    }
    return null;
  }

  getColumnTypeFormatter(columnType) {
    const dataType = TableUtils.getNormalizedType(columnType);
    if (dataType && this.typeFormatterMap.has(dataType)) {
      return this.typeFormatterMap.get(dataType);
    }
    return this.defaultColumnFormatter;
  }

  /**
   * Gets formatted string for a given value, column type and name
   * @param {Any} value Value to format
   * @param {String} columnType Column type used to determine the formatting settings
   * @param {String} columnName Column name used to determine the formatting settings
   * @param {String} formatOverride Format object passed to the formatter in place of the format defined in columnFormatMap
   */
  getFormattedString(
    value,
    columnType,
    columnName = '',
    formatOverride = null
  ) {
    if (value == null) {
      return '';
    }

    const formatter = this.getColumnTypeFormatter(columnType);
    const format =
      formatOverride || this.getColumnFormat(columnType, columnName);

    return formatter.format(value, format);
  }

  /**
   * Gets the timeZone name. E.g. America/New_York
   */
  get timeZone() {
    return this.typeFormatterMap.get(TableUtils.dataType.DATETIME)?.dhTimeZone
      ?.id;
  }
}

export default Formatter;
