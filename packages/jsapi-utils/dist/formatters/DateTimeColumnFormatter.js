function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint class-methods-use-this: "off" */
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter from "./TableColumnFormatter.js";
var log = Log.module('DateTimeColumnFormatter');
export class DateTimeColumnFormatter extends TableColumnFormatter {
  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format) {
    try {
      dh.i18n.DateTimeFormat.format(format.formatString, new Date());
      return true;
    } catch (e) {
      return false;
    }
  }

  static makeFormat(label, formatString) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : TableColumnFormatter.TYPE_CONTEXT_PRESET;
    return {
      label,
      formatString,
      type
    };
  }
  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */


  static isSameFormat(formatA, formatB) {
    return formatA === formatB || formatA != null && formatB != null && formatA.type === formatB.type && formatA.formatString === formatB.formatString;
  }

  static makeGlobalFormatStringMap(showTimeZone, showTSeparator) {
    var separator = showTSeparator ? "'T'" : ' ';
    var tz = showTimeZone ? ' z' : '';
    return new Map([['yyyy-MM-dd HH:mm:ss', "yyyy-MM-dd".concat(separator, "HH:mm:ss").concat(tz)], ['yyyy-MM-dd HH:mm:ss.SSS', "yyyy-MM-dd".concat(separator, "HH:mm:ss.SSS").concat(tz)], ['yyyy-MM-dd HH:mm:ss.SSSSSSSSS', "yyyy-MM-dd".concat(separator, "HH:mm:ss.SSSSSSSSS").concat(tz)]]);
  }

  static getGlobalFormats(showTimeZone, showTSeparator) {
    var formatStringMap = DateTimeColumnFormatter.makeGlobalFormatStringMap(showTimeZone, showTSeparator);
    return [...formatStringMap.keys()];
  }

  static makeFormatStringMap(showTimeZone, showTSeparator) {
    var separator = showTSeparator ? "'T'" : ' ';
    var tz = showTimeZone ? ' z' : '';
    return new Map([['yyyy-MM-dd', "yyyy-MM-dd".concat(tz)], ['MM-dd-yyyy', "MM-dd-yyyy".concat(tz)], ['HH:mm:ss', "HH:mm:ss".concat(tz)], ['HH:mm:ss.SSS', "HH:mm:ss.SSS".concat(tz)], ['HH:mm:ss.SSSSSSSSS', "HH:mm:ss.SSSSSSSSS".concat(tz)], ['yyyy-MM-dd HH:mm:ss', "yyyy-MM-dd".concat(separator, "HH:mm:ss").concat(tz)], ['yyyy-MM-dd HH:mm:ss.SSS', "yyyy-MM-dd".concat(separator, "HH:mm:ss.SSS").concat(tz)], ['yyyy-MM-dd HH:mm:ss.SSSSSSSSS', "yyyy-MM-dd".concat(separator, "HH:mm:ss.SSSSSSSSS").concat(tz)]]);
  }

  static getFormats(showTimeZone, showTSeparator) {
    var formatStringMap = DateTimeColumnFormatter.makeFormatStringMap(showTimeZone, showTSeparator);
    return [...formatStringMap.keys()];
  }

  constructor() {
    var {
      timeZone: timeZoneParam = '',
      showTimeZone = true,
      showTSeparator = false,
      defaultDateTimeFormatString = DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super();

    _defineProperty(this, "dhTimeZone", void 0);

    _defineProperty(this, "defaultDateTimeFormatString", void 0);

    _defineProperty(this, "showTimeZone", void 0);

    _defineProperty(this, "showTSeparator", void 0);

    _defineProperty(this, "formatStringMap", void 0);

    var timeZone = timeZoneParam || DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID;

    try {
      this.dhTimeZone = dh.i18n.TimeZone.getTimeZone(timeZone);
    } catch (e) {
      log.error('Unsupported time zone id', timeZone);
      this.dhTimeZone = dh.i18n.TimeZone.getTimeZone(DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID);
    }

    this.defaultDateTimeFormatString = defaultDateTimeFormatString;
    this.showTimeZone = showTimeZone;
    this.showTSeparator = showTSeparator;
    this.formatStringMap = DateTimeColumnFormatter.makeFormatStringMap(showTimeZone, showTSeparator);
  }

  getEffectiveFormatString(baseFormatString) {
    return this.formatStringMap.get(baseFormatString) || baseFormatString;
  }

  format(value, format) {
    var baseFormatString = format && format.formatString || this.defaultDateTimeFormatString;
    var formatString = this.getEffectiveFormatString(baseFormatString);

    try {
      return dh.i18n.DateTimeFormat.format(formatString, value, this.dhTimeZone);
    } catch (e) {
      log.error('Invalid format arguments');
    }

    return '';
  }

}

_defineProperty(DateTimeColumnFormatter, "DEFAULT_DATETIME_FORMAT_STRING", 'yyyy-MM-dd HH:mm:ss.SSS');

_defineProperty(DateTimeColumnFormatter, "DEFAULT_TIME_ZONE_ID", 'America/New_York');

export default DateTimeColumnFormatter;
//# sourceMappingURL=DateTimeColumnFormatter.js.map