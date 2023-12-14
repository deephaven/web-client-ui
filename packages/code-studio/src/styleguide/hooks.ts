import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/**
 * Extract a --dh-color-xxxx variable from the pseudo content of an element.
 * @param elementRef Ref to the element to extract the color from.
 * @param pseudoElement The pseudo element to extract the color from.
 */
export function useDhColorFromPseudoContent(
  elementRef: React.RefObject<HTMLElement | null>,
  pseudoElement: ':before' | ':after'
): string | undefined {
  const [color, setColor] = useState<string>();

  useEffect(() => {
    if (elementRef.current == null) {
      return;
    }

    const computedStyle = getComputedStyle(
      elementRef.current,
      pseudoElement
    ).getPropertyValue('content');

    // Extract the var name from the content (e.g. '--dh-color-gray-900')
    const dhColorVarName = /"(--dh-color-.*?)[,"]/.exec(computedStyle)?.[1];
    if (dhColorVarName == null) {
      return;
    }

    setColor(dhColorVarName);
  }, [elementRef, pseudoElement]);

  return color;
}
