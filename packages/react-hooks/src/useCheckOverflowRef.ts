import { useCallback, useState } from 'react';
import type { DOMRefValue } from '@react-types/shared';

export interface CheckOverflowRefResult {
  checkOverflowRef: <T extends HTMLElement>(
    elRef: DOMRefValue<T> | null
  ) => void;
  isOverflowing: boolean;
  resetIsOverflowing: () => void;
}

export function useCheckOverflowRef(): CheckOverflowRefResult {
  const [isOverflowing, setIsOverflowing] = useState(false);

  /**
   * Whenever a Spectrum `DOMRefValue` component renders, see if the content is
   * overflowing so we know whether to render a tooltip showing the full content
   * or not.
   */
  const checkOverflowRef = useCallback(
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

  const resetIsOverflowing = useCallback(() => {
    setIsOverflowing(false);
  }, []);

  return {
    isOverflowing,
    checkOverflowRef,
    resetIsOverflowing,
  };
}

export default useCheckOverflowRef;
