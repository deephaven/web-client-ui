import { useCallback, useEffect } from 'react';
import { ListData, useListData } from '@react-stately/data';
import { Table, TreeTable } from '@deephaven/jsapi-shim';
import {
  KeyedItem,
  RowDeserializer,
  createOnTableUpdatedHandler,
  defaultRowDeserializer,
  generateEmptyKeyedItems,
  getSize,
  isClosed,
  padFirstAndLastRow,
} from '@deephaven/jsapi-utils';
import useTableListener from './useTableListener';

export interface UseViewportDataProps<T> {
  table: Table | TreeTable | null;
  viewportSize?: number;
  viewportPadding?: number;
  deserializeRow?: RowDeserializer<T>;
}

export interface UseViewportDataResult<T> {
  viewportData: ListData<KeyedItem<T>>;
  size: number;
  setViewport: (firstRow: number) => void;
}

export default function useViewportData<T>({
  table,
  viewportSize = 10,
  viewportPadding = 50,
  deserializeRow = defaultRowDeserializer,
}: UseViewportDataProps<T>): UseViewportDataResult<T> {
  const viewportData = useListData<KeyedItem<T>>({});

  // We only want this to fire 1x once the table exists. Note that `useListData`
  // has no way to respond to a reference change of the `table` instance so we
  // have to manually delete any previous keyed items from the list.
  useEffect(() => {
    if (table) {
      if (viewportData.items.length) {
        viewportData.remove(...viewportData.items.keys());
      }

      viewportData.insert(0, ...generateEmptyKeyedItems<T>(getSize(table)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const setViewport = useCallback(
    (firstRow: number) => {
      const [first, last] = padFirstAndLastRow(
        firstRow,
        viewportSize,
        viewportPadding,
        getSize(table)
      );
      table?.setViewport(first, last);
    },
    [table, viewportPadding, viewportSize]
  );

  useTableListener(
    table,
    dh.Table.EVENT_UPDATED,
    createOnTableUpdatedHandler(table, viewportData, deserializeRow)
  );

  useEffect(() => {
    if (table && !isClosed(table)) {
      table.setViewport(0, viewportSize + viewportPadding - 1);
    }
  }, [table, viewportPadding, viewportSize]);

  return {
    viewportData,
    size: getSize(table),
    setViewport,
  };
}
