import React, { useEffect, useRef } from 'react';

/**
 * Takes a ref from forwardRef and makes it safe to use.
 * Sometimes the ref may be undefined, but we want to use the ref internally for something like input focus
 *
 * @param ref The forwarded ref to use
 * @returns A React ref that is safe to use inside forwardRef
 */
export default function useForwardedRef<T>(
  ref: ((instance: T | null) => void) | React.MutableRefObject<T | null> | null
): React.MutableRefObject<T | null> {
  const innerRef = useRef<T | null>(null);
  useEffect(function getSafeRef() {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(innerRef.current);
    } else {
      // eslint-disable-next-line no-param-reassign
      ref.current = innerRef.current;
    }
  });

  return innerRef;
}
