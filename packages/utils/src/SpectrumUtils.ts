import type { SpectrumTextFieldProps } from '@adobe/react-spectrum';
import type { DOMRefValue } from '@react-types/shared';

export interface KeyedItem<T> {
  key: string;
  item?: T;
}

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
 * @param ref
 */
export function findSpectrumComboBoxScrollArea(
  ref: ReactSpectrumComponent | null
): HTMLElement | null {
  const maybeHTMLElement = ref?.UNSAFE_getDOMNode();
  const input = maybeHTMLElement?.querySelector('input');
  const popupId = input?.getAttribute('aria-controls');

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
