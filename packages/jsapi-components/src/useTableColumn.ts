import { useMemo } from 'react';
import { Column, Table } from '@deephaven/jsapi-shim';
import useTable from './useTable';

/**
 * Subscribe to viewport updates on a single table column
 * @param table Table to get the data from
 * @param columnName Column to get the data from
 * @param firstRow First viewport row
 * @param lastRow Last viewport row
 * @returns Column object, data array for the column, error, setViewport method
 */
const useTableColumn = (
  table: Table | undefined,
  columnName: string,
  firstRow: number,
  lastRow: number
): {
  column: Column | undefined;
  data: unknown[];
  error: Error | null;
  setViewport: (viewport: [number, number]) => void;
} => {
  const columnNames = useMemo(() => [columnName], [columnName]);
  const { columns = [], data = [], error, setViewport } = useTable(
    table,
    columnNames,
    firstRow,
    lastRow
  );
  return {
    column: columns[0],
    data: data[0],
    error,
    setViewport,
  };
};

export default useTableColumn;
