import { useCallback } from 'react';
import type { DOMRef } from '@react-types/shared';
import {
  findSpectrumPickerScrollArea,
  usePopoverOnScrollRef,
} from '@deephaven/react-hooks';
import type { MenuTriggerAction } from '../comboBox';

export interface UsePickerScrollOnOpenOptions {
  getInitialScrollPosition?: () => Promise<number | null | undefined>;
  onScroll: (event: Event) => void;
  onOpenChange?: (isOpen: boolean, menuTrigger?: MenuTriggerAction) => void;
}

export interface UsePickerScrollOnOpenResult<THtml extends HTMLElement> {
  ref: DOMRef<THtml>;
  onOpenChange: (isOpen: boolean, menuTrigger?: MenuTriggerAction) => void;
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
export function usePickerScrollOnOpen<THtml extends HTMLElement = HTMLElement>({
  getInitialScrollPosition,
  onScroll,
  onOpenChange,
}: UsePickerScrollOnOpenOptions): UsePickerScrollOnOpenResult<THtml> {
  const { ref, onOpenChange: popoverOnOpenChange } = usePopoverOnScrollRef(
    findSpectrumPickerScrollArea<THtml>,
    onScroll,
    getInitialScrollPosition
  );

  const onOpenChangeInternal = useCallback(
    (isOpen: boolean, menuTrigger?: MenuTriggerAction): void => {
      // Attach scroll event handling
      popoverOnOpenChange(isOpen);

      onOpenChange?.(isOpen, menuTrigger);
    },
    [onOpenChange, popoverOnOpenChange]
  );

  return {
    ref,
    onOpenChange: onOpenChangeInternal,
  };
}

export default usePickerScrollOnOpen;
