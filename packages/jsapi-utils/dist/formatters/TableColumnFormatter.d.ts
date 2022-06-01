/**
 * Default column data formatter. Just interpolates the value as a string and returns.
 * Extend this class and register with TableUtils to make use of it.
 */
export declare type TableColumnFormatType = 'type-global' | 'type-context-preset' | 'type-context-custom';
export declare type TableColumnFormat = {
    label: string;
    formatString: string;
    type: TableColumnFormatType;
};
export declare class TableColumnFormatter<T = unknown> {
    static TYPE_GLOBAL: TableColumnFormatType;
    static TYPE_CONTEXT_PRESET: TableColumnFormatType;
    static TYPE_CONTEXT_CUSTOM: TableColumnFormatType;
    /**
     * Validates format object
     * @param format Format object
     * @returns true for valid object
     */
    static isValid(format: TableColumnFormat): boolean;
    /**
     * Check if the given formats match
     * @param formatA format object to check
     * @param formatB format object to check
     * @returns True if the formats match
     */
    static isSameFormat(formatA?: TableColumnFormat, formatB?: TableColumnFormat): boolean;
    /**
     * Create and return a Format object
     * @param label The label of the format object
     * @param formatString Format string to use for the format
     * @param type The type of column to use for this format
     * @returns A format object
     */
    static makeFormat(label: string, formatString: string, type: TableColumnFormatType): TableColumnFormat;
    /**
     * @param value The value to format
     * @param format Optional format object with value transformation options
     * @returns String the formatted text string of the value passed in.
     */
    format(value: T, format?: TableColumnFormat): string;
}
export default TableColumnFormatter;
//# sourceMappingURL=TableColumnFormatter.d.ts.map