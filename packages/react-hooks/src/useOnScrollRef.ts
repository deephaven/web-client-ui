import { useCallback, useEffect, useRef } from 'react';
import { identityExtractHTMLElement } from '@deephaven/utils';

/**
 * Return a ref that can be used to subscribe to scroll events.
 * @param onScroll Scroll event handler
 * @param extractHTMLElement Optional extraction handler to get the HTML element
 * to subscribe to scroll events. If no extraction handler is given, the argument
 * passed to the callback will be subscribed to if it is an HTML element.
 */
export function useOnScrollRef<T>(
  onScroll: (event: Event) => void,
  extractHTMLElement: (
    ref: T | null
  ) => HTMLElement | null = identityExtractHTMLElement
): (element: T | null) => void {
  const cleanupRef = useRef<() => void>();

  // Cleanup on unmount
  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback(
    (ref: T | null) => {
      cleanupRef.current?.();

      const element = extractHTMLElement(ref);

      if (!element) {
        return;
      }

      element.addEventListener('scroll', onScroll);

      // Hold a reference to a function that can cleanup scroll event registration
      cleanupRef.current = () => {
        element.removeEventListener('scroll', onScroll);
        cleanupRef.current = undefined;
      };
    },
    [extractHTMLElement, onScroll]
  );
}

export default useOnScrollRef;
