import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  DateTimeColumnFormatterOptions,
  DecimalColumnFormatterOptions,
  Formatter,
  FormatterUtils,
  FormattingRule,
  IntegerColumnFormatterOptions,
} from '@deephaven/jsapi-utils';
import { bindAllMethods } from '@deephaven/utils';
import { useMemo } from 'react';
import { useFormatSettings } from './useFormatSettings';

export type UseFormatterResult = Pick<
  Formatter,
  | 'getColumnFormat'
  | 'getColumnFormatMapForType'
  | 'getColumnTypeFormatter'
  | 'getFormattedString'
  | 'timeZone'
>;

export interface FormatterOptions {
  columnRules?: FormattingRule[];
  dateTimeOptions?: DateTimeColumnFormatterOptions;
  decimalFormatOptions?: DecimalColumnFormatterOptions;
  integerFormatOptions?: IntegerColumnFormatterOptions;
  truncateNumbersWithPound?: boolean;
  showEmptyStrings?: boolean;
  showNullStrings?: boolean;
}

/**
 * Returns a subset of `Formatter` instance members based on the current
 * `FormatSettingsContext`. Methods are bound to a `Formatter` instance, so they
 * are safe to destructure. Static methods can still be accessed statically from
 * the `Formatter` class.
 * @param columnRules Column formatting rules to use, if not provided, will use
 * the rules from the `FormatSettingsContext`
 * @param dateTimeOptions DateTime formatting options to use, if not provided,
 * will use the options from the `FormatSettingsContext`
 * @param decimalFormatOptions Decimal formatting options to use, if not provided,
 * will use the options from the `FormatSettingsContext`
 * @param integerFormatOptions Integer formatting options to use, if not provided,
 * will use the options from the `FormatSettingsContext`
 * @param truncateNumbersWithPound Determine if numbers should be truncated w/
 * repeating # instead of ellipsis at the end
 * @param showEmptyStrings Determine if empty strings should be shown
 * @param showNullStrings Determine if null strings should be shown
 * @returns Formatter util functions + timeZone value
 */
export function useFormatter({
  columnRules: columnRulesOverrides,
  dateTimeOptions: dateTimeOptionsOverrides,
  decimalFormatOptions: decimalFormatOptionsOverrides,
  integerFormatOptions: integerFormatOptionsOverrides,
  truncateNumbersWithPound,
  showEmptyStrings,
  showNullStrings,
}: FormatterOptions = {}): UseFormatterResult {
  const dh = useApi();
  const formatSettings = useFormatSettings();

  const formatter = useMemo(() => {
    const columnRules =
      columnRulesOverrides ?? FormatterUtils.getColumnFormats(formatSettings);

    const dateTimeOptions =
      dateTimeOptionsOverrides ??
      FormatterUtils.getDateTimeFormatterOptions(formatSettings);

    const { defaultDecimalFormatOptions, defaultIntegerFormatOptions } =
      formatSettings;

    const instance = new Formatter(
      dh,
      columnRules,
      dateTimeOptions,
      decimalFormatOptionsOverrides ?? defaultDecimalFormatOptions,
      integerFormatOptionsOverrides ?? defaultIntegerFormatOptions,
      truncateNumbersWithPound,
      showEmptyStrings,
      showNullStrings
    );

    // Bind all methods so we can destructure them
    bindAllMethods(instance);

    return instance;
  }, [
    columnRulesOverrides,
    dateTimeOptionsOverrides,
    decimalFormatOptionsOverrides,
    dh,
    formatSettings,
    integerFormatOptionsOverrides,
    showEmptyStrings,
    showNullStrings,
    truncateNumbersWithPound,
  ]);

  const {
    getColumnFormat,
    getColumnFormatMapForType,
    getColumnTypeFormatter,
    getFormattedString,
  } = formatter;

  return {
    getColumnFormat,
    getColumnFormatMapForType,
    getColumnTypeFormatter,
    getFormattedString,
    timeZone: formatter.timeZone,
  };
}

export default useFormatter;
