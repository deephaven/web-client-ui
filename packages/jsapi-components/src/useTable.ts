import { useCallback, useEffect, useMemo, useState } from 'react';
import { Column, Row, Table } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import useTableListener from './useTableListener';

const log = Log.module('useTable');

const useTable = (
  table: Table | undefined,
  columnNames: string[],
  firstRow: number,
  lastRow: number
): {
  columns: Column[] | undefined;
  data: unknown[][];
  error: Error | null;
  setViewport: (viewport: [number, number]) => void;
} => {
  const [data, setData] = useState<unknown[][]>([]);
  const [viewport, setViewport] = useState([firstRow, lastRow]);
  const [error, setError] = useState<Error | null>(null);

  const columns = useMemo(() => {
    try {
      return table?.findColumns(columnNames);
    } catch (e) {
      log.error(`Column not found`, e, columnNames);
      setError(new Error('Invalid columnNames argument'));
    }
  }, [table, columnNames]);

  useEffect(() => {
    if (!columns || !table) {
      log.debug2('Table or column not initialized, skip viewport update.');
      return;
    }
    log.debug2('Setting viewport', viewport);
    table.setViewport(viewport[0], viewport[1], columns);
  }, [columns, table, viewport]);

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
    setError(new Error('Table disconnected'));
  }, []);

  const handleReconnect = useCallback(() => {
    setError(null);
  }, []);

  useTableListener(table, dh.Table.EVENT_UPDATED, handleUpdate);
  useTableListener(table, dh.Table.EVENT_DISCONNECT, handleDisconnect);
  useTableListener(table, dh.Table.EVENT_RECONNECT, handleReconnect);

  return { columns, data, error, setViewport };
};

export default useTable;
