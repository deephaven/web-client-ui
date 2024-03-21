import { useCallback, useRef } from 'react';
import { KeyedItem } from '@deephaven/utils';
import { defaultGetInitialScrollPosition } from './SpectrumUtils';

export interface UseGetInitialScrollPositionResult {
  enableScrollOnOpen: () => void;
  getInitialScrollPosition: () => Promise<number | null>;
}

export function useGetInitialScrollPosition<
  TKey extends string | number | boolean | undefined,
>({
  getInitialScrollPosition,
  keyedItems,
  itemHeight,
  selectedKey,
  topOffset,
}: {
  getInitialScrollPosition?: () => Promise<number | null>;
  keyedItems: KeyedItem<{ key?: TKey }, TKey>[];
  itemHeight: number;
  selectedKey: TKey | null | undefined;
  topOffset: number;
}): UseGetInitialScrollPositionResult {
  const isScrollOnOpenEnabledRef = useRef(false);

  const enableScrollOnOpen = useCallback(() => {
    isScrollOnOpenEnabledRef.current = true;
  }, []);

  const getInitialScrollPositionInternal = useCallback(async () => {
    // If scroll on open is disabled, don't scroll
    if (!isScrollOnOpenEnabledRef.current) {
      return null;
    }

    // Disable scroll on open after the first scroll. This protects popovers
    // for ticking tables from re-scrolling while the popover is open. Consuming
    // components can call `enableScrollOnOpen` to re-enable scrolling.
    isScrollOnOpenEnabledRef.current = false;

    return getInitialScrollPosition == null
      ? defaultGetInitialScrollPosition({
          keyedItems,
          itemHeight,
          selectedKey,
          topOffset,
        })
      : getInitialScrollPosition();
  }, [
    getInitialScrollPosition,
    itemHeight,
    keyedItems,
    selectedKey,
    topOffset,
  ]);

  return {
    enableScrollOnOpen,
    getInitialScrollPosition: getInitialScrollPositionInternal,
  };
}

export default useGetInitialScrollPosition;
