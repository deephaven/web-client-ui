/* eslint class-methods-use-this: "off" */
import dh, { DateWrapper, TimeZone } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter, {
  TableColumnFormat,
} from './TableColumnFormatter';

const log = Log.module('DateTimeColumnFormatter');

export type DateTimeColumnFormatterOptions = {
  // Time zone
  timeZone?: string;

  // Show time zone in DateTime values
  showTimeZone?: boolean;

  // Show 'T' separator in DateTime values
  showTSeparator?: boolean;

  // DateTime format to use if columnFormats for DateTime isn't set
  defaultDateTimeFormatString?: string;
};

export class DateTimeColumnFormatter extends TableColumnFormatter {
  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format: TableColumnFormat): boolean {
    try {
      dh.i18n.DateTimeFormat.format(format.formatString, new Date());
      return true;
    } catch (e) {
      return false;
    }
  }

  static makeFormat(
    label: string,
    formatString: string,
    type = TableColumnFormatter.TYPE_CONTEXT_PRESET
  ): TableColumnFormat {
    return {
      label,
      formatString,
      type,
    };
  }

  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */
  static isSameFormat(
    formatA?: TableColumnFormat,
    formatB?: TableColumnFormat
  ): boolean {
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

  static makeGlobalFormatStringMap(
    showTimeZone: boolean,
    showTSeparator: boolean
  ): Map<string, string> {
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

  static getGlobalFormats(
    showTimeZone: boolean,
    showTSeparator: boolean
  ): string[] {
    const formatStringMap = DateTimeColumnFormatter.makeGlobalFormatStringMap(
      showTimeZone,
      showTSeparator
    );
    return [...formatStringMap.keys()];
  }

  static makeFormatStringMap(
    showTimeZone?: boolean,
    showTSeparator?: boolean
  ): Map<string, string> {
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

  static getFormats(
    showTimeZone?: boolean,
    showTSeparator?: boolean
  ): string[] {
    const formatStringMap = DateTimeColumnFormatter.makeFormatStringMap(
      showTimeZone,
      showTSeparator
    );
    return [...formatStringMap.keys()];
  }

  dhTimeZone: TimeZone;

  defaultDateTimeFormatString: string;

  showTimeZone: boolean;

  showTSeparator: boolean;

  formatStringMap: Map<string, string>;

  constructor({
    timeZone: timeZoneParam = '',
    showTimeZone = true,
    showTSeparator = false,
    defaultDateTimeFormatString = DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING,
  }: DateTimeColumnFormatterOptions = {}) {
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

  getEffectiveFormatString(baseFormatString: string): string {
    return this.formatStringMap.get(baseFormatString) || baseFormatString;
  }

  format(value: Date | DateWrapper, format?: TableColumnFormat): string {
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
