import { useCallback } from 'react';
import type { Table } from '@deephaven/jsapi-types';

export interface UseGetItemPositionOptions {
  table?: Table | null;
  columnName: string;
  defaultValue?: string | null;
  itemHeight: number;
  topOffset?: number;
  value: string;
}

/**
 * Gets an item's position in a list of items based on its row index in a table.
 * @param table Table to search for the item in
 * @param columnName Column name to search for the item in
 * @param defaultValue Optional default value. This would be the first item in
 * the list and not expected to be in the Table.
 * @param itemHeight Height of each item in the list
 * @param topOffset Optional pixel offset from the top of the list
 * @param value Value to search for in the column
 */
export function useGetItemPosition({
  table,
  columnName,
  defaultValue,
  itemHeight,
  topOffset = 0,
  value,
}: UseGetItemPositionOptions) {
  return useCallback(async () => {
    if (table == null || value === '' || value === defaultValue) {
      return topOffset;
    }

    const column = table.findColumn(columnName);
    const rowIndex = await table.seekRow(0, column, 'String', value);

    // If a default item exists at the top of the list, offset the item index by 1
    const defaultItemOffset = defaultValue == null ? 0 : 1;

    return (rowIndex + defaultItemOffset) * itemHeight + topOffset;
  }, [columnName, defaultValue, itemHeight, table, topOffset, value]);
}

export default useGetItemPosition;
