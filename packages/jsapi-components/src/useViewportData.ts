import { useCallback, useEffect } from 'react';
import { ListData } from '@react-stately/data';
import type { FilterCondition, Table, TreeTable } from '@deephaven/jsapi-types';
import {
  KeyedItem,
  RowDeserializer,
  createOnTableUpdatedHandler,
  defaultRowDeserializer,
  isClosed,
} from '@deephaven/jsapi-utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import useInitializeViewportData from './useInitializeViewportData';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';
import useTableListener from './useTableListener';
import useTableSize from './useTableSize';

export interface UseViewportDataProps<TItem, TTable extends Table | TreeTable> {
  table: TTable | null;
  viewportSize?: number;
  viewportPadding?: number;
  deserializeRow?: RowDeserializer<TItem>;
}

export interface UseViewportDataResult<
  TItem,
  TTable extends Table | TreeTable
> {
  /** Manages deserialized row items associated with a DH Table */
  viewportData: ListData<KeyedItem<TItem>>;
  /** Size of the underlying Table */
  size: number;

  table: TTable | null;
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
 * @returns An object for managing Table viewport state. Note that the returned
 * object changes on every render due to the `viewportData` not being memoized.
 * This is due to the underlying React Stately `useListData` implementation that
 * also changes its returned object on every render.
 */
export default function useViewportData<
  TItem,
  TTable extends Table | TreeTable
>({
  table,
  viewportSize = 10,
  viewportPadding = 50,
  deserializeRow = defaultRowDeserializer,
}: UseViewportDataProps<TItem, TTable>): UseViewportDataResult<TItem, TTable> {
  const viewportData = useInitializeViewportData<TItem>(table);

  const setViewport = useSetPaddedViewportCallback(
    table,
    viewportSize,
    viewportPadding
  );

  const applyFiltersAndRefresh = useCallback(
    (filters: FilterCondition[]) => {
      table?.applyFilter(filters);
      setViewport(0);
    },
    [setViewport, table]
  );

  const dh = useApi();

  useTableListener(
    table,
    dh.Table.EVENT_UPDATED,
    createOnTableUpdatedHandler(viewportData, deserializeRow)
  );

  const size = useTableSize(table);

  useEffect(() => {
    if (table && !isClosed(table)) {
      // Hydrate the viewport with real data. This will fetch data from index
      // 0 to the end of the viewport + padding.
      setViewport(0);
    }
  }, [table, setViewport, size]);

  return {
    viewportData,
    size,
    table,
    applyFiltersAndRefresh,
    setViewport,
  };
}
