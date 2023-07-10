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
