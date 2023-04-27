import { useCallback, useEffect } from 'react';
import { ListData } from '@react-stately/data';
import { Table, TreeTable } from '@deephaven/jsapi-types';
import {
  KeyedItem,
  RowDeserializer,
  createOnTableUpdatedHandler,
  defaultRowDeserializer,
  getSize,
  isClosed,
} from '@deephaven/jsapi-utils';
import useInitializeViewportData from './useInitializeViewportData';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';
import useTableListener from './useTableListener';

export interface UseViewportDataProps<I, T extends Table | TreeTable> {
  table: T | null;
  viewportSize?: number;
  viewportPadding?: number;
  deserializeRow?: RowDeserializer<I>;
}

export interface UseViewportDataResult<I, T extends Table | TreeTable> {
  /** Manages deserialized row items associated with a DH Table */
  viewportData: ListData<KeyedItem<I>>;
  /** Size of the underlying Table */
  size: number;

  table: T | null;
  /** Apply filters and refresh viewport. */
  applyFiltersAndRefresh: (filters: FilterCondition[]) => void;
  /** Set the viewport of the Table */
  setViewport: (firstRow: number) => void;
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
 * @param viewportSize
 * @param viewportPadding
 * @returns An object for managing Table viewport state.
 */
export default function useViewportData<I, T extends Table | TreeTable>({
  table,
  viewportSize = 10,
  viewportPadding = 50,
  deserializeRow = defaultRowDeserializer,
}: UseViewportDataProps<I, T>): UseViewportDataResult<I, T> {
  const viewportData = useInitializeViewportData<I>(table);

  const setViewport = useSetPaddedViewportCallback(
    table,
    viewportSize,
    viewportPadding
  );

  const applyFiltersAndRefresh = useCallback(
    (filters: FilterCondition[]) => {
      table?.applyFilter(filters);
      setViewport(0);
      console.log('[TESTING4] filter applied', filters);
    },
    [setViewport, table]
  );

  useTableListener(
    table,
    dh.Table.EVENT_UPDATED,
    createOnTableUpdatedHandler(viewportData, deserializeRow)
  );

  const size = getSize(table);

  useEffect(() => {
    if (table && !isClosed(table)) {
      // Hydrate the viewport with real data. This will fetch data from index
      // 0 to the end of the viewport + padding.
      setViewport(0);
    }
  }, [table, setViewport, size]);

  return {
    viewportData,
    size: getSize(table),
    table,
    applyFiltersAndRefresh,
    setViewport,
  };
}
