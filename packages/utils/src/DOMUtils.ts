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
 * Synchronize CSS animations with a given name to the given start time.
 * This works because, by default, all animations share the same timeline instance
 * with the document, aka. animation.timeline === document.timeline. The `startTime`
 * property determines the scheduled time in milliseconds relative to the timeline
 * that the animation should begin.
 * @param animationName Name of the CSS animation
 * @param startTime Start time in milliseconds relative to the animation timeline.
 * Default is 0.
 */
export function syncAnimationStartTime(
  animationName: string,
  startTime = 0
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
