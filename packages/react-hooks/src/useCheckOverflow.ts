import { useCallback, useState } from 'react';
import type { DOMRefValue } from '@react-types/shared';

export interface CheckOverflowResult {
  /**
   * Callback to check if a Spectrum `DOMRefValue` is overflowing. If an
   * overflowing value is passed, `isOverflowing` will be set to true. Note that
   * calling again with a non-overflowing value will *not* reset the state.
   * Instead `resetIsOverflowing` must be called explicitly. This is to allow
   * multiple `DOMRefValue`s to be checked and `isOverflowing` to remain `true`
   * if at least one of them is overflowing.
   */
  checkOverflow: <T extends HTMLElement>(elRef: DOMRefValue<T> | null) => void;

  /**
   * Will be set to true whenever `checkOverflow` is called with an overflowing
   * `DOMRefValue`. It will remain `true` until `resetIsOverflowing` is called.
   * Default state is `false`.
   */
  isOverflowing: boolean;

  /** Reset `isOverflowing` to false */
  resetIsOverflowing: () => void;
}

/**
 * Provides a callback to check a Spectrum `DOMRefValue` for overflow. If
 * overflow is detected, `isOverflowing` will be set to `true` until reset by
 * calling `resetIsOverflowing`.
 */
export function useCheckOverflow(): CheckOverflowResult {
  const [isOverflowing, setIsOverflowing] = useState(false);

  /**
   * Check if a Spectrum `DOMRefValue` is overflowing.
   */
  const checkOverflow = useCallback(
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

  /** Reset `isOverflowing` to false */
  const resetIsOverflowing = useCallback(() => {
    setIsOverflowing(false);
  }, []);

  return {
    isOverflowing,
    checkOverflow,
    resetIsOverflowing,
  };
}

export default useCheckOverflow;
