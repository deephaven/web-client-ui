import { useMemo } from 'react';
import type { Column, Table } from '@deephaven/jsapi-types';
import useTable from './useTable';

/**
 * Subscribe to viewport updates on a single table column
 * @param table Table to get the data from
 * @param firstRow First viewport row
 * @param lastRow Last viewport row
 * @param columnName Column to get the data from
 * @returns Column object, data array for the column, error, setViewport method
 */
const useTableColumn = (
  table: Table | undefined,
  firstRow: number,
  lastRow: number,
  columnName: string
): {
  column: Column | undefined;
  data: unknown[];
  error: Error | null;
} => {
  const columnNames = useMemo(() => [columnName], [columnName]);
  const { columns = [], data = [], error } = useTable(
    table,
    firstRow,
    lastRow,
    columnNames
  );
  return {
    column: columns[0],
    data: data[0],
    error,
  };
};

export default useTableColumn;
