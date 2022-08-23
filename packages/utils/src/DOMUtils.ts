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

export default { getClosestByClassName };
