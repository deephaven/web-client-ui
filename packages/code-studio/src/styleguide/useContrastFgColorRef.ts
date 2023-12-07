import { useLayoutEffect, useRef } from 'react';
import { contrastColor } from './colorUtils';

/**
 * Ref that will set the foreground color of an element to contrast with its
 * background color.
 */
export function useContrastFgColorRef<
  T extends HTMLElement,
>(): React.RefObject<T> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (ref.current == null) {
      return;
    }

    const computedStyle = getComputedStyle(ref.current);

    const { backgroundColor } = computedStyle;

    ref.current.style.color = contrastColor(backgroundColor);
  }, []);

  return ref;
}

export default useContrastFgColorRef;
