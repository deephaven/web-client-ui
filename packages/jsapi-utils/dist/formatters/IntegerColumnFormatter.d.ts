import TableColumnFormatter, { TableColumnFormat } from './TableColumnFormatter';
export declare type IntegerColumnFormat = TableColumnFormat & {
    multiplier?: number;
};
export declare type IntegerColumnFormatterOptions = {
    defaultFormatString?: string;
};
/** Column formatter for integers/whole numbers */
export declare class IntegerColumnFormatter extends TableColumnFormatter<number> {
    /**
     * Validates format object
     * @param format Format object
     * @returns true for valid object
     */
    static isValid(format: IntegerColumnFormat): boolean;
    /**
     * Create an IntegerColumnFormat object with the parameters specified
     * @param label Label for the format
     * @param formatString Format string for the format
     * @param multiplier Optional multiplier for the formatter
     * @param type Type of format created
     * @returns IntegerColumnFormat object
     */
    static makeFormat(label: string, formatString: string, type?: import("./TableColumnFormatter").TableColumnFormatType, multiplier?: number): IntegerColumnFormat;
    /**
     * Convenient function to create a IntegerFormatObject with Preset type set
     * @param label Label for this format object
     * @param formatString Format string to use
     * @param multiplier Multiplier to use
     * @returns IntegerColumnFormat object
     */
    static makePresetFormat(label: string, formatString?: string, multiplier?: number): IntegerColumnFormat;
    /**
     * Convenient function to create a IntegerFormatObject with a default 'Custom Format' label and Custom type
     * @param formatString Format string to use
     * @param multiplier Multiplier to use
     * @returns IntegerColumnFormat object
     */
    static makeCustomFormat(formatString?: string, multiplier?: number): IntegerColumnFormat;
    /**
     * Check if the given formats match
     * @param formatA format object to check
     * @param formatB format object to check
     * @returns True if the formats match
     */
    static isSameFormat(formatA?: IntegerColumnFormat, formatB?: IntegerColumnFormat): boolean;
    static DEFAULT_FORMAT_STRING: string;
    static FORMAT_MILLIONS: IntegerColumnFormat;
    defaultFormatString: string;
    constructor({ defaultFormatString, }?: IntegerColumnFormatterOptions);
    /**
     * Format a value with the provided format object
     * @param valueParam Value to format
     * @param format Format object
     * @returns Formatted string
     */
    format(valueParam: number, format?: IntegerColumnFormat): string;
}
export default IntegerColumnFormatter;
//# sourceMappingURL=IntegerColumnFormatter.d.ts.map