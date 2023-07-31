export class Operator {
  static readonly not = 'not';

  static readonly and = 'and';

  static readonly or = 'or';
}

export type OperatorValue = (typeof Operator)[Exclude<
  keyof typeof Operator,
  'prototype'
>];

export function assertOperatorValue(
  operator?: string
): asserts operator is OperatorValue {
  if (!(operator === 'not' || operator === 'and' || operator === 'or')) {
    throw new Error('operator is not a valid FilterOperatorValue');
  }
}
