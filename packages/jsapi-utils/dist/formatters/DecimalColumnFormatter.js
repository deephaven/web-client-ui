function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint class-methods-use-this: "off" */
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter from "./TableColumnFormatter.js";
var log = Log.module('DecimalColumnFormatter');
export class DecimalColumnFormatter extends TableColumnFormatter {
  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format) {
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


  static makeFormat(label, formatString) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : TableColumnFormatter.TYPE_CONTEXT_PRESET;
    var multiplier = arguments.length > 3 ? arguments[3] : undefined;
    return {
      label,
      type,
      formatString,
      multiplier
    };
  }
  /**
   * Convenient function to create a DecimalFormatObject with Preset type set
   * @param label Label for this format object
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns DecimalColumnFormat object
   */


  static makePresetFormat(label) {
    var formatString = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var multiplier = arguments.length > 2 ? arguments[2] : undefined;
    return DecimalColumnFormatter.makeFormat(label, formatString, TableColumnFormatter.TYPE_CONTEXT_PRESET, multiplier);
  }
  /**
   * Convenient function to create a DecimalFormatObject with a default 'Custom Format' label and Custom type
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns DecimalColumnFormat object
   */


  static makeCustomFormat() {
    var formatString = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var multiplier = arguments.length > 1 ? arguments[1] : undefined;
    return DecimalColumnFormatter.makeFormat('Custom Format', formatString, TableColumnFormatter.TYPE_CONTEXT_CUSTOM, multiplier);
  }

  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */
  static isSameFormat(formatA, formatB) {
    return formatA === formatB || formatA != null && formatB != null && formatA.type === formatB.type && formatA.formatString === formatB.formatString && formatA.multiplier === formatB.multiplier;
  }

  constructor() {
    var {
      defaultFormatString = DecimalColumnFormatter.DEFAULT_FORMAT_STRING
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super();

    _defineProperty(this, "defaultFormatString", void 0);

    this.defaultFormatString = defaultFormatString;
  }
  /**
   * Format a value with the provided format object
   * @param valueParam Value to format
   * @param format Format object
   * @returns Formatted string
   */


  format(valueParam, format) {
    var formatString = format && format.formatString || this.defaultFormatString;
    var value = format && format.multiplier ? valueParam * format.multiplier : valueParam;

    try {
      return dh.i18n.NumberFormat.format(formatString, value);
    } catch (e) {
      log.error('Invalid format arguments');
    }

    return '';
  }

}

_defineProperty(DecimalColumnFormatter, "DEFAULT_FORMAT_STRING", '###,##0.0000');

_defineProperty(DecimalColumnFormatter, "FORMAT_PERCENT", DecimalColumnFormatter.makePresetFormat('Percent', '##0.00%'));

_defineProperty(DecimalColumnFormatter, "FORMAT_BASIS_POINTS", DecimalColumnFormatter.makePresetFormat('Basis Points', '###,##0 bp', 10000));

_defineProperty(DecimalColumnFormatter, "FORMAT_MILLIONS", DecimalColumnFormatter.makePresetFormat('Millions', '###,##0.000 mm', 0.000001));

_defineProperty(DecimalColumnFormatter, "FORMAT_ROUND", DecimalColumnFormatter.makePresetFormat('Round', '###,##0'));

_defineProperty(DecimalColumnFormatter, "FORMAT_ROUND_TWO_DECIMALS", DecimalColumnFormatter.makePresetFormat('0.00', '###,##0.00'));

_defineProperty(DecimalColumnFormatter, "FORMAT_ROUND_FOUR_DECIMALS", DecimalColumnFormatter.makePresetFormat('0.0000', '###,##0.0000'));

export default DecimalColumnFormatter;
//# sourceMappingURL=DecimalColumnFormatter.js.map