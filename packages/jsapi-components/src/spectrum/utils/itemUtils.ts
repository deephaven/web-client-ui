import { type dh } from '@deephaven/jsapi-types';

/**
 * Get the key column if column name is provided, otherwise use the first column.
 * @param table The table to get the key column from
 * @param keyColumnName The name of the column to use for key data
 * @returns DH Column containing the key values
 */
export function getItemKeyColumn(
  table: dh.Table,
  keyColumnName?: string
): dh.Column {
  return keyColumnName == null
    ? table.columns[0]
    : table.findColumn(keyColumnName);
}

/**
 * Get the label column if column name is provided, otherwise use the key column.
 * @param table The table to get the label column from
 * @param keyColumn The key column to fallback to if the label column name is not provided
 * @param labelColumnName The name of the column to use for label data
 * @returns DH Column containing the label values
 */
export function getItemLabelColumn(
  table: dh.Table,
  keyColumn: dh.Column,
  labelColumnName?: string
): dh.Column {
  return labelColumnName == null
    ? keyColumn
    : table.findColumn(labelColumnName);
}
