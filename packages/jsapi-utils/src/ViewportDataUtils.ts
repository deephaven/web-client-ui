import { ListData } from '@adobe/react-spectrum';
import { Column, Row, Table, TreeTable } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';

export interface KeyedItem<T> {
  key: string;
  item?: T;
}

export type OnTableUpdatedEvent = CustomEvent<{
  offset: number;
  rows: ViewportRow[];
}>;

export type ViewportRow = Row & { offsetInSnapshot: number };

export type RowDeserializer<T> = (row: ViewportRow, columns: Column[]) => T;

const log = Log.module('ViewportDataUtils');

export function createOnTableUpdatedHandler<T>(
  table: Table | TreeTable | null,
  viewport: ListData<KeyedItem<T>>,
  deserializeRow: RowDeserializer<T>
) {
  return function onTableUpdated(event: OnTableUpdatedEvent) {
    if (table == null) {
      return;
    }

    const { offset, rows } = event.detail;

    log.debug('table updated', event.detail);

    rows.forEach(row => {
      const keyedItem = createKeyedItemFromRow(
        table.columns,
        row,
        offset,
        deserializeRow
      );

      if (viewport.getItem(keyedItem.key) != null) {
        viewport.update(keyedItem.key, keyedItem);
      } else {
        viewport.append(keyedItem);
      }
    });
  };
}

export function padFirstAndLastRow(
  firstRow: number,
  viewportSize: number,
  padding: number
): [number, number] {
  const firstRowAdjusted = Math.max(0, firstRow - padding);
  const lastRow = firstRowAdjusted + viewportSize + padding - 1;
  return [firstRowAdjusted, lastRow];
}

/**
 * For windowing to work, the underlying list needs to have the full number
 * of items. This is needed internally by react-spectrum so it can calculate
 * the content area size. This generator can create a range of minimal
 * `KeyedItem` objects.
 * @param count The number of items to generate
 */
export function* generateEmptyKeyedItems<T>(
  count: number
): Generator<KeyedItem<T>, void, unknown> {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < count; ++i) {
    yield { key: String(i) };
  }
}

/**
 * Check a Table to see if it is closed before checking its size property. This
 * is because calling Table.size on a closed table throws an error. If the table
 * is null or closed, return zero. Otherwise, return the current size.
 * @param table The table to check for its size.
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

export function createKeyedItemFromRow<T>(
  columns: Column[],
  row: ViewportRow,
  offset: number,
  deserializeRow: RowDeserializer<T>
): KeyedItem<T> {
  const item = deserializeRow(row, columns);
  return { key: String(offset + row.offsetInSnapshot), item };
}

/**
 * Maps a Row to a key / value object. Keys are mapped ver batim from column
 * names.
 * @param row
 * @param columns
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
