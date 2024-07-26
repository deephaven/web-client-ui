import type React from 'react';

/**
 * Merge multiple react refs into a single ref callback.
 * This can be used to merge callback and object refs into a single ref.
 * Merged callback refs will be called while object refs will have their current property set.
 * @param refs The refs to merge
 * @returns A ref callback that will set the value on all refs
 */
export function mergeRefs<T = unknown>(
  ...refs: Array<
    React.MutableRefObject<T> | React.LegacyRef<T> | null | undefined
  >
): React.RefCallback<T> {
  return value => {
    refs.forEach(ref => {
      if (ref != null) {
        if (typeof ref === 'function') {
          ref(value);
        } else {
          // React marks RefObject as readonly, but it's just to indicate React manages it
          // We can still write to its current value
          // eslint-disable-next-line no-param-reassign
          (ref as React.MutableRefObject<T | null>).current = value;
        }
      }
    });
  };
}

export default mergeRefs;
