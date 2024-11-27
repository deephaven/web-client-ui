// eslint-disable-next-line no-restricted-imports
import type { SpectrumTextFieldProps } from '@adobe/react-spectrum';
import { type KeyedItem } from '@deephaven/utils';
import type { DOMRefValue } from '@react-types/shared';

/**
 * Creates validation props for a Spectrum field. If `isValid` is true, returns
 * empty props. If false, returns  { errorMessage, validationState: 'invalid' }
 * @param isValid Whether props represent valid state
 * @param errorMessage Error message in the case `isValid` is false
 */
export function createValidationProps(
  isValid: boolean,
  errorMessage: string
): Pick<SpectrumTextFieldProps, 'validationState' | 'errorMessage'> {
  if (isValid) {
    return {};
  }

  return {
    errorMessage,
    validationState: 'invalid',
  };
}

/**
 * Extract DOM node from React Spectrum component ref.
 * @param ref
 */
export function extractSpectrumHTMLElement<
  THtml extends HTMLElement = HTMLElement,
>(ref: DOMRefValue<THtml> | null): HTMLElement | null {
  return ref?.UNSAFE_getDOMNode() ?? null;
}

/**
 * Extract lastElementChild from DOM element for given React Spectrum component
 * ref.
 * @param ref
 */
export function extractSpectrumLastChildHTMLElement<
  THtml extends HTMLElement = HTMLElement,
>(ref: DOMRefValue<THtml> | null): HTMLElement | null {
  const maybeHTMLElement = ref?.UNSAFE_getDOMNode()?.lastElementChild;
  return identityExtractHTMLElement(maybeHTMLElement);
}

/**
 * Find the popover associated with a given Spectrum ComboBox ref.
 * @param ref The ref to the Spectrum ComboBox component
 */
export function findSpectrumComboBoxScrollArea<
  THtml extends HTMLElement = HTMLElement,
>(ref: DOMRefValue<THtml> | null): HTMLElement | null {
  return findSpectrumPopoverScrollArea(ref, 'input');
}

/**
 * Find the popover associated with a given Spectrum Picker ref.
 * @param ref The ref to the Spectrum Picker component
 */
export function findSpectrumPickerScrollArea<
  THtml extends HTMLElement = HTMLElement,
>(ref: DOMRefValue<THtml> | null): HTMLElement | null {
  return findSpectrumPopoverScrollArea(ref, 'button');
}

/**
 * Find the popover associated with a given Spectrum component ref.
 * @param ref The ref to the Spectrum component
 * @param triggerElementType The type of element that triggers the popover
 */
export function findSpectrumPopoverScrollArea<
  K extends keyof HTMLElementTagNameMap,
  THtml extends HTMLElement = HTMLElement,
>(ref: DOMRefValue<THtml> | null, triggerElementType: K): HTMLElement | null {
  const maybeHTMLElement = ref?.UNSAFE_getDOMNode();
  const trigger = maybeHTMLElement?.querySelector(triggerElementType);
  const popupId = trigger?.getAttribute('aria-controls');

  const scrollArea = popupId == null ? null : document.getElementById(popupId);

  return scrollArea;
}

/**
 * Get the position of a selected item in a list of keyed items. The position is
 * based on the index, item height, and top offset.
 * @param keyedItems The list of keyed items
 * @param itemHeight The height of each item
 * @param selectedKey The key of the selected item
 * @param topOffset The offset from the top of the list (e.g. if there is top
 * padding surrounding the entire list)
 */
export async function getPositionOfSelectedItem<
  TKey extends string | number | boolean | undefined,
>({
  keyedItems,
  itemHeight,
  selectedKey,
  topOffset,
}: {
  keyedItems: KeyedItem<{ key?: TKey }, TKey>[];
  itemHeight: number;
  selectedKey: TKey | null | undefined;
  topOffset: number;
}): Promise<number> {
  const i = keyedItems.findIndex(
    item => (item.item?.key ?? item.key) === selectedKey
  );

  if (i <= 0) {
    return topOffset;
  }

  return itemHeight * i + topOffset;
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
