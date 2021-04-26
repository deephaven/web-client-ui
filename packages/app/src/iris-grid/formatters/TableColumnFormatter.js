/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/**
 * Default column data formatter. Just interpolates the value as a string and returns.
 * Extend this class and register with TableUtils to make use of it.
 */
class TableColumnFormatter {
  static TYPE_GLOBAL = 'type-global';

  static TYPE_CONTEXT_PRESET = 'type-context-preset';

  static TYPE_CONTEXT_CUSTOM = 'type-context-custom';

  static TYPE_QUERY = 'type-query';

  /**
   * Validates format object
   * @param {Object} format Format object
   * @returns {boolean} true for valid object
   */
  static isValid(format) {
    return true;
  }

  /**
   * Check if the given formats match
   * @param {?Object} formatA format object to check
   * @param {?Object} formatB format object to check
   * @returns {boolean} True if the formats match
   */
  static isSameFormat(formatA, formatB) {
    throw new Error('isSameFormat not implemented');
  }

  /**
   * Returns format object
   */
  static makeFormat() {
    return null;
  }

  /**
   * @param {Object} value The value to format
   * @param {Object} format Optional format object with value transformation options
   * @returns String the formatted text string of the value passed in.
   */
  format(value, format) {
    return '';
  }
}

export default TableColumnFormatter;
