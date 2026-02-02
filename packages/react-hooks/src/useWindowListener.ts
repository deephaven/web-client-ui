import { useMemo, useEffect } from 'react';

/**
 * Hook to add event listeners to the window object.
 * Automatically cleans up on unmount or when dependencies change.
 *
 * @param events Event or array of events to listen for
 * @param callback Event handler function
 * @param options Options to pass to addEventListener
 */
export function useWindowListener(
  events: string | readonly string[],
  callback: (e: Event) => void,
  options?: boolean | AddEventListenerOptions
): void {
  const eventsArray = useMemo(
    () => (typeof events === 'string' ? [events] : events),
    [events]
  );

  useEffect(() => {
    eventsArray.forEach(e => window.addEventListener(e, callback, options));
    return () =>
      eventsArray.forEach(e =>
        window.removeEventListener(e, callback, options)
      );
  }, [eventsArray, callback, options]);
}
