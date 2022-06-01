import TableColumnFormatter, { TableColumnFormat } from './TableColumnFormatter';
export declare type DecimalColumnFormat = TableColumnFormat & {
    multiplier?: number;
};
export declare type DecimalColumnFormatterOptions = {
    defaultFormatString?: string;
};
export declare class DecimalColumnFormatter extends TableColumnFormatter<number> {
    /**
     * Validates format object
     * @param format Format object
     * @returns true for valid object
     */
    static isValid(format: TableColumnFormat): boolean;
    /**
     * Create a DecimalColumnFormat object with the parameters specified
     * @param label Label for the format
     * @param formatString Format string for the format
     * @param multiplier Optional multiplier for the formatter
     * @param type Type of format created
     * @returns DecimalColumnFormat object
     */
    static makeFormat(label: string, formatString: string, type?: import("./TableColumnFormatter").TableColumnFormatType, multiplier?: number): DecimalColumnFormat;
    /**
     * Convenient function to create a DecimalFormatObject with Preset type set
     * @param label Label for this format object
     * @param formatString Format string to use
     * @param multiplier Multiplier to use
     * @returns DecimalColumnFormat object
     */
    static makePresetFormat(label: string, formatString?: string, multiplier?: number): DecimalColumnFormat;
    /**
     * Convenient function to create a DecimalFormatObject with a default 'Custom Format' label and Custom type
     * @param formatString Format string to use
     * @param multiplier Multiplier to use
     * @returns DecimalColumnFormat object
     */
    static makeCustomFormat(formatString?: string, multiplier?: number): DecimalColumnFormat;
    static DEFAULT_FORMAT_STRING: string;
    static FORMAT_PERCENT: DecimalColumnFormat;
    static FORMAT_BASIS_POINTS: DecimalColumnFormat;
    static FORMAT_MILLIONS: DecimalColumnFormat;
    static FORMAT_ROUND: DecimalColumnFormat;
    static FORMAT_ROUND_TWO_DECIMALS: DecimalColumnFormat;
    static FORMAT_ROUND_FOUR_DECIMALS: DecimalColumnFormat;
    /**
     * Check if the given formats match
     * @param formatA format object to check
     * @param formatB format object to check
     * @returns True if the formats match
     */
    static isSameFormat(formatA?: DecimalColumnFormat, formatB?: DecimalColumnFormat): boolean;
    defaultFormatString: string;
    constructor({ defaultFormatString, }?: DecimalColumnFormatterOptions);
    /**
     * Format a value with the provided format object
     * @param valueParam Value to format
     * @param format Format object
     * @returns Formatted string
     */
    format(valueParam: number, format?: DecimalColumnFormat): string;
}
export default DecimalColumnFormatter;
//# sourceMappingURL=DecimalColumnFormatter.d.ts.map