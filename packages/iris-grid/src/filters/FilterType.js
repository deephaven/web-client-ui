/** Different filter conditions user can select */
class FilterType {
  static eq = 'eq';

  static eqIgnoreCase = 'eqIgnoreCase';

  static notEq = 'notEq';

  static notEqIgnoreCase = 'notEqIgnoreCase';

  static greaterThan = 'greaterThan';

  static greaterThanOrEqualTo = 'greaterThanOrEqualTo';

  static lessThan = 'lessThan';

  static lessThanOrEqualTo = 'lessThanOrEqualTo';

  static in = 'in';

  static inIgnoreCase = 'inIgnoreCase';

  static notIn = 'notIn';

  static notInIgnoreCase = 'notInIgnoreCase';

  static isTrue = 'isTrue';

  static isFalse = 'isFalse';

  static isNull = 'isNull';

  static invoke = 'invoke';

  static contains = 'contains';

  static notContains = 'notContains';

  static startsWith = 'startsWith';

  static endsWith = 'endsWith';

  static containsAny = 'containsAny';
}

export default FilterType;
