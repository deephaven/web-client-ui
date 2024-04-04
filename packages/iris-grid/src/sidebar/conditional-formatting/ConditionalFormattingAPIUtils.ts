import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  BaseFormatConfig,
  getConditionDBString,
  getStyleDBString,
} from './ConditionalFormattingUtils';

// Conditional formatting API utils in a separate file
// to make ConditionalFormattingUtils.ts easier to test.
// https://github.com/facebook/jest/issues/936#issuecomment-545080082

export function makeTernaryFormatRule(
  config: BaseFormatConfig,
  prevRule: string
): string | undefined {
  const styleDBString = getStyleDBString(config);
  if (styleDBString === undefined) {
    return undefined;
  }
  const conditionDBString = getConditionDBString(config);
  return `${conditionDBString} ? ${styleDBString} : ${prevRule}`;
}

export function makeRowFormatColumn(
  dh: typeof DhType,
  rule: string
): DhType.CustomColumn {
  return dh.Column.formatRowColor(rule);
}

export function makeColumnFormatColumn(
  col: DhType.Column,
  rule: string
): DhType.CustomColumn {
  return col.formatColor(rule);
}
