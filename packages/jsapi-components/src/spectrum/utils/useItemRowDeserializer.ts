import { useCallback, useMemo } from 'react';
import { NormalizedItemData } from '@deephaven/components';
import { dh } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
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
  table?: dh.Table | null;
  descriptionColumnName?: string;
  iconColumnName?: string;
  keyColumnName?: string;
  labelColumnName?: string;
  formatValue?: (value: unknown, columnType: string) => string;
}): (row: dh.Row) => NormalizedItemData {
  const keyColumn = useMemo(
    () => (table == null ? null : getItemKeyColumn(table, keyColumnName)),
    [keyColumnName, table]
  );

  const labelColumn = useMemo(
    () =>
      table == null || keyColumn == null
        ? null
        : getItemLabelColumn(table, keyColumn, labelColumnName),
    [keyColumn, labelColumnName, table]
  );

  const descriptionColumn = useMemo(
    () =>
      table == null || descriptionColumnName == null
        ? null
        : table.findColumn(descriptionColumnName),
    [descriptionColumnName, table]
  );

  const iconColumn = useMemo(
    () =>
      table == null || iconColumnName == null
        ? null
        : table.findColumn(iconColumnName),
    [iconColumnName, table]
  );

  const deserializeRow = useCallback(
    (row: dh.Row): NormalizedItemData => {
      // `deserializeRow` can be created on a null `table` which results in null
      // `keyColumn` + `labelColumn`, but it should never actually be called.
      // The assumption is that the `table` will eventually be non-null,
      // `deserializeRow` will be recreated, and then applied to the non-null
      // table.
      assertNotNull(keyColumn, 'keyColumn cannot be null.');
      assertNotNull(labelColumn, 'labelColumn cannot be null.');

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
