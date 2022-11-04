/* eslint class-methods-use-this: "off" */
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableColumnFormatter, {
  TableColumnFormat,
} from './TableColumnFormatter';

const log = Log.module('IntegerColumnFormatter');

export type IntegerColumnFormat = TableColumnFormat & {
  multiplier?: number;
};

export type IntegerColumnFormatterOptions = {
  // Default format string to use. Defaults to IntegerColumnFormatter.DEFAULT_FORMAT_STRING
  defaultFormatString?: string;
};

/** Column formatter for integers/whole numbers */
export class IntegerColumnFormatter extends TableColumnFormatter<number> {
  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format: Pick<TableColumnFormat, 'formatString'>): boolean {
    try {
      dh.i18n.NumberFormat.format(format.formatString, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create an IntegerColumnFormat object with the parameters specified
   * @param label Label for the format
   * @param formatString Format string for the format
   * @param multiplier Optional multiplier for the formatter
   * @param type Type of format created
   * @returns IntegerColumnFormat object
   */
  static makeFormat(
    label: string,
    formatString: string,
    type = TableColumnFormatter.TYPE_CONTEXT_PRESET,
    multiplier?: number
  ): IntegerColumnFormat {
    return {
      label,
      type,
      formatString,
      multiplier,
    };
  }

  /**
   * Convenient function to create a IntegerFormatObject with Preset type set
   * @param label Label for this format object
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns IntegerColumnFormat object
   */
  static makePresetFormat(
    label: string,
    formatString = '',
    multiplier?: number
  ): IntegerColumnFormat {
    return IntegerColumnFormatter.makeFormat(
      label,
      formatString,
      TableColumnFormatter.TYPE_CONTEXT_PRESET,
      multiplier
    );
  }

  /**
   * Convenient function to create a IntegerFormatObject with a default 'Custom Format' label and Custom type
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns IntegerColumnFormat object
   */
  static makeCustomFormat(
    formatString = '',
    multiplier?: number
  ): IntegerColumnFormat {
    return IntegerColumnFormatter.makeFormat(
      'Custom Format',
      formatString,
      TableColumnFormatter.TYPE_CONTEXT_CUSTOM,
      multiplier
    );
  }

  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */
  static isSameFormat(
    formatA: IntegerColumnFormat | null,
    formatB: IntegerColumnFormat | null
  ): boolean {
    return (
      formatA === formatB ||
      (formatA != null &&
        formatB != null &&
        formatA.type === formatB.type &&
        formatA.formatString === formatB.formatString &&
        formatA.multiplier === formatB.multiplier)
    );
  }

  static DEFAULT_FORMAT_STRING = '###,##0';

  static FORMAT_MILLIONS = IntegerColumnFormatter.makePresetFormat(
    'Millions',
    '###,##0.000 mm',
    0.000001
  );

  static FORMAT_SCIENTIFIC_NOTATION = IntegerColumnFormatter.makePresetFormat(
    'Scientific Notation',
    '0.0000E0'
  );

  defaultFormatString: string;

  constructor({
    defaultFormatString = IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
  }: IntegerColumnFormatterOptions = {}) {
    super();

    this.defaultFormatString = defaultFormatString;
  }

  /**
   * Format a value with the provided format object
   * @param valueParam Value to format
   * @param format Format object
   * @returns Formatted string
   */
  format(valueParam: number, format?: Partial<IntegerColumnFormat>): string {
    const formatString =
      (format && format.formatString) || this.defaultFormatString;
    const value =
      format && format.multiplier !== undefined && format.multiplier !== 0
        ? valueParam * format.multiplier
        : valueParam;
    try {
      return dh.i18n.NumberFormat.format(formatString, value);
    } catch (e) {
      log.error('Invalid format arguments');
    }
    return '';
  }
}

export default IntegerColumnFormatter;
