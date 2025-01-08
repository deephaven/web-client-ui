import {
  type LegacyRef,
  type MutableRefObject,
  type Ref,
  type RefCallback,
  useMemo,
} from 'react';

/**
 * Merge multiple react refs into a single ref callback.
 * This can be used to merge callback and object refs into a single ref.
 * Merged callback refs will be called while object refs will have their current property set.
 * @param refs The refs to merge
 * @returns A ref callback that will set the value on all refs
 */
export function mergeRefs<T = unknown>(
  ...refs: readonly (MutableRefObject<T> | LegacyRef<T> | null | undefined)[]
): RefCallback<T> {
  return newRef => {
    refs.forEach(ref => {
      if (ref != null) {
        if (typeof ref === 'function') {
          ref(newRef);
        } else {
          // React marks RefObject as readonly, but it's just to indicate React manages it
          // We can still write to its current value
          // eslint-disable-next-line no-param-reassign
          (ref as React.MutableRefObject<T | null>).current = newRef;
        }
      }
    });
  };
}

/**
 * Merges multiple refs into one ref that can be assigned to the component.
 * In turn all the refs passed in will be assigned when the ref returned is assigned.
 * @param refs Array of refs to assign
 */
export function useMergeRef<T>(...refs: readonly Ref<T>[]): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => mergeRefs(...refs), refs);
}
