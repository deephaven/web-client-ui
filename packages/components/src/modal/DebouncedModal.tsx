import React from 'react';
import { DEFAULT_DEBOUNCE_MS, useDebouncedValue } from '@deephaven/react-hooks';

export type DebouncedModalProps = {
  /** Whether to block interaction immediately */
  blockInteraction?: boolean;

  /** Children to render after the alloted debounce time */
  children: React.ReactNode;

  /** Time to debounce */
  debounceMs?: number;

  /**
   * Will render the `children` `debounceMs` after `isOpen` is set to `true.
   * Will stop rendering immediately after `isOpen` is set to `false`.
   */
  isOpen: boolean;
};

/**
 * Display a modal after a debounce time. Blocks the screen from interaction immediately,
 * but then waits the set debounce time before rendering the modal.
 */
function DebouncedModal({
  blockInteraction = true,
  children,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  isOpen,
}: DebouncedModalProps) {
  const debouncedIsOpen = useDebouncedValue(isOpen, debounceMs);

  return (
    <>
      {blockInteraction && isOpen && (
        <div
          className="modal-backdrop transparent"
          data-testid="debounced-modal-backdrop"
        />
      )}
      {isOpen && debouncedIsOpen && children}
    </>
  );
}

export default DebouncedModal;
