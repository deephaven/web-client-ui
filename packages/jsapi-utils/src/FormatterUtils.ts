import type { dh as DhType } from '@deephaven/jsapi-types';
import type { FormattingRule } from './Formatter';
import Formatter from './Formatter';
import { DateTimeColumnFormatter, TableColumnFormatter } from './formatters';
import Settings, {
  ColumnFormatSettings,
  DateTimeFormatSettings,
} from './Settings';

/**
 * Instantiate a `Formatter` from the given settings.
 * @param dh The `dh` object
 * @param settings Optional settings to use
 * @returns A new `Formatter` instance
 */
export function createFormatterFromSettings(
  dh: typeof DhType,
  settings?: Settings
): Formatter {
  const columnRules = getColumnFormats(settings);
  const dateTimeOptions = getDateTimeFormatterOptions(settings);

  const {
    defaultDecimalFormatOptions,
    defaultIntegerFormatOptions,
    truncateNumbersWithPound,
    showEmptyStrings,
    showNullStrings,
    showExtraGroupColumn,
  } = settings ?? {};

  return new Formatter(
    dh,
    columnRules,
    dateTimeOptions,
    defaultDecimalFormatOptions,
    defaultIntegerFormatOptions,
    truncateNumbersWithPound,
    showEmptyStrings,
    showNullStrings,
    showExtraGroupColumn
  );
}

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
  if (formatter == null) {
    return false;
  }
  const columnFormat = formatter.getColumnFormat(columnType, columnName);
  return (
    columnFormat != null &&
    (columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_PRESET ||
      columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM)
  );
}

export default {
  createFormatterFromSettings,
  getColumnFormats,
  getDateTimeFormatterOptions,
  isCustomColumnFormatDefined,
};
