import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { DateUtils, TableUtils } from '@deephaven/jsapi-utils';
import {
  makeColumnFormatColumn,
  makeRowFormatColumn,
  makeTernaryFormatRule,
} from './ConditionalFormattingAPIUtils';
import { type ColumnName } from '../../CommonTypes';

const log = Log.module('ConditionalFormattingUtils');

export type ModelColumn = {
  name: string;
  type: string;
};

export type Condition =
  | NumberCondition
  | StringCondition
  | DateCondition
  | BooleanCondition
  | CharCondition;

export interface BaseFormatConfig {
  /**
   * The columns whose formatting is applied. When set, formatting is applied to
   * each column while the condition is evaluated against `leftHandValue`. When
   * absent, `leftHandValue` is used as both the condition column and the format
   * target.
   */
  formattedColumns: ModelColumn[];
  /**
   * The column whose value is evaluated as the left-hand side of the condition.
   */
  leftHandValue: ModelColumn;
  condition: Condition;
  /**
   * The right-hand side of the condition. May be a literal string value or a
   * column reference (`ModelColumn`).
   */
  rightHandValue?: string | ModelColumn;
  start?: string;
  end?: string;
  style: FormatStyleConfig;
}

export interface ConditionConfig {
  condition: Condition;
  rightHandValue?: string | ModelColumn;
  start?: string;
  end?: string;
}

export type ChangeCallback = (
  ruleConfig: BaseFormatConfig,
  isValid: boolean
) => void;

export enum FormatterType {
  CONDITIONAL = 'conditional',
  ROWS = 'rows',
}

export interface FormattingRule {
  type: FormatterType;
  config: BaseFormatConfig;
}

export enum NumberCondition {
  IS_EQUAL = 'is-equal',
  IS_NOT_EQUAL = 'is-not-equal',
  IS_BETWEEN = 'is-between',
  GREATER_THAN = 'greater-than',
  GREATER_THAN_OR_EQUAL = 'greater-than-or-equal',
  LESS_THAN = 'less-than',
  LESS_THAN_OR_EQUAL = 'less-than-or-equal',
  IS_NULL = 'is-null',
  IS_NOT_NULL = 'is-not-null',
}

export enum StringCondition {
  IS_EXACTLY = 'is-exactly',
  IS_NOT_EXACTLY = 'is-not-exactly',
  CONTAINS = 'contains',
  DOES_NOT_CONTAIN = 'does-not-contain',
  STARTS_WITH = 'starts-with',
  ENDS_WITH = 'ends-with',
  IS_NULL = 'is-null',
  IS_NOT_NULL = 'is-not-null',
}

export enum DateCondition {
  IS_EXACTLY = 'is-exactly',
  IS_NOT_EXACTLY = 'is-not-exactly',
  IS_BEFORE = 'is-before',
  IS_BEFORE_OR_EQUAL = 'is-before-or-equal',
  IS_AFTER = 'is-after',
  IS_AFTER_OR_EQUAL = 'is-after-or-equal',
  IS_NULL = 'is-null',
  IS_NOT_NULL = 'is-not-null',
}

export enum BooleanCondition {
  IS_TRUE = 'is-true',
  IS_FALSE = 'is-false',
  IS_EQUAL = 'is-equal',
  IS_NOT_EQUAL = 'is-not-equal',
  IS_NULL = 'is-null',
  IS_NOT_NULL = 'is-not-null',
}

export enum CharCondition {
  IS_EQUAL = 'is-equal',
  IS_NOT_EQUAL = 'is-not-equal',
  IS_NULL = 'is-null',
  IS_NOT_NULL = 'is-not-null',
}

export enum FormatStyleType {
  NO_FORMATTING = 'no-formatting',
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  WARN = 'warn',
  NEUTRAL = 'neutral',
  ACCENT_1 = 'accent-1',
  ACCENT_2 = 'accent-2',
  CUSTOM = 'custom',
}

export interface FormatStyleConfig {
  type: FormatStyleType;
  customConfig?: {
    color: string;
    background: string;
  };
}

export function getLabelForStyleType(option: FormatStyleType): string {
  switch (option) {
    case FormatStyleType.NO_FORMATTING:
      return 'No formatting';
    case FormatStyleType.POSITIVE:
      return 'Positive';
    case FormatStyleType.NEGATIVE:
      return 'Negative';
    case FormatStyleType.WARN:
      return 'Warn';
    case FormatStyleType.NEUTRAL:
      return 'Neutral';
    case FormatStyleType.ACCENT_1:
      return 'Accent 1';
    case FormatStyleType.ACCENT_2:
      return 'Accent 2';
    case FormatStyleType.CUSTOM:
      return 'Custom...';
  }
}

export function getBackgroundForStyleConfig(
  config: FormatStyleConfig
): string | undefined {
  const { type, customConfig } = config;
  switch (type) {
    case FormatStyleType.NO_FORMATTING:
      return undefined;
    case FormatStyleType.POSITIVE:
      return '#9fde6f';
    case FormatStyleType.NEGATIVE:
      return '#ff6087';
    case FormatStyleType.WARN:
      return '#f67f40';
    case FormatStyleType.NEUTRAL:
      return '#ffd95c';
    case FormatStyleType.ACCENT_1:
      return '#78dce8';
    case FormatStyleType.ACCENT_2:
      return '#ab9bf5';
    case FormatStyleType.CUSTOM:
      return customConfig?.background;
    default:
      return undefined;
  }
}

export function getColorForStyleConfig(
  config: FormatStyleConfig
): string | undefined {
  const { type, customConfig } = config;
  switch (type) {
    case FormatStyleType.NO_FORMATTING:
      return undefined;
    case FormatStyleType.POSITIVE:
      return '#526a3f';
    case FormatStyleType.NEGATIVE:
      return '#802f44';
    case FormatStyleType.WARN:
      return '#663318';
    case FormatStyleType.NEUTRAL:
      return '#63562b';
    case FormatStyleType.ACCENT_1:
      return '#3f6469';
    case FormatStyleType.ACCENT_2:
      return '#554d72';
    case FormatStyleType.CUSTOM:
      return customConfig?.color;
    default:
      return undefined;
  }
}

export function getStyleDBString(config: BaseFormatConfig): string | undefined {
  const color = getColorForStyleConfig(config.style);
  const bg = getBackgroundForStyleConfig(config.style);
  if (color === undefined || bg === undefined) {
    return undefined;
  }
  return `bgfg(\`${bg}\`, \`${color}\`)`;
}

/**
 * Formats a rightHandValue for use in a condition expression.
 * - If a ModelColumn: returns the column name as a bare identifier (no quoting)
 * - If a string: wraps it in the given quote character
 * - If undefined: returns undefined
 */
export function formatRHV(
  value: string | ModelColumn | undefined,
  quote: string
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'object') return value.name;
  return `${quote}${value}${quote}`;
}

/**
 * Formats a date rightHandValue for use in a condition expression.
 * - If a ModelColumn: returns the column name (no quoting or timezone processing)
 * - If a string: reformats the timezone and wraps in single quotes
 */
function formatDateRHV(
  dh: typeof DhType,
  value: string | ModelColumn | undefined
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'object') return value.name;
  const [dateTimeString, ...rest] = value.split(' ');
  const tzCode = rest.join(' ');
  const tz = dh.i18n.TimeZone.getTimeZone(tzCode);
  return `'${dateTimeString} ${tz.id}'`;
}

function getNumberConditionText(config: BaseFormatConfig): string {
  const { leftHandValue, rightHandValue, start, end } = config;
  return getTextForNumberCondition(
    leftHandValue.name,
    config.condition as NumberCondition,
    formatRHV(rightHandValue, ''),
    start,
    end
  );
}

function getStringConditionText(config: BaseFormatConfig): string {
  const { leftHandValue, rightHandValue } = config;
  const columnName = leftHandValue.name;
  const rhv = formatRHV(rightHandValue, '"');
  switch (config.condition as StringCondition) {
    case StringCondition.IS_EXACTLY:
      return `${columnName} == ${rhv}`;
    case StringCondition.IS_NOT_EXACTLY:
      return `${columnName} != ${rhv}`;
    case StringCondition.CONTAINS:
      return `${columnName} != null && ${columnName}.contains(${rhv})`;
    case StringCondition.DOES_NOT_CONTAIN:
      return `${columnName} != null && !${columnName}.contains(${rhv})`;
    case StringCondition.STARTS_WITH:
      return `${columnName} != null && ${columnName}.startsWith(${rhv})`;
    case StringCondition.ENDS_WITH:
      return `${columnName} != null && ${columnName}.endsWith(${rhv})`;
    case StringCondition.IS_NULL:
      return `${columnName} == null`;
    case StringCondition.IS_NOT_NULL:
      return `${columnName} != null`;
  }
}

function getDateConditionText(
  dh: typeof DhType,
  config: BaseFormatConfig
): string {
  const { leftHandValue, rightHandValue } = config;
  const columnName = leftHandValue.name;
  const rhv = formatDateRHV(dh, rightHandValue);
  switch (config.condition as DateCondition) {
    case DateCondition.IS_EXACTLY:
      return `${columnName} == ${rhv}`;
    case DateCondition.IS_NOT_EXACTLY:
      return `${columnName} != ${rhv}`;
    case DateCondition.IS_BEFORE:
      return `${columnName} < ${rhv}`;
    case DateCondition.IS_BEFORE_OR_EQUAL:
      return `${columnName} <= ${rhv}`;
    case DateCondition.IS_AFTER:
      return `${columnName} > ${rhv}`;
    case DateCondition.IS_AFTER_OR_EQUAL:
      return `${columnName} >= ${rhv}`;
    case DateCondition.IS_NULL:
      return `${columnName} == null`;
    case DateCondition.IS_NOT_NULL:
      return `${columnName} != null`;
  }
}

function getBooleanConditionText(config: BaseFormatConfig): string {
  const { leftHandValue, rightHandValue } = config;
  return getTextForBooleanCondition(
    leftHandValue.name,
    config.condition as BooleanCondition,
    rightHandValue
  );
}

function getCharConditionText(config: BaseFormatConfig): string {
  const { leftHandValue, rightHandValue } = config;
  const columnName = leftHandValue.name;
  const rhv = formatRHV(rightHandValue, "'");
  switch (config.condition as CharCondition) {
    case CharCondition.IS_EQUAL:
      return `${columnName} == ${rhv}`;
    case CharCondition.IS_NOT_EQUAL:
      return `${columnName} != ${rhv}`;
    case CharCondition.IS_NULL:
      return `isNull(${columnName})`;
    case CharCondition.IS_NOT_NULL:
      return `!isNull(${columnName})`;
  }
}

export function getConditionDBString(
  dh: typeof DhType,
  config: BaseFormatConfig
): string {
  const { leftHandValue } = config;

  if (TableUtils.isNumberType(leftHandValue.type)) {
    return getNumberConditionText(config);
  }
  if (TableUtils.isCharType(leftHandValue.type)) {
    return getCharConditionText(config);
  }
  if (TableUtils.isStringType(leftHandValue.type)) {
    return getStringConditionText(config);
  }
  if (TableUtils.isDateType(leftHandValue.type)) {
    return getDateConditionText(dh, config);
  }
  if (TableUtils.isBooleanType(leftHandValue.type)) {
    return getBooleanConditionText(config);
  }

  throw new Error('Invalid column type');
}

export function getLabelForNumberCondition(condition: NumberCondition): string {
  switch (condition) {
    case NumberCondition.IS_EQUAL:
      return 'is equal to';
    case NumberCondition.IS_NOT_EQUAL:
      return 'is not equal to';
    case NumberCondition.IS_BETWEEN:
      return 'is between';
    case NumberCondition.GREATER_THAN:
      return 'greater than';
    case NumberCondition.GREATER_THAN_OR_EQUAL:
      return 'greater than or equal to';
    case NumberCondition.LESS_THAN:
      return 'less than';
    case NumberCondition.LESS_THAN_OR_EQUAL:
      return 'less than or equal to';
    case NumberCondition.IS_NULL:
      return 'is null';
    case NumberCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getLabelForStringCondition(condition: StringCondition): string {
  switch (condition) {
    case StringCondition.IS_EXACTLY:
      return 'is exactly';
    case StringCondition.IS_NOT_EXACTLY:
      return 'is not exactly';
    case StringCondition.CONTAINS:
      return 'contains';
    case StringCondition.DOES_NOT_CONTAIN:
      return 'does not contain';
    case StringCondition.STARTS_WITH:
      return 'starts with';
    case StringCondition.ENDS_WITH:
      return 'ends with';
    case StringCondition.IS_NULL:
      return 'is null';
    case StringCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getLabelForDateCondition(condition: DateCondition): string {
  switch (condition) {
    case DateCondition.IS_EXACTLY:
      return 'is';
    case DateCondition.IS_NOT_EXACTLY:
      return 'is not';
    case DateCondition.IS_BEFORE:
      return 'is before';
    case DateCondition.IS_BEFORE_OR_EQUAL:
      return 'is before or equal';
    case DateCondition.IS_AFTER:
      return 'is after';
    case DateCondition.IS_AFTER_OR_EQUAL:
      return 'is after or equal';
    case DateCondition.IS_NULL:
      return 'is null';
    case DateCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getLabelForBooleanCondition(
  condition: BooleanCondition
): string {
  switch (condition) {
    case BooleanCondition.IS_TRUE:
      return 'is true';
    case BooleanCondition.IS_FALSE:
      return 'is false';
    case BooleanCondition.IS_EQUAL:
      return 'is equal to';
    case BooleanCondition.IS_NOT_EQUAL:
      return 'is not equal to';
    case BooleanCondition.IS_NULL:
      return 'is null';
    case BooleanCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getLabelForCharCondition(condition: CharCondition): string {
  switch (condition) {
    case CharCondition.IS_EQUAL:
      return 'is';
    case CharCondition.IS_NOT_EQUAL:
      return 'is not';
    case CharCondition.IS_NULL:
      return 'is null';
    case CharCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getDefaultConditionForType(columnType: string): Condition {
  if (TableUtils.isNumberType(columnType)) {
    return NumberCondition.IS_EQUAL;
  }
  if (TableUtils.isCharType(columnType)) {
    return CharCondition.IS_EQUAL;
  }
  if (TableUtils.isStringType(columnType)) {
    return StringCondition.IS_EXACTLY;
  }
  if (TableUtils.isDateType(columnType)) {
    return DateCondition.IS_EXACTLY;
  }
  if (TableUtils.isBooleanType(columnType)) {
    return BooleanCondition.IS_TRUE;
  }

  throw new Error('Invalid column type');
}

export function getDefaultValueForType(columnType: string): string | undefined {
  if (TableUtils.isStringType(columnType)) {
    return '';
  }
  return undefined;
}

export function getConditionConfig(config: BaseFormatConfig): ConditionConfig {
  const { condition, rightHandValue, start, end } = config;
  return { condition, rightHandValue, start, end };
}

export function getDefaultConditionConfigForType(
  type: string
): ConditionConfig {
  return {
    condition: getDefaultConditionForType(type),
    rightHandValue: getDefaultValueForType(type),
    start: undefined,
    end: undefined,
  };
}

export function getDefaultStyleConfig(): FormatStyleConfig {
  return {
    type: FormatStyleType.NO_FORMATTING,
  };
}

function getShortLabelForStringCondition(condition: StringCondition): string {
  switch (condition) {
    case StringCondition.IS_EXACTLY:
      return '==';
    case StringCondition.IS_NOT_EXACTLY:
      return '!=';
    case StringCondition.CONTAINS:
      return 'contains';
    case StringCondition.DOES_NOT_CONTAIN:
      return 'does not contain';
    case StringCondition.STARTS_WITH:
      return 'starts with';
    case StringCondition.ENDS_WITH:
      return 'ends with';
    case StringCondition.IS_NULL:
      return 'is null';
    case StringCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

function getShortLabelForDateCondition(condition: DateCondition): string {
  switch (condition) {
    case DateCondition.IS_EXACTLY:
      return '==';
    case DateCondition.IS_NOT_EXACTLY:
      return '!=';
    case DateCondition.IS_BEFORE:
      return '<';
    case DateCondition.IS_BEFORE_OR_EQUAL:
      return '<=';
    case DateCondition.IS_AFTER:
      return '>';
    case DateCondition.IS_AFTER_OR_EQUAL:
      return '>=';
    case DateCondition.IS_NULL:
      return 'is null';
    case DateCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

function getShortLabelForBooleanCondition(condition: BooleanCondition): string {
  switch (condition) {
    case BooleanCondition.IS_TRUE:
      return 'is true';
    case BooleanCondition.IS_FALSE:
      return 'is false';
    case BooleanCondition.IS_EQUAL:
      return '==';
    case BooleanCondition.IS_NOT_EQUAL:
      return '!=';
    case BooleanCondition.IS_NULL:
      return 'is null';
    case BooleanCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

function getShortLabelForCharCondition(condition: CharCondition): string {
  switch (condition) {
    case CharCondition.IS_EQUAL:
      return '==';
    case CharCondition.IS_NOT_EQUAL:
      return '!=';
    case CharCondition.IS_NULL:
      return 'is null';
    case CharCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getShortLabelForNumberCondition(
  condition: NumberCondition
): string {
  switch (condition) {
    case NumberCondition.IS_EQUAL:
      return '==';
    case NumberCondition.IS_NOT_EQUAL:
      return '!=';
    case NumberCondition.IS_BETWEEN:
      return '==';
    case NumberCondition.GREATER_THAN:
      return '>';
    case NumberCondition.GREATER_THAN_OR_EQUAL:
      return '>=';
    case NumberCondition.LESS_THAN:
      return '<';
    case NumberCondition.LESS_THAN_OR_EQUAL:
      return '<=';
    case NumberCondition.IS_NULL:
      return 'is null';
    case NumberCondition.IS_NOT_NULL:
      return 'is not null';
  }
}

export function getTextForNumberCondition(
  columnName: ColumnName,
  condition: NumberCondition,
  value: unknown,
  start: unknown,
  end: unknown
): string {
  switch (condition) {
    case NumberCondition.IS_EQUAL:
      return `${columnName} == ${value}`;
    case NumberCondition.IS_NOT_EQUAL:
      return `${columnName} != ${value}`;
    case NumberCondition.IS_BETWEEN:
      return `${columnName} > ${start} && ${columnName} < ${end}`;
    case NumberCondition.GREATER_THAN:
      return `${columnName} > ${value}`;
    case NumberCondition.GREATER_THAN_OR_EQUAL:
      return `${columnName} >= ${value}`;
    case NumberCondition.LESS_THAN:
      return `${columnName} < ${value}`;
    case NumberCondition.LESS_THAN_OR_EQUAL:
      return `${columnName} <= ${value}`;
    case NumberCondition.IS_NULL:
      return `${columnName} == null`;
    case NumberCondition.IS_NOT_NULL:
      return `${columnName} != null`;
  }
}

export function getTextForBooleanCondition(
  columnName: ColumnName,
  condition: BooleanCondition,
  rightHandValue?: string | ModelColumn
): string {
  switch (condition) {
    case BooleanCondition.IS_TRUE:
      return `${columnName} == true`;
    case BooleanCondition.IS_FALSE:
      return `${columnName} == false`;
    case BooleanCondition.IS_EQUAL:
      return `${columnName} == ${formatRHV(rightHandValue, '') ?? 'null'}`;
    case BooleanCondition.IS_NOT_EQUAL:
      return `${columnName} != ${formatRHV(rightHandValue, '') ?? 'null'}`;
    case BooleanCondition.IS_NULL:
      return `${columnName} == null`;
    case BooleanCondition.IS_NOT_NULL:
      return `${columnName} != null`;
  }
}

export function getShortLabelForConditionType(
  columnType: string,
  condition: Condition
): string {
  if (TableUtils.isNumberType(columnType)) {
    return getShortLabelForNumberCondition(condition as NumberCondition);
  }
  if (TableUtils.isCharType(columnType)) {
    return getShortLabelForCharCondition(condition as CharCondition);
  }
  if (TableUtils.isStringType(columnType)) {
    return getShortLabelForStringCondition(condition as StringCondition);
  }
  if (TableUtils.isDateType(columnType)) {
    return getShortLabelForDateCondition(condition as DateCondition);
  }
  if (TableUtils.isBooleanType(columnType)) {
    return getShortLabelForBooleanCondition(condition as BooleanCondition);
  }

  throw new Error('Invalid column type');
}

/**
 * Get format columns array for the given columns and formatting rules
 * @param columns Available columns
 * @param rules Formatting rules to build the format columns from
 * @returns Array of format columns
 */
export function getFormatColumns(
  dh: typeof DhType,
  columns: readonly DhType.Column[],
  rules: readonly FormattingRule[]
): DhType.CustomColumn[] {
  if (rules === undefined) {
    log.debug(`no rules passed.`);
    return [];
  }
  const result: DhType.CustomColumn[] = [];
  // There can be only one row format custom column
  // and multiple column format custom columns (one per column)
  let rowFormatConfig: [string, DhType.CustomColumn];
  const columnFormatConfigMap = new Map<
    string,
    [string, DhType.CustomColumn]
  >();
  rules.forEach(({ config, type: formatterType }) => {
    const { leftHandValue, formattedColumns } = config;
    const isColumnType = formatterType === FormatterType.CONDITIONAL;

    // Check both name and type because the type can change
    const conditionCol = columns.find(
      ({ name, type }) =>
        name === leftHandValue.name && type === leftHandValue.type
    );
    if (conditionCol === undefined) {
      log.debug(
        `Column ${leftHandValue.name}:${leftHandValue.type} not found. Ignoring format rule.`,
        config
      );
      return;
    }

    // For COLUMNS rules, format each column in formattedColumns.
    // When formattedColumns is absent or empty, fall back to the condition column
    // by using [null] to indicate that the condition column should be used as the format target.
    const targetColConfigs: (ModelColumn | null)[] =
      isColumnType && formattedColumns.length > 0 ? formattedColumns : [null];

    targetColConfigs.forEach(targetColConfig => {
      let formatTargetCol = conditionCol;
      if (isColumnType && targetColConfig !== null) {
        const found = columns.find(
          ({ name, type }) =>
            name === targetColConfig.name && type === targetColConfig.type
        );
        if (found === undefined) {
          log.debug(
            `Formatted column ${targetColConfig.name}:${targetColConfig.type} not found. Ignoring format rule.`,
            config
          );
          return;
        }
        formatTargetCol = found;
      }

      // Stack ternary format conditions by formatted column
      const [prevRule, prevFormatColumn] = (isColumnType
        ? columnFormatConfigMap.get(formatTargetCol.name)
        : rowFormatConfig) ?? ['null', undefined];
      const rule = makeTernaryFormatRule(dh, config, prevRule);
      if (rule === undefined) {
        log.debug(`Ignoring format rule.`, config);
        return;
      }
      // Replace existing formatColumn with the new stacked format
      const index =
        prevFormatColumn === undefined ? -1 : result.indexOf(prevFormatColumn);
      if (index > -1) {
        result.splice(index, 1);
      }
      const formatColumn = isColumnType
        ? makeColumnFormatColumn(formatTargetCol, rule)
        : makeRowFormatColumn(dh, rule);
      result.push(formatColumn);
      if (isColumnType) {
        columnFormatConfigMap.set(formatTargetCol.name, [rule, formatColumn]);
      } else {
        rowFormatConfig = [rule, formatColumn];
      }
    });
  });

  return result;
}

/**
 * Validate that a given date condition + value pair is valid.
 * @param condition
 * @param value
 */
export function isDateConditionValid(
  dh: typeof DhType,
  condition: DateCondition,
  value?: string
): boolean {
  switch (condition) {
    case DateCondition.IS_NULL:
    case DateCondition.IS_NOT_NULL:
      return true;

    default: {
      const [dateTimeString, ...rest] = (value ?? '').split(' ');
      // Reconstitute all tokens after the first ' ' in case the user included garbage data at the end
      // e.g. '2020-01-01 NY blah'
      const tzCode = rest.join(' ');

      try {
        DateUtils.parseDateTimeString(dateTimeString);
      } catch (e) {
        log.debug('Invalid datetime string', dateTimeString);
        return false;
      }

      try {
        dh.i18n.TimeZone.getTimeZone(tzCode);
      } catch (e) {
        log.debug('Invalid timezone string', tzCode);
        return false;
      }

      return true;
    }
  }
}

export function isSupportedColumn({ type }: ModelColumn): boolean {
  return (
    TableUtils.isNumberType(type) ||
    TableUtils.isCharType(type) ||
    TableUtils.isStringType(type) ||
    TableUtils.isDateType(type) ||
    TableUtils.isBooleanType(type)
  );
}
