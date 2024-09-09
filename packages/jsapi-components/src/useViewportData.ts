import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import {
  RowDeserializer,
  defaultRowDeserializer,
  isClosed,
  createOnTableUpdatedHandler,
  OnTableUpdatedEvent,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  useOnScrollOffsetChangeCallback,
  WindowedListData,
} from '@deephaven/react-hooks';
import { KeyedItem } from '@deephaven/utils';
import useInitializeViewportData from './useInitializeViewportData';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';
import useTableSize from './useTableSize';
import useTableListener from './useTableListener';
import { SCROLL_DEBOUNCE_MS } from './Constants';

const log = Log.module('useViewportData');

export interface UseViewportDataProps<
  TItem,
  TTable extends dh.Table | dh.TreeTable,
> {
  reuseItemsOnTableResize?: boolean;
  table: TTable | null;
  itemHeight?: number;
  scrollDebounce?: number;
  viewportPadding?: number;
  viewportSize?: number;
  deserializeRow?: RowDeserializer<TItem>;
}

export interface UseViewportDataResult<
  TItem,
  TTable extends dh.Table | dh.TreeTable,
> {
  /** Manages deserialized row items associated with a DH Table */
  viewportData: WindowedListData<KeyedItem<TItem>>;
  /** Size of the underlying Table */
  size: number;

  table: TTable | null;
  /** Apply filters and refresh viewport. */
  applyFiltersAndRefresh: (filters: dh.FilterCondition[]) => void;
  /** Set the viewport of the Table */
  setViewport: (firstRow: number) => void;
  /** Handler for scroll events to update viewport */
  onScroll: (event: Event) => void;
}

/**
 * Sets up state management for windowed Table viewports. Returns a ListData
 * instance for managing items associated with the Table + a `setViewport`
 * callback for changing the current viewport.
 *
 * IMPORTANT: this will create an empty KeyedItem object for every row in the
 * source table. This is intended for "human" sized tables such as those used in
 * admin panels. This is not suitable for "machine" scale with millions+ rows.
 * @param table The Table to viewport.
 * @param itemHeight The height of each item in the viewport.
 * @param scrollDebounce The number of milliseconds to debounce scroll events.
 * @param viewportSize The number of items to display in the viewport.
 * @param viewportPadding The number of items to fetch at start and end of the viewport.
 * @param deserializeRow A function to deserialize a row from the Table.
 * @param reuseItemsOnTableResize If true, existing items will be re-used when
 * the table size changes.
 * @returns An object for managing Table viewport state.
 */
export function useViewportData<TItem, TTable extends dh.Table | dh.TreeTable>({
  table,
  itemHeight = 1,
  scrollDebounce = SCROLL_DEBOUNCE_MS,
  viewportSize = 10,
  viewportPadding = 50,
  deserializeRow = defaultRowDeserializer,
  reuseItemsOnTableResize = false,
}: UseViewportDataProps<TItem, TTable>): UseViewportDataResult<TItem, TTable> {
  const currentViewportFirstRowRef = useRef<number>(0);

  const viewportData = useInitializeViewportData<TItem>(
    table,
    reuseItemsOnTableResize
  );

  const setPaddedViewport = useSetPaddedViewportCallback(
    table,
    viewportSize,
    viewportPadding
  );

  const setViewport = useCallback(
    (firstRow: number) => {
      currentViewportFirstRowRef.current = firstRow;

      if (table && !isClosed(table)) {
        setPaddedViewport(firstRow);
      } else {
        log.debug('setViewport called on closed table.', table);
      }
    },
    [table, setPaddedViewport]
  );

  const applyFiltersAndRefresh = useCallback(
    (filters: dh.FilterCondition[]) => {
      if (table && !isClosed(table)) {
        table.applyFilter(filters);
        setViewport(0);
      } else {
        log.debug('applyFiltersAndRefresh called on closed table.', table);
      }
    },
    [setViewport, table]
  );

  const dh = useApi();

  // Store the memoized callback in a ref so that changes to `viewportData`
  // don't invalidate the memoization of `onTableUpdated`. This prevents
  // `useTableListener` from unnecessarily re-subscribing to the same event over
  // and over.
  const onTableUpdatedRef = useRef<(event: OnTableUpdatedEvent) => void>();
  onTableUpdatedRef.current = useMemo(
    () => createOnTableUpdatedHandler(viewportData, deserializeRow),
    [deserializeRow, viewportData]
  );

  const onTableUpdated = useCallback((event: OnTableUpdatedEvent) => {
    onTableUpdatedRef.current?.(event);
  }, []);

  useTableListener(table, dh.Table.EVENT_UPDATED, onTableUpdated);

  const size = useTableSize(table);

  useEffect(() => {
    log.debug('Initializing viewport');

    // Hydrate the viewport with real data. This will fetch data from index
    // 0 to the end of the viewport + padding.
    setViewport(0);
  }, [table, setViewport]);

  useEffect(() => {
    setViewport(currentViewportFirstRowRef.current);
  }, [setViewport, size]);

  const onScroll = useOnScrollOffsetChangeCallback(
    itemHeight,
    setViewport,
    scrollDebounce
  );

  return useMemo(
    () => ({
      viewportData,
      size,
      table,
      applyFiltersAndRefresh,
      setViewport,
      onScroll,
    }),
    [applyFiltersAndRefresh, onScroll, setViewport, size, table, viewportData]
  );
}

export default useViewportData;
