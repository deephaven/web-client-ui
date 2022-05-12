import type { FormattingRule } from './Formatter';
import Formatter from './Formatter';
import { DateTimeColumnFormatter, TableColumnFormatter } from './formatters';

export class FormatterUtils {
  static getColumnFormats(settings: {
    formatter: FormattingRule[];
  }): FormattingRule[] {
    const { formatter } = settings;
    return formatter;
  }

  static getDateTimeFormatterOptions(settings: {
    timeZone: string;
    defaultDateTimeFormat: string;
    showTimeZone: boolean;
    showTSeparator: boolean;
  }): Required<ConstructorParameters<typeof DateTimeColumnFormatter>[0]> {
    const {
      timeZone,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
    } = settings;
    return {
      timeZone,
      defaultDateTimeFormatString: defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
    };
  }

  /**
   * Check if the formatter has a custom format defined for the column name and type
   * @param formatter Formatter to check
   * @param columnName Column name
   * @param columnType Column type
   * @returns True, if a custom format is defined
   */
  static isCustomColumnFormatDefined(
    formatter: Formatter,
    columnName: string,
    columnType: string
  ): boolean {
    const columnFormat = formatter.getColumnFormat(columnType, columnName);
    return (
      columnFormat != null &&
      (columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_PRESET ||
        columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM)
    );
  }
}

export default FormatterUtils;
