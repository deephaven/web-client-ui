export declare class Operator {
    static readonly not = "not";
    static readonly and = "and";
    static readonly or = "or";
}
export declare type OperatorValue = typeof Operator[Exclude<keyof typeof Operator, 'prototype'>];
//# sourceMappingURL=Operator.d.ts.map