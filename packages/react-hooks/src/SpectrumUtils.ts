import type { SpectrumTextFieldProps } from '@adobe/react-spectrum';
import { KeyedItem } from '@deephaven/utils';
import type { DOMRefValue } from '@react-types/shared';

export type ReactSpectrumComponent<T extends HTMLElement = HTMLElement> =
  DOMRefValue<T>;

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

export async function defaultGetInitialScrollPosition<
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
    item => item.item?.key === selectedKey || item.key === selectedKey
  );

  if (i <= 0) {
    return 0;
  }

  return itemHeight * i + topOffset;
}

/**
 * Extract DOM node from React Spectrum component ref.
 * @param ref
 */
export function extractSpectrumHTMLElement(
  ref: ReactSpectrumComponent | null
): HTMLElement | null {
  return ref?.UNSAFE_getDOMNode() ?? null;
}

/**
 * Extract lastElementChild from DOM element for given React Spectrum component
 * ref.
 * @param ref
 */
export function extractSpectrumLastChildHTMLElement(
  ref: ReactSpectrumComponent | null
): HTMLElement | null {
  const maybeHTMLElement = ref?.UNSAFE_getDOMNode().lastElementChild;
  return identityExtractHTMLElement(maybeHTMLElement);
}

/**
 * Find the popover associated with a given Spectrum ComboBox ref.
 * @param ref The ref to the Spectrum ComboBox component
 */
export function findSpectrumComboBoxScrollArea(
  ref: ReactSpectrumComponent | null
): HTMLElement | null {
  return findSpectrumPopoverScrollArea(ref, 'input');
}

/**
 * Find the popover associated with a given Spectrum Picker ref.
 * @param ref The ref to the Spectrum Picker component
 */
export function findSpectrumPickerScrollArea(
  ref: ReactSpectrumComponent | null
): HTMLElement | null {
  return findSpectrumPopoverScrollArea(ref, 'button');
}

/**
 * Find the popover associated with a given Spectrum component ref.
 * @param ref The ref to the Spectrum component
 * @param triggerElementType The type of element that triggers the popover
 */
export function findSpectrumPopoverScrollArea<
  K extends keyof HTMLElementTagNameMap,
>(
  ref: ReactSpectrumComponent | null,
  triggerElementType: K
): HTMLElement | null {
  const maybeHTMLElement = ref?.UNSAFE_getDOMNode();
  const trigger = maybeHTMLElement?.querySelector(triggerElementType);
  const popupId = trigger?.getAttribute('aria-controls');

  const scrollArea = popupId == null ? null : document.getElementById(popupId);

  return scrollArea;
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
