/**
 * Find the first element that matches the given className
 * by testing the element itself and traversing up
 * through its ancestors in the DOM tree.
 *
 * @param {Element} element Starting element
 * @param {string} className Class name without the '.'
 * @returns DOM element matching the given class or null if not found
 */

export function getClosestByClassName(element, className) {
  if (!element) {
    return null;
  }
  if (element.classList && element.classList.contains(className)) {
    return element;
  }
  return getClosestByClassName(element.parentNode, className);
}

export default { getClosestByClassName };
