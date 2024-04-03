import { useCallback } from 'react';
import { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { useTableUtils } from './useTableUtils';

const log = Log.module('useGetItemIndexByValue');

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

    try {
      const index = await table.seekRow(0, column, columnValueType, value);
      return index === -1 ? null : index;
    } catch (err) {
      log.debug('Error seeking row', { column, value, columnValueType });
      throw err;
    }
  }, [columnName, table, tableUtils, value]);
}

export default useGetItemIndexByValue;
