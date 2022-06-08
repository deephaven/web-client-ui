export class Operator {
  static readonly not = 'not';

  static readonly and = 'and';

  static readonly or = 'or';
}

export type OperatorValue = typeof Operator[Exclude<
  keyof typeof Operator,
  'prototype'
>];
