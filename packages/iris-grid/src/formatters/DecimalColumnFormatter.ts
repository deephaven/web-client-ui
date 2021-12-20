/* eslint class-methods-use-this: "off" */
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter, {
  TableColumnFormat,
} from './TableColumnFormatter';

const log = Log.module('DecimalColumnFormatter');

export type DecimalColumnFormat = TableColumnFormat & {
  multiplier?: number;
};

export class DecimalColumnFormatter extends TableColumnFormatter {
  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format: TableColumnFormat): boolean {
    try {
      dh.i18n.NumberFormat.format(format.formatString, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create a DecimalColumnFormat object with the parameters specified
   * @param label Label for the format
   * @param formatString Format string for the format
   * @param multiplier Optional multiplier for the formatter
   * @param type Type of format created
   * @returns DecimalColumnFormat object
   */
  static makeFormat(
    label: string,
    formatString: string,
    type = TableColumnFormatter.TYPE_CONTEXT_PRESET,
    multiplier?: number
  ): DecimalColumnFormat {
    return {
      label,
      type,
      formatString,
      multiplier,
    };
  }

  /**
   * Convenient function to create a DecimalFormatObject with a default 'Custom Format' label and Custom type
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns DecimalColumnFormat object
   */
  static makeCustomFormat(
    formatString = '',
    multiplier?: number
  ): DecimalColumnFormat {
    return DecimalColumnFormatter.makeFormat(
      'Custom Format',
      formatString,
      TableColumnFormatter.TYPE_CONTEXT_CUSTOM,
      multiplier
    );
  }

  static DEFAULT_FORMAT_STRING = '###,##0.0000';

  static FORMAT_PERCENT = DecimalColumnFormatter.makeFormat(
    'Percent',
    '##0.00%'
  );

  static FORMAT_BASIS_POINTS = DecimalColumnFormatter.makeFormat(
    'Basis Points',
    '###,##0 bp',
    10000
  );

  static FORMAT_MILLIONS = DecimalColumnFormatter.makeFormat(
    'Millions',
    '###,##0.000 mm',
    0.000001
  );

  static FORMAT_ROUND = DecimalColumnFormatter.makeFormat('Round', '###,##0');

  static FORMAT_ROUND_TWO_DECIMALS = DecimalColumnFormatter.makeFormat(
    '0.00',
    '###,##0.00'
  );

  static FORMAT_ROUND_FOUR_DECIMALS = DecimalColumnFormatter.makeFormat(
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
      DecimalColumnFormatter.DEFAULT_FORMAT_STRING;
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

export default DecimalColumnFormatter;
