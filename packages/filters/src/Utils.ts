import { Type, TypeValue } from './Type';

export function getLabelForTextFilter(filterType: TypeValue): string {
  switch (filterType) {
    case Type.eq:
      return 'is exactly';
    case Type.eqIgnoreCase:
      return 'is exactly (ignore case)';
    case Type.notEq:
      return 'is not exactly';
    case Type.notEqIgnoreCase:
      return 'is not exactly (ignore case)';
    case Type.contains:
      return 'contains';
    case Type.notContains:
      return 'does not contain';
    case Type.startsWith:
      return 'starts with';
    case Type.endsWith:
      return 'ends with';
    default:
      throw new Error(`Unrecognized text filter type ${filterType}`);
  }
}

export function getLabelForNumberFilter(filterType: TypeValue): string {
  switch (filterType) {
    case Type.eq:
      return 'is equal to';
    case Type.notEq:
      return 'is not equal to';
    case Type.greaterThan:
      return 'greater than';
    case Type.greaterThanOrEqualTo:
      return 'greater than or equal to';
    case Type.lessThan:
      return 'less than';
    case Type.lessThanOrEqualTo:
      return 'less than or equal to';
    default:
      throw new Error(`Unrecognized number filter type ${filterType}`);
  }
}

export function getLabelForDateFilter(filterType: TypeValue): string {
  switch (filterType) {
    case Type.eq:
      return 'date is';
    case Type.notEq:
      return 'date is not';
    case Type.notEqIgnoreCase:
    case Type.greaterThan:
      return 'date is after';
    case Type.greaterThanOrEqualTo:
      return 'date is after or equal';
    case Type.lessThan:
      return 'date is before';
    case Type.lessThanOrEqualTo:
      return 'date is before or equal';
    default:
      throw new Error(`Unrecognized date filter type ${filterType}`);
  }
}

export function getLabelForBooleanFilter(filterType: TypeValue): string {
  switch (filterType) {
    case Type.isTrue:
      return 'Is True';
    case Type.isFalse:
      return 'Is False';
    case Type.isNull:
      return 'Is Null';
    default:
      throw new Error(`Unrecognized boolean filter type ${filterType}`);
  }
}
