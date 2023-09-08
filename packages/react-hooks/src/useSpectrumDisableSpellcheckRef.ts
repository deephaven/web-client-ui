import { SPELLCHECK_FALSE_ATTRIBUTE } from '@deephaven/utils';
import {
  extractSpectrumHTMLElement,
  ReactSpectrumComponent,
} from './SpectrumUtils';
import useMappedRef from './useMappedRef';
import useSetAttributesCallback from './useSetAttributesCallback';

/**
 * Returns a callback ref that can be assigned to a React Spectrum component.
 * to set `spellCheck=false` on child elements based on given selectors.
 * @param selectors Optional `querySelector` argument to target child elements.
 * If omitted, the attributes will be applied to the root element returned by
 * `UNSAFE_getDOMNode()` on the component ref.
 */
export function useSpectrumDisableSpellcheckRef(
  selectors?: string
): (ref: ReactSpectrumComponent | null) => void {
  const disableSpellcheck = useSetAttributesCallback(
    SPELLCHECK_FALSE_ATTRIBUTE,
    selectors
  );

  return useMappedRef(disableSpellcheck, extractSpectrumHTMLElement);
}

export default useSpectrumDisableSpellcheckRef;
