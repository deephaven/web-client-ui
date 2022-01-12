export class FilterOperator {
  static readonly not = 'not';

  static readonly and = 'and';

  static readonly or = 'or';
}

export type FilterOperatorValue = typeof FilterOperator[Exclude<
  keyof typeof FilterOperator,
  'prototype'
>];
