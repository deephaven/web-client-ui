import { useEffect } from 'react';
import { ListData } from '@react-stately/data';
import { Table, TreeTable } from '@deephaven/jsapi-shim';
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

export interface UseViewportDataProps<T> {
  table: Table | TreeTable | null;
  viewportSize?: number;
  viewportPadding?: number;
  deserializeRow?: RowDeserializer<T>;
}

export interface UseViewportDataResult<T> {
  /** Manages deserialized row items associated with a DH Table */
  viewportData: ListData<KeyedItem<T>>;
  /** Size of the underlying Table */
  size: number;
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
export default function useViewportData<T>({
  table,
  viewportSize = 10,
  viewportPadding = 50,
  deserializeRow = defaultRowDeserializer,
}: UseViewportDataProps<T>): UseViewportDataResult<T> {
  const viewportData = useInitializeViewportData<T>(table);

  const setViewport = useSetPaddedViewportCallback(
    table,
    viewportSize,
    viewportPadding
  );

  useTableListener(
    table,
    dh.Table.EVENT_UPDATED,
    createOnTableUpdatedHandler(table, viewportData, deserializeRow)
  );

  useEffect(() => {
    if (table && !isClosed(table)) {
      setViewport(0);
    }
  }, [table, setViewport]);

  return {
    viewportData,
    size: getSize(table),
    setViewport,
  };
}
