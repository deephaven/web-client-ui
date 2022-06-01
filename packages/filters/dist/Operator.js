function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

export class Operator {}

_defineProperty(Operator, "not", 'not');

_defineProperty(Operator, "and", 'and');

_defineProperty(Operator, "or", 'or');
//# sourceMappingURL=Operator.js.map