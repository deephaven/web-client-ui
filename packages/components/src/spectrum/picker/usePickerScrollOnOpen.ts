import { useCallback } from 'react';
import type { DOMRefValue } from '@react-types/shared';
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
  ref: React.RefObject<DOMRefValue<HTMLElement>>;
  onOpenChange: (isOpen: boolean) => void;
}

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
