import { useEffect } from 'react';

/**
 * Listen for resize events on an element using ResizeObserver
 * @param element Element to listen for resizing on
 * @param onResize Callback triggered when the element resizes
 */
export function useResizeObserver(
  element: Element | null | undefined,
  onResize: ResizeObserverCallback
): void {
  useEffect(() => {
    if (element == null) {
      return;
    }

    const resizeObserverInstance = new window.ResizeObserver(onResize);
    resizeObserverInstance.observe(element);

    return () => {
      if (element != null) {
        resizeObserverInstance.unobserve(element);
      }
    };
  }, [element, onResize]);
}

export default useResizeObserver;
