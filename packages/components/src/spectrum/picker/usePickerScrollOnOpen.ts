import { useCallback } from 'react';
import type { DOMRef } from '@react-types/shared';
import {
  findSpectrumPickerScrollArea,
  usePopoverOnScrollRef,
} from '@deephaven/react-hooks';

export interface UsePickerScrollOnOpenOptions {
  getInitialScrollPosition?: () => Promise<number | null | undefined>;
  onScroll: (event: Event) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface UsePickerScrollOnOpenResult {
  ref: DOMRef<HTMLElement>;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Handle scroll event registration and scrolling to initial scroll position
 * whenever a Picker popover is opened.
 * @param getInitialScrollPosition Function to get the initial scroll position.
 * @param onScroll Callback for scroll events.
 * @param onOpenChange Callback for open change events.
 * @return A ref to attach to the Picker and a callback to handle open change
 * events for the Picker.
 */
export function usePickerScrollOnOpen({
  getInitialScrollPosition,
  onScroll,
  onOpenChange,
}: UsePickerScrollOnOpenOptions): UsePickerScrollOnOpenResult {
  const { ref, onOpenChange: popoverOnOpenChange } = usePopoverOnScrollRef(
    findSpectrumPickerScrollArea,
    onScroll,
    getInitialScrollPosition
  );

  const onOpenChangeInternal = useCallback(
    (isOpen: boolean): void => {
      // Attach scroll event handling
      popoverOnOpenChange(isOpen);

      onOpenChange?.(isOpen);
    },
    [onOpenChange, popoverOnOpenChange]
  );

  return {
    ref,
    onOpenChange: onOpenChangeInternal,
  };
}

export default usePickerScrollOnOpen;
