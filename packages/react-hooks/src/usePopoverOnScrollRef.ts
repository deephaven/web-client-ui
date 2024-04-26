import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePopoverOnScrollRefResult<T> {
  ref: React.RefObject<T>;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * This hook provides a way to attach a scroll event listener to a scroll area
 * inside a popover component. Popovers for picker components only exist when
 * the picker is open, and they get attached to the DOM outside of the child
 * tree, so we have to provide a function that can find the target DOM element
 * to attach the listener to.
 * @param findScrollArea Function to retreive the DOM element to attach a scroll
 * event listener to
 * @param onScroll Scroll event listener function to attach
 * @param getInitialScrollPosition Function to retrieve the initial scroll
 * position. If no function is given, or if the function returns `null`, no
 * initial scrolling will occur.
 */
export function usePopoverOnScrollRef<T>(
  findScrollArea: (ref: T | null) => HTMLElement | null,
  onScroll: (event: Event) => void,
  getInitialScrollPosition?: () => Promise<number | null | undefined>
): UsePopoverOnScrollRefResult<T> {
  const ref = useRef<T>(null);
  const isScrollOnOpenEnabledRef = useRef(false);
  const [scrollAreaEl, setScrollAreaEl] = useState<HTMLElement | null>(null);

  const scrollToInitialPosition = useCallback(async () => {
    if (scrollAreaEl == null || getInitialScrollPosition == null) {
      return;
    }

    const position = await getInitialScrollPosition();

    // If the position is null, don't scroll
    if (position == null) {
      return;
    }

    scrollAreaEl.scroll(0, position);
  }, [getInitialScrollPosition, scrollAreaEl]);

  useEffect(() => {
    scrollAreaEl?.addEventListener('scroll', onScroll);

    // Ticking tables can cause this effect to fire multiple times while the
    // popover is still open. This check ensures that we only scroll 1x.
    if (isScrollOnOpenEnabledRef.current) {
      scrollToInitialPosition();
      isScrollOnOpenEnabledRef.current = false;
    }

    return () => {
      scrollAreaEl?.removeEventListener('scroll', onScroll);
    };
  }, [onScroll, scrollAreaEl, scrollToInitialPosition]);

  const scrollTimeoutRef = useRef<number>();

  // Popovers for picker components only exist when the popover opens, so we
  // have to wait to attach scroll listeners
  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      window.clearTimeout(scrollTimeoutRef.current);

      if (isOpen) {
        isScrollOnOpenEnabledRef.current = true;

        // setTimeout is necessary for popover to be available
        scrollTimeoutRef.current = window.setTimeout(() => {
          setScrollAreaEl(findScrollArea(ref.current));
        }, 0);
      } else {
        setScrollAreaEl(null);
      }
    },
    [findScrollArea]
  );

  return {
    ref,
    onOpenChange,
  };
}

export default usePopoverOnScrollRef;
