/** Different filter conditions user can select */
export class Type {
  static readonly eq = 'eq';

  static readonly eqIgnoreCase = 'eqIgnoreCase';

  static readonly notEq = 'notEq';

  static readonly notEqIgnoreCase = 'notEqIgnoreCase';

  static readonly greaterThan = 'greaterThan';

  static readonly greaterThanOrEqualTo = 'greaterThanOrEqualTo';

  static readonly lessThan = 'lessThan';

  static readonly lessThanOrEqualTo = 'lessThanOrEqualTo';

  static readonly in = 'in';

  static readonly inIgnoreCase = 'inIgnoreCase';

  static readonly notIn = 'notIn';

  static readonly notInIgnoreCase = 'notInIgnoreCase';

  static readonly isTrue = 'isTrue';

  static readonly isFalse = 'isFalse';

  static readonly isNull = 'isNull';

  static readonly invoke = 'invoke';

  static readonly contains = 'contains';

  static readonly notContains = 'notContains';

  static readonly containsIgnoreCase = 'containsIgnoreCase';

  static readonly startsWith = 'startsWith';

  static readonly endsWith = 'endsWith';

  static readonly containsAny = 'containsAny';
}

export type TypeValue = typeof Type[Exclude<keyof typeof Type, 'prototype'>];
