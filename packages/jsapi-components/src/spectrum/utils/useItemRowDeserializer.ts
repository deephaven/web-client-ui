import { useCallback, useMemo } from 'react';
import { NormalizedItemData } from '@deephaven/components';
import { dh } from '@deephaven/jsapi-types';
import { getItemKeyColumn, getItemLabelColumn } from './itemUtils';

function defaultFormatKey(value: unknown): string | number | boolean {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return String(value);
}

function defaultFormatValue(value: unknown, _columnType: string): string {
  return String(value);
}

/**
 * Returns a function that deserializes a row into a normalized item data object.
 * @param table The table to get the key and label columns from
 * @param descriptionColumnName The name of the column to use for description data
 * @param iconColumnName The name of the column to use for icon data
 * @param keyColumnName The name of the column to use for key data
 * @param labelColumnName The name of the column to use for label data
 * @param formatValue Optional function to format the label value
 * @returns A function that deserializes a row into a normalized item data object
 */
export function useItemRowDeserializer({
  table,
  descriptionColumnName,
  iconColumnName,
  keyColumnName,
  labelColumnName,
  formatValue = defaultFormatValue,
}: {
  table: dh.Table;
  descriptionColumnName?: string;
  iconColumnName?: string;
  keyColumnName?: string;
  labelColumnName?: string;
  formatValue?: (value: unknown, columnType: string) => string;
}): (row: dh.Row) => NormalizedItemData {
  const keyColumn = useMemo(
    () => getItemKeyColumn(table, keyColumnName),
    [keyColumnName, table]
  );

  const labelColumn = useMemo(
    () => getItemLabelColumn(table, keyColumn, labelColumnName),
    [keyColumn, labelColumnName, table]
  );

  const descriptionColumn = useMemo(
    () =>
      descriptionColumnName == null
        ? null
        : table.findColumn(descriptionColumnName),
    [descriptionColumnName, table]
  );

  const iconColumn = useMemo(
    () => (iconColumnName == null ? null : table.findColumn(iconColumnName)),
    [iconColumnName, table]
  );

  const deserializeRow = useCallback(
    (row: dh.Row): NormalizedItemData => {
      const key = defaultFormatKey(row.get(keyColumn));
      const content = formatValue(row.get(labelColumn), labelColumn.type);

      const description =
        descriptionColumn == null
          ? undefined
          : formatValue(row.get(descriptionColumn), descriptionColumn.type);

      const icon = iconColumn == null ? undefined : row.get(iconColumn);

      return {
        key,
        content,
        textValue: content,
        description,
        icon,
      };
    },
    [descriptionColumn, formatValue, iconColumn, keyColumn, labelColumn]
  );

  return deserializeRow;
}

export default useItemRowDeserializer;
