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
