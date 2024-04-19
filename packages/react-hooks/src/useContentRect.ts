import { identityExtractHTMLElement } from '@deephaven/utils';
import { useCallback, useMemo, useState } from 'react';
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
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const contentRect = useMemo(
    () => new DOMRect(x, y, width, height),
    [height, width, x, y]
  );

  const [el, setEl] = useState<HTMLElement | null>(null);

  // Callback ref maps the passed in refValue and passes to `setEl`
  const ref = useMappedRef(setEl, map);

  const handleResize = useCallback(
    ([firstEntry]: ResizeObserverEntry[]): void => {
      const rect = firstEntry?.contentRect ?? {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };

      setX(rect.x);
      setY(rect.y);
      setWidth(rect.width);
      setHeight(rect.height);
    },
    []
  );

  useResizeObserver(el, handleResize);

  return {
    ref,
    contentRect,
  };
}

export default useContentRect;
