import { HTMLAttributes, useCallback } from 'react';

/**
 * Returns a callback that sets attributes on elements based on given selectors.
 * @param attributes Attributes object containing prop name + values to set
 * @param selectors Optional `querySelector` param to target child elements. If
 * omitted, will target the rootEl
 */
export function useSetAttributesCallback<T extends HTMLElement>(
  attributes: HTMLAttributes<T>,
  selectors?: string
): (rootEl?: HTMLElement | null) => void {
  return useCallback(
    (rootEl?: HTMLElement | null) => {
      if (rootEl == null) {
        return;
      }

      const targets =
        selectors == null ? [rootEl] : rootEl.querySelectorAll(selectors);

      targets.forEach(target => {
        Object.entries(attributes).forEach(([prop, value]) => {
          target.setAttribute(prop, value);
        });
      });
    },
    [attributes, selectors]
  );
}

export default useSetAttributesCallback;
