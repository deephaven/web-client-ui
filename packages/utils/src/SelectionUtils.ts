export type SelectionT<T = string> = 'all' | Set<T>;

export interface SelectionMaybeInverted<TValue> {
  selection: SelectionT<TValue>;
  isInverted: boolean;
}
