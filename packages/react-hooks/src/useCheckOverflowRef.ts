import { useCallback, useState } from 'react';
import type { DOMRefValue } from '@react-types/shared';

export interface CheckOverflowRefResult {
  isOverflowing: boolean;
  ref: <T extends HTMLElement>(elRef: DOMRefValue<T> | null) => void;
  reset: () => void;
}

export function useCheckOverflowRef(): CheckOverflowRefResult {
  const [isOverflowing, setIsOverflowing] = useState(false);

  /**
   * Whenever a Spectrum `DOMRefValue` component renders, see if the content is
   * overflowing so we know whether to render a tooltip showing the full content
   * or not.
   */
  const ref = useCallback(
    <T extends HTMLElement>(elRef: DOMRefValue<T> | null) => {
      const el = elRef?.UNSAFE_getDOMNode();

      if (el == null) {
        return;
      }

      if (el.scrollWidth > el.offsetWidth) {
        setIsOverflowing(true);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsOverflowing(false);
  }, []);

  return {
    isOverflowing,
    ref,
    reset,
  };
}

export default useCheckOverflowRef;
