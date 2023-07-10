import type { FormattingRule } from './Formatter';
import Formatter from './Formatter';
import { DateTimeColumnFormatter, TableColumnFormatter } from './formatters';
import { ColumnFormatSettings, DateTimeFormatSettings } from './Settings';

export function getColumnFormats(
  settings?: ColumnFormatSettings
): FormattingRule[] | undefined {
  if (settings && settings.formatter) {
    const { formatter } = settings;
    return formatter;
  }
  return undefined;
}

export function getDateTimeFormatterOptions(
  settings?: DateTimeFormatSettings | null
): ConstructorParameters<typeof DateTimeColumnFormatter>[1] {
  return {
    timeZone: settings?.timeZone,
    defaultDateTimeFormatString: settings?.defaultDateTimeFormat,
    showTimeZone: settings?.showTimeZone,
    showTSeparator: settings?.showTSeparator,
  };
}

/**
 * Check if the formatter has a custom format defined for the column name and type
 * @param formatter Formatter to check
 * @param columnName Column name
 * @param columnType Column type
 * @returns True, if a custom format is defined
 */
export function isCustomColumnFormatDefined(
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

export default {
  getColumnFormats,
  getDateTimeFormatterOptions,
  isCustomColumnFormatDefined,
};
