function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import TableUtils from "./TableUtils.js";
import { BooleanColumnFormatter, CharColumnFormatter, DateTimeColumnFormatter, DecimalColumnFormatter, DefaultColumnFormatter, IntegerColumnFormatter, StringColumnFormatter } from "./formatters/index.js";
export class Formatter {
  /**
   * Converts FormattingRule[] to Map
   * @param columnFormattingRules Array or column formatting rules
   * @returns Map of columnName-to-format Maps indexed by normalized dataType
   */
  static makeColumnFormatMap(columnFormattingRules) {
    if (columnFormattingRules == null) {
      return new Map();
    }

    return columnFormattingRules.reduce((map, next) => {
      var dataType = TableUtils.getNormalizedType(next.columnType);

      if (dataType === null) {
        return map;
      }

      if (!map.has(dataType)) {
        map.set(dataType, new Map());
      }

      var formatMap = map.get(dataType);
      formatMap === null || formatMap === void 0 ? void 0 : formatMap.set(next.columnName, next.format);
      return map;
    }, new Map());
  }
  /**
   * Creates a column formatting rule
   * @param columnType Normalized data type
   * @param columnName Column name
   * @param format Format object
   */


  static makeColumnFormattingRule(columnType, columnName, format) {
    return {
      columnType,
      columnName,
      format
    };
  }
  /**
   * @param columnFormattingRules Optional array of column formatting rules
   * @param dateTimeOptions Optional object with DateTime configuration
   * @param decimalFormatOptions Optional object with Decimal configuration
   * @param integerFormatOptions Optional object with Integer configuration
   * @param truncateNumbersWithPound Determine if numbers should be truncated w/ repeating # instead of ellipsis at the end
   */


  constructor() {
    var columnFormattingRules = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var dateTimeOptions = arguments.length > 1 ? arguments[1] : undefined;
    var decimalFormatOptions = arguments.length > 2 ? arguments[2] : undefined;
    var integerFormatOptions = arguments.length > 3 ? arguments[3] : undefined;
    var truncateNumbersWithPound = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    _defineProperty(this, "defaultColumnFormatter", void 0);

    _defineProperty(this, "typeFormatterMap", void 0);

    _defineProperty(this, "columnFormatMap", void 0);

    _defineProperty(this, "truncateNumbersWithPound", void 0);

    // Formatting order:
    // - columnFormatMap[type][name]
    // - typeFormatterMap[type]
    // - defaultColumnFormatter
    this.defaultColumnFormatter = new DefaultColumnFormatter(); // Default formatters by data type

    this.typeFormatterMap = new Map([[TableUtils.dataType.BOOLEAN, new BooleanColumnFormatter()], [TableUtils.dataType.CHAR, new CharColumnFormatter()], [TableUtils.dataType.DATETIME, new DateTimeColumnFormatter(dateTimeOptions)], [TableUtils.dataType.DECIMAL, new DecimalColumnFormatter(decimalFormatOptions)], [TableUtils.dataType.INT, new IntegerColumnFormatter(integerFormatOptions)], [TableUtils.dataType.STRING, new StringColumnFormatter()]]); // Formats indexed by data type and column name

    this.columnFormatMap = Formatter.makeColumnFormatMap(columnFormattingRules);
    this.truncateNumbersWithPound = truncateNumbersWithPound;
  }

  /**
   * Gets columnFormatMap indexed by name for a given column type, creates new Map entry if necessary
   * @param columnType column type
   * @param createIfNecessary create new entry if true
   * @returns Map of format strings indexed by column name or undefined if it doesn't exist
   */
  getColumnFormatMapForType(columnType) {
    var createIfNecessary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var dataType = TableUtils.getNormalizedType(columnType);

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


  getColumnFormat(columnType, columnName) {
    var _columnFormatMap$get;

    var columnFormatMap = this.getColumnFormatMapForType(columnType);
    return (_columnFormatMap$get = columnFormatMap === null || columnFormatMap === void 0 ? void 0 : columnFormatMap.get(columnName)) !== null && _columnFormatMap$get !== void 0 ? _columnFormatMap$get : null;
  }

  getColumnTypeFormatter(columnType) {
    var dataType = TableUtils.getNormalizedType(columnType);
    var columnTypeFormatter = this.defaultColumnFormatter;

    if (dataType) {
      var _this$typeFormatterMa;

      columnTypeFormatter = (_this$typeFormatterMa = this.typeFormatterMap.get(dataType)) !== null && _this$typeFormatterMa !== void 0 ? _this$typeFormatterMa : columnTypeFormatter;
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


  getFormattedString(value, columnType) {
    var columnName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var formatOverride = arguments.length > 3 ? arguments[3] : undefined;

    if (value == null) {
      return '';
    }

    var formatter = this.getColumnTypeFormatter(columnType);
    var format = formatOverride || this.getColumnFormat(columnType, columnName);
    return formatter.format(value, format !== null && format !== void 0 ? format : undefined);
  }
  /**
   * Gets the timeZone name
   * @returns The time zone name E.g. America/New_York
   */


  get timeZone() {
    var _formatter$dhTimeZone;

    var formatter = this.typeFormatterMap.get(TableUtils.dataType.DATETIME);
    return formatter === null || formatter === void 0 ? void 0 : (_formatter$dhTimeZone = formatter.dhTimeZone) === null || _formatter$dhTimeZone === void 0 ? void 0 : _formatter$dhTimeZone.id;
  }

}
export default Formatter;
//# sourceMappingURL=Formatter.js.map