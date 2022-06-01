function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/** Different filter conditions user can select */
export class Type {}

_defineProperty(Type, "eq", 'eq');

_defineProperty(Type, "eqIgnoreCase", 'eqIgnoreCase');

_defineProperty(Type, "notEq", 'notEq');

_defineProperty(Type, "notEqIgnoreCase", 'notEqIgnoreCase');

_defineProperty(Type, "greaterThan", 'greaterThan');

_defineProperty(Type, "greaterThanOrEqualTo", 'greaterThanOrEqualTo');

_defineProperty(Type, "lessThan", 'lessThan');

_defineProperty(Type, "lessThanOrEqualTo", 'lessThanOrEqualTo');

_defineProperty(Type, "in", 'in');

_defineProperty(Type, "inIgnoreCase", 'inIgnoreCase');

_defineProperty(Type, "notIn", 'notIn');

_defineProperty(Type, "notInIgnoreCase", 'notInIgnoreCase');

_defineProperty(Type, "isTrue", 'isTrue');

_defineProperty(Type, "isFalse", 'isFalse');

_defineProperty(Type, "isNull", 'isNull');

_defineProperty(Type, "invoke", 'invoke');

_defineProperty(Type, "contains", 'contains');

_defineProperty(Type, "notContains", 'notContains');

_defineProperty(Type, "startsWith", 'startsWith');

_defineProperty(Type, "endsWith", 'endsWith');

_defineProperty(Type, "containsAny", 'containsAny');
//# sourceMappingURL=Type.js.map