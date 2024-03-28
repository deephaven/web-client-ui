import { useApi } from '@deephaven/jsapi-bootstrap';
import { Formatter, FormatterUtils, Settings } from '@deephaven/jsapi-utils';
import { bindAllMethods } from '@deephaven/utils';
import { useMemo } from 'react';

export type UseFormatterResult = Pick<
  Formatter,
  | 'getColumnFormat'
  | 'getColumnFormatMapForType'
  | 'getColumnTypeFormatter'
  | 'getFormattedString'
  | 'timeZone'
>;

/**
 * Returns a subset of members of a `Formatter` instance. The `Formatter` will be
 * constructed based on the given options or fallback to the configuration found
 * in the current `FormatSettingsContext`. Members that are functions are bound
 * to the `Formatter` instance, so they are safe to destructure. Static methods
 * can still be accessed statically from the `Formatter` class.
 * @param settings Optional settings to use when constructing the `Formatter`
 */
export function useFormatter(settings?: Settings): UseFormatterResult {
  const dh = useApi();

  const formatter = useMemo(() => {
    const columnRules = FormatterUtils.getColumnFormats(settings);

    const dateTimeOptions =
      FormatterUtils.getDateTimeFormatterOptions(settings);

    const {
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      truncateNumbersWithPound,
      showEmptyStrings,
      showNullStrings,
    } = settings ?? {};

    const instance = new Formatter(
      dh,
      columnRules,
      dateTimeOptions,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      truncateNumbersWithPound,
      showEmptyStrings,
      showNullStrings
    );

    // Bind all methods so we can destructure them
    bindAllMethods(instance);

    return instance;
  }, [dh, settings]);

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
