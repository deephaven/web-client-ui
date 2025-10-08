/*
 * Branded type helpers. Allows creating "branded" types that satisfy a base type
 * but are distinct from other types that satisfy the same base type.
 *
 * e.g. These 2 types are still strings, but they are unique from each other:
 * declare const UserID: Brand<string, 'userId'>;
 * declare const RoleID: Brand<string, 'roleID'>;
 *
 * This protects against accidentally assigning one type to another.
 * const roleId: RoleID = '123';
 * const userId: UserID = roleId; // Compiler error
 */
// eslint-disable-next-line no-underscore-dangle
declare const __brand: unique symbol;
export type Brand<T extends string, TBase = string> = TBase & {
  readonly [__brand]: T;
};

/**
 * Util type to create a "subtype" of T. Useful for creating subsets of union
 * types.
 *
 * e.g.
 * declare type Direction = 'north' | 'south' | 'east' | 'west'
 *
 * // This works
 * type Down = Extends<Direction, 'south'> // 'south'
 *
 * // Compiler will complain
 * type NotDirection = Extends<Direction, 'blah'>
 */
export type Extends<T, U extends T> = U extends T ? U : never;

/**
 * Derives a union type where all constituents define 1 property of the original
 * type.
 *
 * e.g.
 * OnlyOneProp<{
 *   name: string;
 *   age: number;
 * }> // { name: string } | { age: number };
 */
export type OnlyOneProp<T> = {
  [P in keyof T]: { [ONEPROP in P]: T[ONEPROP] };
}[keyof T];

/**
 * Remove `Partial` wrapper from a type. Note that this is slightly different
 * than `Required` because it will preserve optional properties on the original
 * target type.
 */
export type UndoPartial<T> = T extends Partial<infer U> ? U : never;

/**
 * Util type to extract the value from an object.
 *
 * e.g. Given
 * declare const x: { a: 1; b: 2; c: 3 };
 *
 * The value type can be extracted like this:
 * type A = ValueOf<typeof x>; // 1 | 2 | 3
 *
 * Instead of the more verbose:
 * type A = typeof x[keyof typeof x]; // 1 | 2 | 3
 */
export type ValueOf<T> = T[keyof T];

/**
 * Removes the index signature from a type.
 * This can be useful if you want to Omit a key from a type,
 * but the type has an index signature. Otherwise, the index signature
 * is the only thing that remains after Omit.
 *
 * e.g.
 * type A = { a: string; b: number; [key: string]: string };
 * type B = Omit<A, 'a'>; // { [key: string]: string }
 * type C = Omit<RemoveIndexSignature<A>, 'a'>; // { b: number }
 *
 * B does not maintain that the 'b' property is present, but keeps just the index signature.
 * By removing the signature and then omitting, you still get the 'b' property.
 */
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};
