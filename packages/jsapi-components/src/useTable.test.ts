import { renderHook, act } from '@testing-library/react-hooks';
import type { Column } from '@deephaven/jsapi-shim';
import dh from '@deephaven/jsapi-shim';
import ColumnNameError from './ColumnNameError';
import TableDisconnectError from './TableDisconnectError';

import useTable from './useTable';

function makeColumns(count = 5) {
  const columns: Column[] = [];

  for (let i = 0; i < count; i += 1) {
    const column = new dh.Column({ index: i, name: `${i}` });
    columns.push(column);
  }

  return columns;
}

function makeTable(count?: number) {
  return new dh.Table({ columns: makeColumns(count) });
}

describe('useTable', () => {
  it('accepts undefined table argument', () => {
    const { result } = renderHook(() => useTable(undefined, 0, 0));
    expect(result.current).toEqual(
      expect.objectContaining({
        columns: undefined,
        data: [],
        error: null,
      })
    );
  });

  it('returns all columns for undefined columnNames', () => {
    const table = makeTable(3);
    const { result } = renderHook(() => useTable(table, 0, 0));
    expect(result.current).toEqual(
      expect.objectContaining({
        columns: expect.objectContaining({ length: 3 }),
        data: [],
        error: null,
      })
    );
  });

  it('calls setViewport once on init', () => {
    let table;
    const { result, rerender } = renderHook(() => useTable(table, 0, 10));
    expect(result.current).toEqual(expect.objectContaining({ data: [] }));
    table = makeTable(3);
    table.setViewport = jest.fn();
    rerender();
    expect(table.setViewport).toBeCalledTimes(1);
    expect(table.setViewport).toBeCalledWith(
      0,
      10,
      expect.objectContaining({ length: 3 })
    );
  });

  it('calls setViewport on viewport change', () => {
    const table = makeTable(3);
    table.setViewport = jest.fn();
    let top = 0;
    let bottom = 10;
    let columnNames;
    const { rerender } = renderHook(() =>
      useTable(table, top, bottom, columnNames)
    );
    expect(table.setViewport).toBeCalledTimes(1);
    top = 20;
    bottom = 30;
    rerender();
    expect(table.setViewport).toBeCalledTimes(2);
    expect(table.setViewport.mock.calls[1]).toEqual(
      expect.arrayContaining([20, 30, expect.any(Array)])
    );
    rerender();
    expect(table.setViewport).toBeCalledTimes(2);
    columnNames = ['1'];
    rerender();
    expect(table.setViewport).toBeCalledTimes(3);
  });

  it('returns ColumnNameError for non-existing column names', () => {
    const table = makeTable(3);
    let columnNames = ['DOES_NOT_EXIST'];
    const { result, rerender } = renderHook(() =>
      useTable(table, 0, 0, columnNames)
    );
    expect(result.current.error).toBeInstanceOf(ColumnNameError);
    columnNames = ['1'];
    rerender();
    expect(result.current.error).toBeNull();
  });

  it('returns TableDisconnectError for disconnected table', () => {
    const table = makeTable(3);
    const columnNames = ['1'];
    const { result } = renderHook(() => useTable(table, 0, 0, columnNames));
    act(() => {
      table.fireEvent(dh.Table.EVENT_DISCONNECT);
    });
    expect(result.current.error).toBeInstanceOf(TableDisconnectError);
    act(() => {
      table.fireEvent(dh.Table.EVENT_RECONNECT);
    });
    expect(result.current.error).toBeNull();
  });

  it("change to an existing column doesn't reset the TableDisconnectError", () => {
    const table = makeTable(3);
    let columnNames = ['1'];
    const { result, rerender } = renderHook(() =>
      useTable(table, 0, 0, columnNames)
    );
    act(() => {
      table.fireEvent(dh.Table.EVENT_DISCONNECT);
    });
    expect(result.current.error).toBeInstanceOf(TableDisconnectError);
    columnNames = ['2'];
    rerender();
    expect(result.current.error).toBeInstanceOf(TableDisconnectError);
    act(() => {
      table.fireEvent(dh.Table.EVENT_RECONNECT);
    });
    expect(result.current.error).toBeNull();
  });

  it("change to a non-existing column doesn't reset the TableDisconnectError", () => {
    const table = makeTable(3);
    let columnNames = ['1'];
    const { result, rerender } = renderHook(() =>
      useTable(table, 0, 0, columnNames)
    );
    act(() => {
      table.fireEvent(dh.Table.EVENT_DISCONNECT);
    });
    expect(result.current.error).toBeInstanceOf(TableDisconnectError);
    columnNames = ['DOES_NOT_EXIST'];
    rerender();
    expect(result.current.error).toBeInstanceOf(TableDisconnectError);
    act(() => {
      table.fireEvent(dh.Table.EVENT_RECONNECT);
    });
    expect(result.current.error).toBeInstanceOf(ColumnNameError);
  });
});
