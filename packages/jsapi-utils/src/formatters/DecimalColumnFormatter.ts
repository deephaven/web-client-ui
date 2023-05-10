/* eslint class-methods-use-this: "off" */
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import TableColumnFormatter, {
  TableColumnFormat,
} from './TableColumnFormatter';

const log = Log.module('DecimalColumnFormatter');

export type DecimalColumnFormat = TableColumnFormat & {
  multiplier?: number | null;
};

export type DecimalColumnFormatterOptions = {
  // Default format string to use. Defaults to DecimalColumnFormatter.DEFAULT_FORMAT_STRING
  defaultFormatString?: string;
};

export class DecimalColumnFormatter extends TableColumnFormatter<number> {
  /**
   * Validates format object
   * @param dh JSAPI instance
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(
    dh: DhType,
    format: Pick<TableColumnFormat, 'formatString'>
  ): boolean {
    try {
      dh.i18n.NumberFormat.format(format.formatString, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create a DecimalColumnFormat object with the parameters specified
   * @param label Label for the format
   * @param formatString Format string for the format
   * @param multiplier Optional multiplier for the formatter
   * @param type Type of format created
   * @returns DecimalColumnFormat object
   */
  static makeFormat(
    label: string,
    formatString: string,
    type = TableColumnFormatter.TYPE_CONTEXT_PRESET,
    multiplier?: number
  ): DecimalColumnFormat {
    return {
      label,
      type,
      formatString,
      multiplier,
    };
  }

  /**
   * Convenient function to create a DecimalFormatObject with Preset type set
   * @param label Label for this format object
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns DecimalColumnFormat object
   */
  static makePresetFormat(
    label: string,
    formatString = '',
    multiplier?: number
  ): DecimalColumnFormat {
    return DecimalColumnFormatter.makeFormat(
      label,
      formatString,
      TableColumnFormatter.TYPE_CONTEXT_PRESET,
      multiplier
    );
  }

  /**
   * Convenient function to create a DecimalFormatObject with a default 'Custom Format' label and Custom type
   * @param formatString Format string to use
   * @param multiplier Multiplier to use
   * @returns DecimalColumnFormat object
   */
  static makeCustomFormat(
    formatString = '',
    multiplier?: number
  ): DecimalColumnFormat {
    return DecimalColumnFormatter.makeFormat(
      'Custom Format',
      formatString,
      TableColumnFormatter.TYPE_CONTEXT_CUSTOM,
      multiplier
    );
  }

  static DEFAULT_FORMAT_STRING = '###,##0.0000';

  static FORMAT_PERCENT = DecimalColumnFormatter.makePresetFormat(
    'Percent',
    '##0.00%'
  );

  static FORMAT_BASIS_POINTS = DecimalColumnFormatter.makePresetFormat(
    'Basis Points',
    '###,##0 bp',
    10000
  );

  static FORMAT_MILLIONS = DecimalColumnFormatter.makePresetFormat(
    'Millions',
    '###,##0.000 mm',
    0.000001
  );

  static FORMAT_SCIENTIFIC_NOTATION = DecimalColumnFormatter.makePresetFormat(
    'Scientific Notation',
    '0.0000E0'
  );

  static FORMAT_ROUND = DecimalColumnFormatter.makePresetFormat(
    'Round',
    '###,##0'
  );

  static FORMAT_ROUND_TWO_DECIMALS = DecimalColumnFormatter.makePresetFormat(
    '0.00',
    '###,##0.00'
  );

  static FORMAT_ROUND_FOUR_DECIMALS = DecimalColumnFormatter.makePresetFormat(
    '0.0000',
    '###,##0.0000'
  );

  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */
  static isSameFormat(
    formatA: DecimalColumnFormat | null,
    formatB: DecimalColumnFormat | null
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

  defaultFormatString: string;

  dh: DhType;

  constructor(
    dh: DhType,
    {
      defaultFormatString = DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
    }: DecimalColumnFormatterOptions = {}
  ) {
    super();

    this.dh = dh;
    this.defaultFormatString = defaultFormatString;
  }

  /**
   * Format a value with the provided format object
   * @param valueParam Value to format
   * @param format Format object
   * @returns Formatted string
   */
  format(
    valueParam: number,
    format: Partial<DecimalColumnFormat> = {}
  ): string {
    const formatString =
      format.formatString != null && format.formatString !== ''
        ? format.formatString
        : this.defaultFormatString;
    const value =
      format.multiplier != null && format.multiplier !== 0
        ? valueParam * format.multiplier
        : valueParam;
    try {
      return this.dh.i18n.NumberFormat.format(formatString, value);
    } catch (e) {
      log.error('Invalid format arguments');
    }
    return '';
  }
}

export default DecimalColumnFormatter;
