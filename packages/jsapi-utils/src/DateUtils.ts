import { dhType } from '@deephaven/jsapi-shim';
import type { DateWrapper } from '@deephaven/jsapi-shim';

interface DateParts<T> {
  year: T;
  month: T;
  date: T;
  hours: T;
  minutes: T;
  seconds: T;
  nanos: T;
}

export class DateUtils {
  static FULL_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSSSSSSSS';

  static months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  /**
   *
   * @param timeZone The time zone to parse this time in. E.g. America/New_York
   * @param year The year for the date
   * @param month The month, starting at 0
   * @param day The day, starting at 1
   * @param hour The hours
   * @param minute The minutes
   * @param second The seconds
   * @param ns The nanoseconds
   */
  static makeDateWrapper(
    dh: dhType,
    timeZone: string,
    year: number,
    month = 0,
    day = 1,
    hour = 0,
    minute = 0,
    second = 0,
    ns = 0
  ): DateWrapper {
    if (!timeZone) {
      throw new Error('No timezone provided');
    }
    const yearString = `${year}`.padStart(4, '0');
    const monthString = `${month + 1}`.padStart(2, '0');
    const dayString = `${day}`.padStart(2, '0');
    const hourString = `${hour}`.padStart(2, '0');
    const minuteString = `${minute}`.padStart(2, '0');
    const secondString = `${second}`.padStart(2, '0');
    const nanoString = `${ns}`.padStart(9, '0');

    const dateString = `${yearString}-${monthString}-${dayString} ${hourString}:${minuteString}:${secondString}.${nanoString}`;
    return dh.i18n.DateTimeFormat.parse(
      DateUtils.FULL_DATE_FORMAT,
      dateString,
      dh.i18n.TimeZone.getTimeZone(timeZone)
    );
  }

  /**
   * Takes the string the user entered and returns the next nanos value
   * @param nanoString The nano string to get the next one of
   * @returns The value of the next nanos
   */
  static getNextNanos(nanoString: string): number {
    const sigNanos = parseInt(nanoString, 10);
    // Get the zeroes needed for padding before adding one so we handle overflow properly.
    const zeros = '0'.repeat(9 - nanoString.length);
    const nextNanoString = `${sigNanos + 1}${zeros}`;
    return parseInt(nextNanoString, 10);
  }

  /**
   * @param components The string components that were parsed from the original string
   * @param values The values that were parsed from the components
   * @param timeZone The time zone to parse the date in. E.g. America/New_York
   * @returns Returns the DateWrapper for the next date, or null if a full date was passed in
   */
  static getNextDate(
    dh: dhType,
    components: DateParts<string>,
    values: DateParts<number>,
    timeZone: string
  ): DateWrapper | null {
    let { year, month, date, hours, minutes, seconds, nanos } = values;

    if (components.nanos != null) {
      if (components.nanos.length === 9) {
        // They want an exact match
        return null;
      }
      nanos = DateUtils.getNextNanos(components.nanos);
      if (nanos > 999999999) {
        // There's an overflow, add it to the seconds manually
        seconds += 1;
        nanos = 0;
      }
    } else if (components.seconds != null) {
      seconds += 1;
    } else if (components.minutes != null) {
      minutes += 1;
    } else if (components.hours != null) {
      hours += 1;
    } else if (components.date != null) {
      date += 1;
    } else if (components.month != null) {
      month += 1;
    } else {
      year += 1;
    }

    // Use the JS date to handle overflow rather than doing our own logic
    // Because handling leap years and stuff is a pain
    // Still need to add nanos after, and the overflow from that is already added to seconds above
    const jsDate = new Date(year, month, date, hours, minutes, seconds);
    return DateUtils.makeDateWrapper(
      dh,
      timeZone,
      jsDate.getFullYear(),
      jsDate.getMonth(),
      jsDate.getDate(),
      jsDate.getHours(),
      jsDate.getMinutes(),
      jsDate.getSeconds(),
      nanos
    );
  }

  /**
   * Get the JS month value for the provided string.
   * Matches digits or a month name (eg. '1', '01', 'jan', 'january' should all work)
   * @param monthString The string to parse to a JS month value
   * @returns number The JS month value, which starts at 0 for january, or NaN if nothing could be parsed
   */
  static parseMonth(monthString: string): number {
    const month = parseInt(monthString, 10);
    if (!Number.isNaN(month)) {
      if (month >= 1 && month <= 12) {
        return month - 1;
      }
      return NaN;
    }

    const cleanMonthString = monthString.trim().toLowerCase();
    if (cleanMonthString.length >= 3) {
      for (let i = 0; i < DateUtils.months.length; i += 1) {
        if (DateUtils.months[i].startsWith(cleanMonthString)) {
          return i;
        }
      }
    }

    return NaN;
  }

  /**
   * Parse a date object out of the provided string segments.
   * Also using `parseMonth` to get month names like Aug/August rather than
   * simply doing `parseInt`.
   * @param yearString The year part of the string
   * @param monthString The month part of the string
   * @param dayString The day part of the string
   * @param hourString The hour part of the string
   * @param minuteString The minute part of the string
   * @param secondString The second part of the string
   * @param nanoString The milli part of the string
   */
  static parseDateValues(
    yearString: string,
    monthString: string,
    dayString: string,
    hourString: string,
    minuteString: string,
    secondString: string,
    nanoString: string
  ): DateParts<number> | null {
    const year = parseInt(yearString, 10);
    const month = monthString != null ? this.parseMonth(monthString) : 0;
    const date = dayString != null ? parseInt(dayString, 10) : 1;
    const hours = hourString != null ? parseInt(hourString, 10) : 0;
    const minutes = minuteString != null ? parseInt(minuteString, 10) : 0;
    const seconds = secondString != null ? parseInt(secondString, 10) : 0;
    const nanos =
      nanoString != null ? parseInt(nanoString.padEnd(9, '0'), 10) : 0;
    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(date) ||
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      Number.isNaN(seconds) ||
      Number.isNaN(nanos)
    ) {
      return null;
    }

    return { year, month, date, hours, minutes, seconds, nanos };
  }

  /**
   * Parse out a date time string into it's string components.
   * Anything that is not captured in the string will be undefined.
   *
   * @param dateTimeString The date time string to parse
   * @returns Containing the date time components
   */
  static parseDateTimeString(dateTimeString: string): DateParts<string> {
    const regex = /\s*(\d{4})([-./]([\da-z]+))?([-./](\d{1,2}))?([tT\s](\d{2})([:](\d{2}))?([:](\d{2}))?([.](\d{1,9}))?)?(.*)/;
    const result = regex.exec(dateTimeString);
    if (result == null) {
      throw new Error(`Unexpected date string: ${dateTimeString}`);
    }

    const [
      ,
      year,
      ,
      month,
      ,
      date,
      ,
      hours,
      ,
      minutes,
      ,
      seconds,
      ,
      nanos,
      overflow,
    ] = result;
    if (overflow != null && overflow.length > 0) {
      throw new Error(
        `Unexpected characters after date string '${dateTimeString}': ${overflow}`
      );
    }

    return { year, month, date, hours, minutes, seconds, nanos };
  }

  /**
   * Parses the date range provided from a string of text.
   * @param text The string to parse the date from. Can be a keyword like "today", or in the format "2018-08-04"
   * @param timeZone The time zone to parse this range in. E.g. America/New_York
   * @returns A tuple with the start and end value/null for that date range, or both null
   */
  static parseDateRange(
    dh: dhType,
    text: string,
    timeZone: string
  ): [DateWrapper, DateWrapper | null] | [null, null] {
    const cleanText = text.trim().toLowerCase();
    if (cleanText.length === 0) {
      throw new Error('Cannot parse date range from empty string');
    }

    if (cleanText === 'null') {
      return [null, null];
    }

    if (cleanText === 'today') {
      const now = new Date(Date.now());
      const startDate = DateUtils.makeDateWrapper(
        dh,
        timeZone,
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endDate = DateUtils.makeDateWrapper(
        dh,
        timeZone,
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      return [startDate, endDate];
    }

    if (cleanText === 'yesterday') {
      const now = new Date(Date.now());
      const startDate = DateUtils.makeDateWrapper(
        dh,
        timeZone,
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );
      const endDate = DateUtils.makeDateWrapper(
        dh,
        timeZone,
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      return [startDate, endDate];
    }

    if (cleanText === 'now') {
      const now = new Date(Date.now());
      const date = dh.DateWrapper.ofJsDate(now);
      return [date, null];
    }

    const components = DateUtils.parseDateTimeString(cleanText);
    if (
      components.year == null &&
      components.month == null &&
      components.date == null
    ) {
      throw new Error(`Unable to extract year, month, or day ${cleanText}`);
    }

    const values = DateUtils.parseDateValues(
      components.year,
      components.month,
      components.date,
      components.hours,
      components.minutes,
      components.seconds,
      components.nanos
    );

    if (values == null) {
      throw new Error(`Unable to extract date values from ${components}`);
    }

    const startDate = DateUtils.makeDateWrapper(
      dh,
      timeZone,
      values.year,
      values.month,
      values.date,
      values.hours,
      values.minutes,
      values.seconds,
      values.nanos
    );

    const endDate = DateUtils.getNextDate(dh, components, values, timeZone);
    return [startDate, endDate];
  }

  /**
   * Gets the Js Date object from the provided DateWrapper.
   * In unit test, DateWrapper is just a number provided in millis, so handles that case.
   * @param dateWrapper The DateWrapper object, or time in millis
   */
  static getJsDate(dateWrapper: DateWrapper | number): Date {
    if (typeof dateWrapper === 'number') {
      return new Date(dateWrapper);
    }
    return dateWrapper.asDate();
  }
}

export default DateUtils;
