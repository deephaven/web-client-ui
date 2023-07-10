import { DbNameValidator } from '@deephaven/utils';
import {
  DateTimeColumnFormatter,
  IntegerColumnFormatter,
  DecimalColumnFormatter,
  TableColumnFormat,
  FormattingRule,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('SettingsUtils');

export type FormatOption = {
  defaultFormatString?: string;
};

export type ValidFormatterItem = FormattingRule & {
  id?: number;
  isNewRule?: boolean;
};

export type FormatterItem = Omit<ValidFormatterItem, 'format'> & {
  format: Partial<TableColumnFormat>;
};

function isFormatStringFormat(
  format: Partial<TableColumnFormat>
): format is Pick<TableColumnFormat, 'formatString'> {
  return (
    (format as Pick<TableColumnFormat, 'formatString'>).formatString != null
  );
}

export function focusFirstInputInContainer(
  container: HTMLElement | null
): void {
  const input: HTMLElement | null | undefined = container?.querySelector(
    'input, select, textarea'
  );
  if (input) {
    input.focus();
  }
}

export function isSameOptions(
  options1: FormatOption,
  options2: FormatOption
): boolean {
  return options1.defaultFormatString === options2.defaultFormatString;
}

export function isSameDecimalOptions(
  options1: FormatOption,
  options2: FormatOption
): boolean {
  return isSameOptions(options1, options2);
}

export function isSameIntegerOptions(
  options1: FormatOption,
  options2: FormatOption
): boolean {
  return isSameOptions(options1, options2);
}

export function isValidColumnName(name: string): boolean {
  return name !== '' && DbNameValidator.isValidColumnName(name);
}

export function isValidFormat(
  dh: DhType,
  columnType: string,
  format: Partial<TableColumnFormat>
): boolean {
  // Undefined or empty string formats are always invalid
  if (
    !columnType ||
    format.formatString == null ||
    !isFormatStringFormat(format)
  ) {
    return false;
  }
  switch (columnType) {
    case 'datetime':
      return DateTimeColumnFormatter.isValid(dh, format);
    case 'decimal':
      return DecimalColumnFormatter.isValid(dh, format);
    case 'int':
      return IntegerColumnFormatter.isValid(dh, format);
    default: {
      log.warn('Trying to validate format of unknown type');
      return true;
    }
  }
}

export function removeFormatRuleExtraProps(
  item: ValidFormatterItem
): FormattingRule {
  const { id, isNewRule, ...rest } = item;
  return rest;
}

export function isFormatRuleValidForSave(
  dh: DhType,
  rule: FormatterItem
): rule is ValidFormatterItem {
  return (
    isValidColumnName(rule.columnName) &&
    isValidFormat(dh, rule.columnType, rule.format)
  );
}

export default {
  focusFirstInputInContainer,
  isSameOptions,
  isSameDecimalOptions,
  isSameIntegerOptions,
  isValidColumnName,
  isValidFormat,
  removeFormatRuleExtraProps,
  isFormatRuleValidForSave,
};
