import type { dh as DhType, Iterator } from '@deephaven/jsapi-types';

export const KEY_TABLE_PIVOT_COLUMN = '__PIVOT_COLUMN';

export const PIVOT_COLUMN_PREFIX = 'PIVOT_C_';

export const TOTALS_COLUMN = '__TOTALS_COLUMN';

export interface SimplePivotSchema {
  columnColNames: string[];
  rowColNames: string[];
  hasTotals: boolean;
  pivotDescription: string;
}

export type KeyColumnArray = (readonly [string, string])[];

export type SimplePivotColumnMap = ReadonlyMap<string, string>;

export interface KeyTableSubscriptionData {
  fullIndex: { iterator: () => Iterator<DhType.Row> };
  getData: (rowKey: DhType.Row, column: DhType.Column) => string;
}

export function getSimplePivotColumnMap(
  data: KeyTableSubscriptionData,
  columns: DhType.Column[],
  pivotIdColumn: DhType.Column
): KeyColumnArray {
  const columnMap: KeyColumnArray = [];
  const rowIter = data.fullIndex.iterator();
  while (rowIter.hasNext()) {
    const rowKey = rowIter.next().value;
    const value = [];
    for (let i = 0; i < columns.length; i += 1) {
      value.push(data.getData(rowKey, columns[i]));
    }
    columnMap.push([
      `${PIVOT_COLUMN_PREFIX}${data.getData(rowKey, pivotIdColumn)}`,
      value.join(', '),
    ]);
  }
  return columnMap;
}
