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
export declare class DateUtils {
    static FULL_DATE_FORMAT: string;
    static months: string[];
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
    static makeDateWrapper(timeZone: string, year: number, month?: number, day?: number, hour?: number, minute?: number, second?: number, ns?: number): DateWrapper;
    /**
     * Takes the string the user entered and returns the next nanos value
     * @param nanoString The nano string to get the next one of
     * @returns The value of the next nanos
     */
    static getNextNanos(nanoString: string): number;
    /**
     * @param components The string components that were parsed from the original string
     * @param values The values that were parsed from the components
     * @param timeZone The time zone to parse the date in. E.g. America/New_York
     * @returns Returns the DateWrapper for the next date, or null if a full date was passed in
     */
    static getNextDate(components: DateParts<string>, values: DateParts<number>, timeZone: string): DateWrapper | null;
    /**
     * Get the JS month value for the provided string.
     * Matches digits or a month name (eg. '1', '01', 'jan', 'january' should all work)
     * @param monthString The string to parse to a JS month value
     * @returns number The JS month value, which starts at 0 for january, or NaN if nothing could be parsed
     */
    static parseMonth(monthString: string): number;
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
    static parseDateValues(yearString: string, monthString: string, dayString: string, hourString: string, minuteString: string, secondString: string, nanoString: string): DateParts<number> | null;
    /**
     * Parse out a date time string into it's string components.
     * Anything that is not captured in the string will be undefined.
     *
     * @param dateTimeString The date time string to parse
     * @returns Containing the date time components
     */
    static parseDateTimeString(dateTimeString: string): DateParts<string>;
    /**
     * Parses the date range provided from a string of text.
     * @param text The string to parse the date from. Can be a keyword like "today", or in the format "2018-08-04"
     * @param timeZone The time zone to parse this range in. E.g. America/New_York
     * @returns A tuple with the start and end value/null for that date range, or both null
     */
    static parseDateRange(text: string, timeZone: string): [DateWrapper, DateWrapper | null] | [null, null];
    /**
     * Gets the Js Date object from the provided DateWrapper.
     * In unit test, DateWrapper is just a number provided in millis, so handles that case.
     * @param dateWrapper The DateWrapper object, or time in millis
     */
    static getJsDate(dateWrapper: DateWrapper | number): Date;
}
export default DateUtils;
//# sourceMappingURL=DateUtils.d.ts.map