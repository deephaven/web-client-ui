import { ListData } from '@react-stately/data';
import clamp from 'lodash.clamp';
import type { Column, Row, Table, TreeTable } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

export interface KeyedItem<T> {
  key: string;
  item?: T;
}

export type OnTableUpdatedEvent = CustomEvent<{
  offset: number;
  columns: Column[];
  rows: ViewportRow[];
}>;

export type RowDeserializer<T> = (row: ViewportRow, columns: Column[]) => T;

export type ViewportRow = Row & { offsetInSnapshot: number };

const log = Log.module('ViewportDataUtils');

/**
 * Create a unique string key for a row based on its ordinal position in its
 * source table. This is calculated based on it's offset in the viewport
 * (row.offsetInSnapshot) + the offset of the snapshot.
 * @param row Row from a Table update event.
 * @param offset Offset of the current viewport.
 * @returns Unique string key for the oridinal position of the given row.
 */
export function createKeyFromOffsetRow(row: ViewportRow, offset: number) {
  return String(row.offsetInSnapshot + offset);
}

/**
 * Creates a handler function for a `dh.Table.EVENT_UPDATED` event. Rows that
 * get passed to the handler will be added to or updated in the given
 * `viewportData` object.
 * @param viewportData State object for managing a list of KeyedItem data.
 * @param deserializeRow Converts a DH Row to an item object.
 * @returns Handler function for a `dh.Table.EVENT_UPDATED` event.
 */
export function createOnTableUpdatedHandler<T>(
  viewportData: ListData<KeyedItem<T>>,
  deserializeRow: RowDeserializer<T>
): (event: OnTableUpdatedEvent) => void {
  /**
   * Handler for a `dh.Table.EVENT_UPDATED` event.
   */
  return function onTableUpdated(event: OnTableUpdatedEvent) {
    const { columns, offset, rows } = event.detail;

    log.debug('table updated', event.detail);

    rows.forEach(row => {
      const item = deserializeRow(row, columns);

      const keyedItem = {
        key: createKeyFromOffsetRow(row, offset),
        item,
      };

      if (viewportData.getItem(keyedItem.key) != null) {
        viewportData.update(keyedItem.key, keyedItem);
      } else {
        viewportData.append(keyedItem);
      }
    });
  };
}

/**
 * Maps a Row to a key / value object. Keys are mapped ver batim from column
 * names.
 * @param row Row to map to an item.
 * @param columns Columns to map.
 * @returns A key / value object for the row.
 */
export function defaultRowDeserializer<T>(
  row: ViewportRow,
  columns: Column[]
): T {
  return columns.reduce((result, col) => {
    // eslint-disable-next-line no-param-reassign
    result[col.name as keyof T] = row.get(col);
    return result;
  }, {} as T);
}

/**
 * For windowing to work, the underlying list needs to maintain a KeyedItem for
 * each row in the backing table (even if these rows haven't been loaded yet).
 * This is needed internally by react-spectrum so it can calculate the content
 * area size. This generator can create a range of empty `KeyedItem` objects.
 * @param start The starting index to generate
 * @param end The ending index to generate
 */
export function* generateEmptyKeyedItems<T>(
  start: number,
  end: number
): Generator<KeyedItem<T>, void, unknown> {
  // eslint-disable-next-line no-plusplus
  for (let i = start; i <= end; ++i) {
    yield { key: String(i) };
  }
}

/**
 * Get items from a given ListData by a list of keys.
 * @param listData ListData to get items from
 * @param keys Keys to items to be retrieved
 * @returns An array of items matching the given keys
 */
export function getItemsFromListData<T>(
  listData: ListData<KeyedItem<T>>,
  ...keys: string[]
): KeyedItem<T>[] {
  return keys.map(key => listData.getItem(key));
}

/**
 * Check a Table to see if it is closed before checking its size property. This
 * is important because calling Table.size on a closed table throws an error. If
 * the table is null or closed, return zero. Otherwise, return the current size.
 * @param table The table to check for its size.
 * @returns The size of the table or zero if the table is null or closed.
 */
export function getSize(table?: Table | TreeTable | null): number {
  return table == null || isClosed(table) ? 0 : table.size;
}

/**
 * Check if a given table is closed. Tree tables don't have an `isClosed` prop,
 * so will always return false.
 * @param table The table to check if it is closed.
 */
export function isClosed(table: Table | TreeTable): boolean {
  if ('isClosed' in table) {
    return table.isClosed;
  }

  return false;
}

/**
 * Determine the first and last row index for a viewport + extra leading and
 * trailing padding. Values will be "clamped" to stay within the table size.
 * @param firstRow Starting row index for the viewport.
 * @param viewportSize Size of the viewport.
 * @param padding Extra rows to add to the viewport. Will be used for leading
 * and trailing rows.
 * @param tableSize Total table size.
 * @returns Tuple containing indices for the first and last row.
 */
export function padFirstAndLastRow(
  firstRow: number,
  viewportSize: number,
  padding: number,
  tableSize: number
): [number, number] {
  const lastRow = firstRow + viewportSize - 1;
  const [min, max] = [0, tableSize - 1];

  const first = clamp(firstRow - padding, min, max);
  const last = clamp(lastRow + padding, min, max);

  return [first, last];
}
