import { useCallback, useMemo } from 'react';
import {
  getPositionOfSelectedItemElement,
  isItemElementWithDescription,
  isSectionElement,
  ItemElement,
  ItemKey,
  SectionElement,
} from './itemUtils';

export interface UseStaticItemInitialScrollPositionOptions {
  itemHeight: number;
  items: (ItemElement<unknown> | SectionElement<unknown>)[];
  selectedKey?: ItemKey | null;
  topOffset: number;
}

export function useStaticItemInitialScrollPosition({
  itemHeight,
  selectedKey,
  topOffset,
  items,
}: UseStaticItemInitialScrollPositionOptions): () => Promise<number | null> {
  // Item descriptions and Section elements introduce variable item heights.
  // This throws off scroll position calculations, so we disable auto scrolling
  // if either of these are found.
  const disableScrollOnOpen = useMemo(
    () =>
      items.some(
        item => isSectionElement(item) || isItemElementWithDescription(item)
      ),
    [items]
  );

  const getInitialScrollPosition = useCallback(
    async () =>
      disableScrollOnOpen
        ? topOffset
        : getPositionOfSelectedItemElement({
            items,
            itemHeight,
            selectedKey,
            topOffset,
          }),
    [disableScrollOnOpen, itemHeight, items, selectedKey, topOffset]
  );

  return getInitialScrollPosition;
}

export default useStaticItemInitialScrollPosition;
