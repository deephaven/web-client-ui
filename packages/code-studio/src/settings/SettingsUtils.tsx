import { DbNameValidator } from '@deephaven/utils';
import {
  DateTimeColumnFormatter,
  IntegerColumnFormatter,
  DecimalColumnFormatter,
  type TableColumnFormat,
  type FormattingRule,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import type { ServerConfigValues } from '@deephaven/redux';
import Bowser from 'bowser';
import { type PluginModuleMap } from '@deephaven/plugin';

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

/**
 * Get an object containing all version information formatted for display
 * @param serverConfigValues The server config values
 * @returns The formatted version info or "Unknown" for any value not available
 */
export function getFormattedVersionInfo(
  serverConfigValues: ServerConfigValues
): Record<string, string> {
  const ua = Bowser.parse(window.navigator.userAgent);
  const browser = `${ua.browser.name ?? ''} ${
    // use only the major version and minor version, rest is usually empty 120.1.0.0 -> 120.1
    Number(parseFloat(ua.browser.version ?? '')) || ''
  }`;
  const os = `${ua.os.name ?? ''} ${ua.os.version ?? ''}`;
  const pythonVersion = serverConfigValues.get('python.version') ?? '';
  return {
    'Engine Version': serverConfigValues.get('deephaven.version') ?? 'Unknown',
    'Web UI Version': import.meta.env.npm_package_version ?? 'Unknown',
    // Python version is only available in python sessions
    ...(pythonVersion !== '' ? { 'Python Version': pythonVersion } : {}),
    'Java Version': serverConfigValues.get('java.version') ?? 'Unknown',
    'Groovy Version': serverConfigValues.get('groovy.version') ?? 'Unknown',
    'Barrage Version': serverConfigValues.get('barrage.version') ?? 'Unknown',
    'Browser Name': browser.trim() || 'Unknown',
    'User Agent OS': os.trim() || 'Unknown',
  };
}

/**
 * Get an object containing all JS plugin information formatted for display
 * @param serverConfigValues The information for all plugins
 * @returns The formatted mapping from plugin name to version
 */
export function getFormattedPluginInfo(
  pluginDataValues: PluginModuleMap
): Record<string, string> {
  return Array.from(pluginDataValues.entries())
    .filter(plugin => plugin[1].version !== undefined)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value.version }), {});
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
  dh: typeof DhType,
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
  dh: typeof DhType,
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
