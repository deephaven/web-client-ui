import { useCallback, useEffect, useState } from 'react';
import { Column, Row, Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import useTableListener from './useTableListener';
import ColumnNameError from './ColumnNameError';
import TableDisconnectError from './TableDisconnectError';

const log = Log.module('useTable');

const useTable = (
  table: Table | undefined,
  firstRow: number,
  lastRow: number,
  columnNames?: string[]
): {
  columns: Column[] | undefined;
  data: unknown[][];
  error: Error | null;
} => {
  const [columns, setColumns] = useState<Column[] | undefined>(undefined);
  const [data, setData] = useState<unknown[][]>([]);
  const [columnError, setColumnError] = useState<Error | null>(null);
  const [tableError, setTableError] = useState<Error | null>(null);

  useEffect(() => {
    if (columnNames === undefined) {
      setColumns(table?.columns);
      setColumnError(null);
      return;
    }
    try {
      setColumns(table?.findColumns(columnNames));
      setColumnError(null);
    } catch (e) {
      log.error(`Column not found`, e, columnNames);
      setColumnError(new ColumnNameError('Invalid columnNames argument'));
    }
  }, [table, columnNames]);

  useEffect(() => {
    if (!columns || !table) {
      log.debug2('Table or column not initialized, skip viewport update.');
      return;
    }
    log.debug2('Setting viewport', firstRow, lastRow);
    table.setViewport(firstRow, lastRow, columns);
  }, [columns, table, firstRow, lastRow]);

  const handleUpdate = useCallback(
    ({ detail }) => {
      if (!columns) {
        log.error('Columns not initialized.');
        return;
      }
      const viewportData = columns.map(column =>
        (detail.rows as Row[]).map(r => r.get(column))
      );
      setData(viewportData);
    },
    [columns]
  );

  const handleDisconnect = useCallback(() => {
    setTableError(new TableDisconnectError('Table disconnected'));
  }, []);

  const handleReconnect = useCallback(() => {
    setTableError(null);
  }, []);

  useTableListener(table, dh.Table.EVENT_UPDATED, handleUpdate);
  useTableListener(table, dh.Table.EVENT_DISCONNECT, handleDisconnect);
  useTableListener(table, dh.Table.EVENT_RECONNECT, handleReconnect);

  return { columns, data, error: tableError ?? columnError };
};

export default useTable;
