import { DataType } from './TableUtils';
import { DateTimeColumnFormatter, DecimalColumnFormatter, IntegerColumnFormatter, TableColumnFormat, TableColumnFormatter } from './formatters';
declare type ColumnName = string;
export interface FormattingRule {
    columnType: string;
    columnName: string;
    format: TableColumnFormat;
}
export declare class Formatter {
    /**
     * Converts FormattingRule[] to Map
     * @param columnFormattingRules Array or column formatting rules
     * @returns Map of columnName-to-format Maps indexed by normalized dataType
     */
    static makeColumnFormatMap(columnFormattingRules: FormattingRule[]): Map<DataType, Map<ColumnName, TableColumnFormat>>;
    /**
     * Creates a column formatting rule
     * @param columnType Normalized data type
     * @param columnName Column name
     * @param format Format object
     */
    static makeColumnFormattingRule(columnType: DataType, columnName: string, format: TableColumnFormat): FormattingRule;
    /**
     * @param columnFormattingRules Optional array of column formatting rules
     * @param dateTimeOptions Optional object with DateTime configuration
     * @param decimalFormatOptions Optional object with Decimal configuration
     * @param integerFormatOptions Optional object with Integer configuration
     * @param truncateNumbersWithPound Determine if numbers should be truncated w/ repeating # instead of ellipsis at the end
     */
    constructor(columnFormattingRules?: FormattingRule[], dateTimeOptions?: ConstructorParameters<typeof DateTimeColumnFormatter>[0], decimalFormatOptions?: ConstructorParameters<typeof DecimalColumnFormatter>[0], integerFormatOptions?: ConstructorParameters<typeof IntegerColumnFormatter>[0], truncateNumbersWithPound?: boolean);
    defaultColumnFormatter: TableColumnFormatter;
    typeFormatterMap: Map<DataType, TableColumnFormatter>;
    columnFormatMap: Map<DataType, Map<string, TableColumnFormat>>;
    truncateNumbersWithPound: boolean;
    /**
     * Gets columnFormatMap indexed by name for a given column type, creates new Map entry if necessary
     * @param columnType column type
     * @param createIfNecessary create new entry if true
     * @returns Map of format strings indexed by column name or undefined if it doesn't exist
     */
    getColumnFormatMapForType(columnType: string, createIfNecessary?: boolean): Map<string, TableColumnFormat> | undefined;
    /**
     * Gets a column format object for a given column type and name
     * @param columnType column type
     * @param columnName column name
     * @returns format object or null for Default
     */
    getColumnFormat(columnType: string, columnName: string): TableColumnFormat | null;
    getColumnTypeFormatter(columnType: string): TableColumnFormatter;
    /**
     * Gets formatted string for a given value, column type and name
     * @param value Value to format
     * @param columnType Column type used to determine the formatting settings
     * @param columnName Column name used to determine the formatting settings
     * @param formatOverride Format object passed to the formatter in place of the format defined in columnFormatMap
     */
    getFormattedString(value: unknown, columnType: string, columnName?: string, formatOverride?: TableColumnFormat): string;
    /**
     * Gets the timeZone name
     * @returns The time zone name E.g. America/New_York
     */
    get timeZone(): string;
}
export default Formatter;
//# sourceMappingURL=Formatter.d.ts.map