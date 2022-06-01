function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint class-methods-use-this: "off" */

/**
 * Default column data formatter. Just interpolates the value as a string and returns.
 * Extend this class and register with TableUtils to make use of it.
 */
export class TableColumnFormatter {
  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format) {
    return true;
  }
  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */


  static isSameFormat(formatA, formatB) {
    throw new Error('isSameFormat not implemented');
  }
  /**
   * Create and return a Format object
   * @param label The label of the format object
   * @param formatString Format string to use for the format
   * @param type The type of column to use for this format
   * @returns A format object
   */


  static makeFormat(label, formatString, type) {
    return {
      label,
      formatString,
      type
    };
  }
  /**
   * @param value The value to format
   * @param format Optional format object with value transformation options
   * @returns String the formatted text string of the value passed in.
   */


  format(value, format) {
    return '';
  }

}

_defineProperty(TableColumnFormatter, "TYPE_GLOBAL", 'type-global');

_defineProperty(TableColumnFormatter, "TYPE_CONTEXT_PRESET", 'type-context-preset');

_defineProperty(TableColumnFormatter, "TYPE_CONTEXT_CUSTOM", 'type-context-custom');

export default TableColumnFormatter;
//# sourceMappingURL=TableColumnFormatter.js.map