import { DateWrapper, TimeZone } from '@deephaven/jsapi-shim';
import TableColumnFormatter, { TableColumnFormat } from './TableColumnFormatter';
export declare type DateTimeColumnFormatterOptions = {
    timeZone?: string;
    showTimeZone?: boolean;
    showTSeparator?: boolean;
    defaultDateTimeFormatString?: string;
};
export declare class DateTimeColumnFormatter extends TableColumnFormatter<Date | DateWrapper | number> {
    /**
     * Validates format object
     * @param format Format object
     * @returns true for valid object
     */
    static isValid(format: TableColumnFormat): boolean;
    static makeFormat(label: string, formatString: string, type?: import("./TableColumnFormatter").TableColumnFormatType): TableColumnFormat;
    /**
     * Check if the given formats match
     * @param formatA format object to check
     * @param formatB format object to check
     * @returns True if the formats match
     */
    static isSameFormat(formatA?: TableColumnFormat, formatB?: TableColumnFormat): boolean;
    static DEFAULT_DATETIME_FORMAT_STRING: string;
    static DEFAULT_TIME_ZONE_ID: string;
    static makeGlobalFormatStringMap(showTimeZone: boolean, showTSeparator: boolean): Map<string, string>;
    static getGlobalFormats(showTimeZone: boolean, showTSeparator: boolean): string[];
    static makeFormatStringMap(showTimeZone?: boolean, showTSeparator?: boolean): Map<string, string>;
    static getFormats(showTimeZone?: boolean, showTSeparator?: boolean): string[];
    dhTimeZone: TimeZone;
    defaultDateTimeFormatString: string;
    showTimeZone: boolean;
    showTSeparator: boolean;
    formatStringMap: Map<string, string>;
    constructor({ timeZone: timeZoneParam, showTimeZone, showTSeparator, defaultDateTimeFormatString, }?: DateTimeColumnFormatterOptions);
    getEffectiveFormatString(baseFormatString: string): string;
    format(value: Date | DateWrapper | number, format?: TableColumnFormat): string;
}
export default DateTimeColumnFormatter;
//# sourceMappingURL=DateTimeColumnFormatter.d.ts.map