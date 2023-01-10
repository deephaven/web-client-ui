import { DbNameValidator, TimeUtils } from '@deephaven/utils';
import {
  DateTimeColumnFormatter,
  IntegerColumnFormatter,
  DecimalColumnFormatter,
  TableColumnFormat,
  TableUtils,
  Formatter,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import React, { ReactElement } from 'react';

const log = Log.module('FormattingSectionContent');

export type FormatOption = {
  defaultFormatString?: string;
};

export type FormatterItem = {
  columnType: string;
  columnName: string;
  format: Partial<TableColumnFormat>;
  id?: number;
  isNewRule?: boolean;
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
      return DateTimeColumnFormatter.isValid(format);
    case 'decimal':
      return DecimalColumnFormatter.isValid(format);
    case 'int':
      return IntegerColumnFormatter.isValid(format);
    default: {
      log.warn('Trying to validate format of unknown type');
      return true;
    }
  }
}

export function removeFormatRuleExtraProps(
  item: FormatterItem
): Omit<FormatterItem, 'id' | 'isNewRule'> {
  const { id, isNewRule, ...rest } = item;
  return rest;
}

export function isFormatRuleValidForSave(rule: FormatterItem): boolean {
  return (
    isValidColumnName(rule.columnName) &&
    isValidFormat(rule.columnType, rule.format)
  );
}

export function renderTimeZoneOptions(): JSX.Element[] {
  const options = TimeUtils.TIME_ZONES.map(timeZone => {
    const { label, value } = timeZone;
    return (
      <option value={value} key={value}>
        {label}
      </option>
    );
  });

  return options;
}

export function renderColumnTypeOptions(): ReactElement {
  const columnTypesArray = [
    { value: TableUtils.dataType.DATETIME, label: 'DateTime' },
    { value: TableUtils.dataType.DECIMAL, label: 'Decimal' },
    { value: TableUtils.dataType.INT, label: 'Integer' },
  ];

  const columnTypeOptions = columnTypesArray.map(item => (
    <option key={`key-columnType-${item.value}`} value={item.value}>
      {item.label}
    </option>
  ));

  return (
    <>
      <option key="key-columnType-placeholder" disabled value="">
        Select Type
      </option>
      {columnTypeOptions}
    </>
  );
}

export function renderDateTimeOptions(
  timestamp: Date,
  timeZone: string,
  showTimeZone: boolean,
  showTSeparator: boolean,
  isGlobalOptions: boolean,
  legacyGlobalFormat?: string
): ReactElement[] {
  const formatter = new Formatter([], {
    timeZone,
    showTimeZone,
    showTSeparator,
  });
  const formats = isGlobalOptions
    ? DateTimeColumnFormatter.getGlobalFormats(showTimeZone, showTSeparator)
    : DateTimeColumnFormatter.getFormats(showTimeZone, showTSeparator);

  if (legacyGlobalFormat != null && !formats.includes(legacyGlobalFormat)) {
    formats.unshift(legacyGlobalFormat);
  }

  return formats.map(formatString => {
    const format = DateTimeColumnFormatter.makeFormat(
      '',
      formatString,
      DateTimeColumnFormatter.TYPE_GLOBAL
    );
    return (
      <option value={formatString} key={formatString}>
        {formatter.getFormattedString(
          timestamp,
          TableUtils.dataType.DATETIME,
          '',
          format
        )}
      </option>
    );
  });
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
  renderTimeZoneOptions,
  renderColumnTypeOptions,
  renderDateTimeOptions,
};
