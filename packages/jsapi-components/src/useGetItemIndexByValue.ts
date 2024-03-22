import { useCallback } from 'react';
import { dh } from '@deephaven/jsapi-types';
import useTableUtils from './useTableUtils';

/**
 * Returns a function that gets the index of the first row containing a column
 * value.
 * @param columnName The name of the column to search
 * @param value The value to search for
 * @param table The table to search in
 * @returns A function that returns the index of the first row containing the
 * matching value, or `null` if no match is found
 */
export function useGetItemIndexByValue<TValue>({
  columnName,
  value,
  table,
}: {
  columnName: string;
  table: dh.Table | null;
  value: TValue | null | undefined;
}): () => Promise<number | null> {
  const tableUtils = useTableUtils();

  return useCallback(async () => {
    if (table == null || value == null) {
      return null;
    }

    const column = table.findColumn(columnName);
    const columnValueType = tableUtils.getValueType(column.type);

    // TODO: It seems that `seekRow` returns the index of the last row when
    // no match is found. We need a way to distinguish between a match in the
    // last row and no match at all and return `null` in the latter case.
    return table.seekRow(0, column, columnValueType, value);
  }, [columnName, table, tableUtils, value]);
}

export default useGetItemIndexByValue;
