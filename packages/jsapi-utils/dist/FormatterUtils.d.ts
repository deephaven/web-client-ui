import type { FormattingRule } from './Formatter';
import Formatter from './Formatter';
import { DateTimeColumnFormatter } from './formatters';
export declare class FormatterUtils {
    static getColumnFormats(settings: {
        formatter: FormattingRule[];
    }): FormattingRule[];
    static getDateTimeFormatterOptions(settings: {
        timeZone: string;
        defaultDateTimeFormat: string;
        showTimeZone: boolean;
        showTSeparator: boolean;
    }): Required<ConstructorParameters<typeof DateTimeColumnFormatter>[0]>;
    /**
     * Check if the formatter has a custom format defined for the column name and type
     * @param formatter Formatter to check
     * @param columnName Column name
     * @param columnType Column type
     * @returns True, if a custom format is defined
     */
    static isCustomColumnFormatDefined(formatter: Formatter, columnName: string, columnType: string): boolean;
}
export default FormatterUtils;
//# sourceMappingURL=FormatterUtils.d.ts.map