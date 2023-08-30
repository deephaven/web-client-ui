import { useCallback, useEffect, useMemo } from 'react';
import type { FilterCondition, Table, TreeTable } from '@deephaven/jsapi-types';
import {
  RowDeserializer,
  defaultRowDeserializer,
  isClosed,
  createOnTableUpdatedHandler,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useOnScrollOffsetChangeCallback } from '@deephaven/react-hooks';
import {
  KeyedItem,
  SCROLL_DEBOUNCE_MS,
  WindowedListData,
} from '@deephaven/utils';
import useInitializeViewportData from './useInitializeViewportData';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';
import useTableSize from './useTableSize';
import useTableListener from './useTableListener';

const log = Log.module('useViewportData');

export interface UseViewportDataProps<TItem, TTable extends Table | TreeTable> {
  table: TTable | null;
  itemHeight?: number;
  scrollDebounce?: number;
  viewportSize?: number;
  viewportPadding?: number;
  deserializeRow?: RowDeserializer<TItem>;
}

export interface UseViewportDataResult<
  TItem,
  TTable extends Table | TreeTable,
> {
  /** Manages deserialized row items associated with a DH Table */
  viewportData: WindowedListData<KeyedItem<TItem>>;
  /** Size of the underlying Table */
  size: number;

  table: TTable | null;
  /** Apply filters and refresh viewport. */
  applyFiltersAndRefresh: (filters: FilterCondition[]) => void;
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
 * @param table
 * @param itemHeight
 * @param viewportSize
 * @param viewportPadding
 * @returns An object for managing Table viewport state.
 */
export function useViewportData<TItem, TTable extends Table | TreeTable>({
  table,
  itemHeight = 1,
  scrollDebounce = SCROLL_DEBOUNCE_MS,
  viewportSize = 10,
  viewportPadding = 50,
  deserializeRow = defaultRowDeserializer,
}: UseViewportDataProps<TItem, TTable>): UseViewportDataResult<TItem, TTable> {
  const viewportData = useInitializeViewportData<TItem>(table);

  const setPaddedViewport = useSetPaddedViewportCallback(
    table,
    viewportSize,
    viewportPadding
  );

  const setViewport = useCallback(
    (firstRow: number) => {
      if (table && !isClosed(table)) {
        setPaddedViewport(firstRow);
      } else {
        log.debug('setViewport called on closed table.', table);
      }
    },
    [table, setPaddedViewport]
  );

  const applyFiltersAndRefresh = useCallback(
    (filters: FilterCondition[]) => {
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

  const onTableUpdated = useMemo(
    () => createOnTableUpdatedHandler(viewportData, deserializeRow),
    [deserializeRow, viewportData]
  );

  useTableListener(table, dh.Table.EVENT_UPDATED, onTableUpdated);

  const size = useTableSize(table);

  useEffect(() => {
    // Hydrate the viewport with real data. This will fetch data from index
    // 0 to the end of the viewport + padding.
    setViewport(0);
  }, [table, setViewport, size]);

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
