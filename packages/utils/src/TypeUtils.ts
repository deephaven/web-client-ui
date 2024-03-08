import type { Component, FunctionComponent } from 'react';

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
 * Extracts the props type from a React component type.
 */
export type InferComponentProps<T> = T extends FunctionComponent<infer P>
  ? P
  : T extends Component<infer P>
  ? P
  : never;

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
 * Tuple type.
 * @param T Type of the items in the tuple
 * @param N Length of the tuple
 */
export type Tuple<T, N extends number> = N extends 0
  ? []
  : N extends 1
  ? [T]
  : N extends 2
  ? [T, T]
  : N extends 3
  ? [T, T, T]
  : N extends 4
  ? [T, T, T, T]
  : N extends 5
  ? [T, T, T, T, T]
  : N extends 6
  ? [T, T, T, T, T, T]
  : N extends 7
  ? [T, T, T, T, T, T, T]
  : N extends 8
  ? [T, T, T, T, T, T, T, T]
  : N extends 9
  ? [T, T, T, T, T, T, T, T, T]
  : N extends 10
  ? [T, T, T, T, T, T, T, T, T, T]
  : Array<T>;

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
