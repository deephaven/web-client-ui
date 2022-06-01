import { TableColumnFormatter } from "./formatters/index.js";
export class FormatterUtils {
  static getColumnFormats(settings) {
    var {
      formatter
    } = settings;
    return formatter;
  }

  static getDateTimeFormatterOptions(settings) {
    var {
      timeZone,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator
    } = settings;
    return {
      timeZone,
      defaultDateTimeFormatString: defaultDateTimeFormat,
      showTimeZone,
      showTSeparator
    };
  }
  /**
   * Check if the formatter has a custom format defined for the column name and type
   * @param formatter Formatter to check
   * @param columnName Column name
   * @param columnType Column type
   * @returns True, if a custom format is defined
   */


  static isCustomColumnFormatDefined(formatter, columnName, columnType) {
    var columnFormat = formatter.getColumnFormat(columnType, columnName);
    return columnFormat != null && (columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_PRESET || columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM);
  }

}
export default FormatterUtils;
//# sourceMappingURL=FormatterUtils.js.map