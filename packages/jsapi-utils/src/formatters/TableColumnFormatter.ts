/* eslint class-methods-use-this: "off" */
/**
 * Default column data formatter. Just interpolates the value as a string and returns.
 * Extend this class and register with TableUtils to make use of it.
 */

export type TableColumnFormatType =
  | 'type-global'
  | 'type-context-preset'
  | 'type-context-custom';

export type TableColumnFormat = {
  label: string;
  formatString: string;
  type: TableColumnFormatType;
};

export class TableColumnFormatter<T = unknown> {
  static TYPE_GLOBAL: TableColumnFormatType = 'type-global';

  static TYPE_CONTEXT_PRESET: TableColumnFormatType = 'type-context-preset';

  static TYPE_CONTEXT_CUSTOM: TableColumnFormatType = 'type-context-custom';

  /**
   * Validates format object
   * @param format Format object
   * @returns true for valid object
   */
  static isValid(format: TableColumnFormat): boolean {
    return true;
  }

  /**
   * Check if the given formats match
   * @param formatA format object to check
   * @param formatB format object to check
   * @returns True if the formats match
   */
  static isSameFormat(
    formatA?: TableColumnFormat,
    formatB?: TableColumnFormat
  ): boolean {
    throw new Error('isSameFormat not implemented');
  }

  /**
   * Create and return a Format object
   * @param label The label of the format object
   * @param formatString Format string to use for the format
   * @param type The type of column to use for this format
   * @returns A format object
   */
  static makeFormat(
    label: string,
    formatString: string,
    type: TableColumnFormatType
  ): TableColumnFormat {
    return { label, formatString, type };
  }

  /**
   * @param value The value to format
   * @param format Optional format object with value transformation options
   * @returns String the formatted text string of the value passed in.
   */
  format(value: T, format?: Partial<TableColumnFormat>): string {
    return '';
  }
}

export default TableColumnFormatter;
