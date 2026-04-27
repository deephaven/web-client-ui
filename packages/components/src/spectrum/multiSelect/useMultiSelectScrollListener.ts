import { type RefObject, useEffect, useRef, useState } from 'react';

export interface UseMultiSelectScrollListenerOptions {
  /** Ref to the DOM container that wraps the popover's `<ListBox>`. */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether the popover is currently open. */
  isOpen: boolean;
  /** Scroll event listener attached to the inner scroll area. */
  onScroll: (event: Event) => void;
}

/**
 * Resolves the scrollable element inside the popover (the listbox, or the
 * container if the listbox isn't present) and attaches a scroll listener
 * to it. The listener is detached when the popover closes.
 */
export function useMultiSelectScrollListener({
  containerRef,
  isOpen,
  onScroll,
}: UseMultiSelectScrollListenerOptions): void {
  const [scrollAreaEl, setScrollAreaEl] = useState<HTMLElement | null>(null);

  // Mirror onScroll into a ref so the listener is attached once per
  // scrollAreaEl lifetime, regardless of caller memoization.
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  useEffect(() => {
    if (!isOpen) {
      setScrollAreaEl(null);
      return undefined;
    }

    // The ListBox mounts asynchronously inside the popover, so defer one
    // animation frame to give Spectrum time to attach.
    const handle = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container == null) {
        return;
      }
      const listBox = container.querySelector<HTMLElement>('[role="listbox"]');
      setScrollAreaEl(listBox ?? container);
    });

    return () => {
      window.cancelAnimationFrame(handle);
    };
  }, [isOpen, containerRef]);

  // Attach scroll listener when the scroll area becomes available.
  useEffect(() => {
    if (scrollAreaEl == null) {
      return undefined;
    }

    const handler = (event: Event): void => {
      onScrollRef.current(event);
    };

    scrollAreaEl.addEventListener('scroll', handler);

    return () => {
      scrollAreaEl.removeEventListener('scroll', handler);
    };
  }, [scrollAreaEl]);
}

export default useMultiSelectScrollListener;
