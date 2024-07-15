import { MutableRefObject, Ref, RefCallback, useCallback } from 'react';

/**
 * Takes in multiple refs and then returns one ref that can be assigned to the component.
 * In turn all the refs passed in will be assigned when the ref returned is assigned.
 * @param refs The refs to assign
 */
function useMultiRef<T>(...refs: readonly Ref<T>[]): RefCallback<T> {
  return useCallback(newRef => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(newRef);
      } else if (ref != null) {
        // eslint-disable-next-line no-param-reassign
        (ref as MutableRefObject<T | null>).current = newRef;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}

export default useMultiRef;
