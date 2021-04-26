/* eslint class-methods-use-this: "off" */
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter from './TableColumnFormatter';

const log = Log.module('DecimalTableColumnFormatter');

class DecimalTableColumnFormatter extends TableColumnFormatter {
  /**
   * Validates format object
   * @param {Object} format Format object
   * @returns {boolean} true for valid object
   */
  static isValid(format) {
    try {
      dh.i18n.NumberFormat.format(format.formatString, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  static makeFormat(
    label,
    formatString,
    multiplier = null,
    type = TableColumnFormatter.TYPE_CONTEXT_PRESET
  ) {
    return {
      label,
      type,
      formatString,
      multiplier,
    };
  }

  static makeCustomFormat(formatString = null, multiplier = null) {
    return DecimalTableColumnFormatter.makeFormat(
      'Custom Format',
      formatString,
      multiplier,
      TableColumnFormatter.TYPE_CONTEXT_CUSTOM
    );
  }

  static makeQueryFormat(formatString = null, multiplier = null) {
    return DecimalTableColumnFormatter.makeFormat(
      'Query Format',
      formatString,
      multiplier,
      TableColumnFormatter.TYPE_QUERY
    );
  }

  static DEFAULT_FORMAT_STRING = '###,##0.0000';

  static FORMAT_PERCENT = DecimalTableColumnFormatter.makeFormat(
    'Percent',
    '##0.00%'
  );

  static FORMAT_BASIS_POINTS = DecimalTableColumnFormatter.makeFormat(
    'Basis Points',
    '###,##0 bp',
    10000
  );

  static FORMAT_MILLIONS = DecimalTableColumnFormatter.makeFormat(
    'Millions',
    '###,##0.000 mm',
    0.000001
  );

  static FORMAT_ROUND = DecimalTableColumnFormatter.makeFormat(
    'Round',
    '###,##0'
  );

  static FORMAT_ROUND_TWO_DECIMALS = DecimalTableColumnFormatter.makeFormat(
    '0.00',
    '###,##0.00'
  );

  static FORMAT_ROUND_FOUR_DECIMALS = DecimalTableColumnFormatter.makeFormat(
    '0.0000',
    '###,##0.0000'
  );

  /**
   * Check if the given formats match
   * @param {?Object} formatA format object to check
   * @param {?Object} formatB format object to check
   * @returns {boolean} True if the formats match
   */
  static isSameFormat(formatA, formatB) {
    return (
      formatA === formatB ||
      (formatA != null &&
        formatB != null &&
        formatA.type === formatB.type &&
        formatA.formatString === formatB.formatString &&
        formatA.multiplier === formatB.multiplier)
    );
  }

  /**
   * @param {number} valueParam Value to format
   * @param {Object} format Format object
   * @param {string} format.formatString Format string
   * @param {number|null} format.multiplier Optional multiplier
   * @returns {string} Formatted string
   */
  format(valueParam, format) {
    const formatString =
      (format && format.formatString) ||
      DecimalTableColumnFormatter.DEFAULT_FORMAT_STRING;
    const value =
      format && format.multiplier ? valueParam * format.multiplier : valueParam;
    try {
      return dh.i18n.NumberFormat.format(formatString, value);
    } catch (e) {
      log.error('Invalid format arguments');
    }
    return '';
  }
}

export default DecimalTableColumnFormatter;
