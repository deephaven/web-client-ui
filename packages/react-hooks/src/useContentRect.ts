import { identityExtractHTMLElement } from '@deephaven/utils';
import { useCallback, useRef, useState } from 'react';
import useMappedRef from './useMappedRef';
import useResizeObserver from './useResizeObserver';

export interface UseContentRectResult<T> {
  contentRect: DOMRectReadOnly;
  ref: (refValue: T) => void;
}

/**
 * Returns a callback ref that will track the `contentRect` of a given refValue.
 * If the `contentRect` is undefined, it will be set to a new `DOMRect` with
 * zeros for all dimensions.
 * @param map Optional mapping function to extract an HTMLElement from the given
 * refValue
 * @returns Content rect and a ref callback
 */
export function useContentRect<T>(
  map: (ref: T) => HTMLElement | null = identityExtractHTMLElement
): UseContentRectResult<T> {
  const [contentRect, setContentRect] = useState<DOMRectReadOnly>(
    new DOMRect()
  );

  const handleResize = useCallback(
    ([firstEntry]: ResizeObserverEntry[]): void => {
      setContentRect(firstEntry?.contentRect ?? new DOMRect());
    },
    []
  );

  const observerRef = useRef<HTMLElement>(null);
  useResizeObserver(observerRef.current, handleResize);

  const ref = useMappedRef(observerRef, map);

  return {
    ref,
    contentRect,
  };
}

export default useContentRect;
