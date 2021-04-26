/* eslint class-methods-use-this: "off" */
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter from './TableColumnFormatter';

const log = Log.module('DateTimeColumnFormatter');

class DateTimeColumnFormatter extends TableColumnFormatter {
  /**
   * Validates format object
   * @param {Object} format Format object
   * @returns {boolean} true for valid object
   */
  static isValid(format) {
    try {
      dh.i18n.DateTimeFormat.format(format.formatString, new Date());
      return true;
    } catch (e) {
      return false;
    }
  }

  static makeFormat(
    label,
    formatString,
    type = TableColumnFormatter.TYPE_CONTEXT_PRESET
  ) {
    return {
      label,
      formatString,
      type,
    };
  }

  static makeQueryFormat(formatString = null) {
    return DateTimeColumnFormatter.makeFormat(
      'Query Format',
      formatString,
      TableColumnFormatter.TYPE_QUERY
    );
  }

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
        formatA.formatString === formatB.formatString)
    );
  }

  static DEFAULT_DATETIME_FORMAT_STRING = 'yyyy-MM-dd HH:mm:ss.SSS';

  static DEFAULT_TIME_ZONE_ID = 'America/New_York';

  static makeGlobalFormatStringMap(showTimeZone, showTSeparator) {
    const separator = showTSeparator ? `'T'` : ' ';
    const tz = showTimeZone ? ' z' : '';
    return new Map([
      ['yyyy-MM-dd HH:mm:ss', `yyyy-MM-dd${separator}HH:mm:ss${tz}`],
      ['yyyy-MM-dd HH:mm:ss.SSS', `yyyy-MM-dd${separator}HH:mm:ss.SSS${tz}`],
      [
        'yyyy-MM-dd HH:mm:ss.SSSSSSSSS',
        `yyyy-MM-dd${separator}HH:mm:ss.SSSSSSSSS${tz}`,
      ],
    ]);
  }

  static getGlobalFormats(showTimeZone, showTSeparator) {
    const formatStringMap = DateTimeColumnFormatter.makeGlobalFormatStringMap(
      showTimeZone,
      showTSeparator
    );
    return [...formatStringMap.keys()];
  }

  static makeFormatStringMap(showTimeZone, showTSeparator) {
    const separator = showTSeparator ? `'T'` : ' ';
    const tz = showTimeZone ? ' z' : '';
    return new Map([
      ['yyyy-MM-dd', `yyyy-MM-dd${tz}`],
      ['MM-dd-yyyy', `MM-dd-yyyy${tz}`],
      ['HH:mm:ss', `HH:mm:ss${tz}`],
      ['HH:mm:ss.SSS', `HH:mm:ss.SSS${tz}`],
      ['HH:mm:ss.SSSSSSSSS', `HH:mm:ss.SSSSSSSSS${tz}`],
      ['yyyy-MM-dd HH:mm:ss', `yyyy-MM-dd${separator}HH:mm:ss${tz}`],
      ['yyyy-MM-dd HH:mm:ss.SSS', `yyyy-MM-dd${separator}HH:mm:ss.SSS${tz}`],
      [
        'yyyy-MM-dd HH:mm:ss.SSSSSSSSS',
        `yyyy-MM-dd${separator}HH:mm:ss.SSSSSSSSS${tz}`,
      ],
    ]);
  }

  static getFormats(showTimeZone, showTSeparator) {
    const formatStringMap = DateTimeColumnFormatter.makeFormatStringMap(
      showTimeZone,
      showTSeparator
    );
    return [...formatStringMap.keys()];
  }

  constructor({
    timeZone: timeZoneParam,
    showTimeZone = true,
    showTSeparator = false,
    defaultDateTimeFormatString = DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING,
  } = {}) {
    super();

    const timeZone =
      timeZoneParam || DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID;

    try {
      this.dhTimeZone = dh.i18n.TimeZone.getTimeZone(timeZone);
    } catch (e) {
      log.error('Unsupported time zone id', timeZone);
      this.dhTimeZone = dh.i18n.TimeZone.getTimeZone(
        DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID
      );
    }

    this.defaultDateTimeFormatString = defaultDateTimeFormatString;
    this.showTimeZone = showTimeZone;
    this.showTSeparator = showTSeparator;
    this.formatStringMap = DateTimeColumnFormatter.makeFormatStringMap(
      showTimeZone,
      showTSeparator
    );
  }

  getEffectiveFormatString(baseFormatString) {
    return this.formatStringMap.get(baseFormatString) || baseFormatString;
  }

  format(value, format) {
    const baseFormatString =
      (format && format.formatString) || this.defaultDateTimeFormatString;
    const formatString = this.getEffectiveFormatString(baseFormatString);
    try {
      return dh.i18n.DateTimeFormat.format(
        formatString,
        value,
        this.dhTimeZone
      );
    } catch (e) {
      log.error('Invalid format arguments');
    }
    return '';
  }
}

export default DateTimeColumnFormatter;
