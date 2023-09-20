/**
 * Find the first element that matches the given className
 * by testing the element itself and traversing up
 * through its ancestors in the DOM tree.
 *
 * @param element Starting element
 * @param className Class name without the '.'
 * @returns DOM element matching the given class or null if not found
 */

export function getClosestByClassName(
  element: Element | null,
  className: string
): Element | null {
  if (!element) {
    return null;
  }
  return element.closest(`.${className}`);
}

/**
 * Returns the given object if it is an HTMLElement. Otherwise returns null.
 * @param maybeHTMLElement
 */
export function identityExtractHTMLElement<T>(
  maybeHTMLElement: T
): HTMLElement | null {
  return maybeHTMLElement instanceof HTMLElement ? maybeHTMLElement : null;
}

/**
 * Synchronize CSS animations with a given name to the same start time.
 * @param animationName
 * @param startTime
 */
export function syncAnimationStartTime(
  animationName: string,
  startTime: number
): void {
  const animations = document
    .getAnimations()
    .filter(
      a => a instanceof CSSAnimation && a.animationName === animationName
    );

  animations.forEach(a => {
    // eslint-disable-next-line no-param-reassign
    a.startTime = startTime;
  });
}

export default {
  getClosestByClassName,
  identityExtractHTMLElement,
  syncAnimationStartTime,
};
