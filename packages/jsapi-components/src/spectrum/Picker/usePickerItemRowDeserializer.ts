import { useCallback, useMemo } from 'react';
import { NormalizedPickerItemData } from '@deephaven/components';
import { dh } from '@deephaven/jsapi-types';
import { getPickerKeyColumn, getPickerLabelColumn } from './PickerUtils';

function formatValue(value: unknown): string | number | boolean {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  // TODO: #1889 Add better support for different data types.
  return String(value);
}

/**
 * Returns a function that deserializes a row into a normalized picker item data
 * object.
 * @param table The table to get the key and label columns from
 * @param keyColumnName The name of the column to use for key data
 * @param labelColumnName The name of the column to use for label data
 * @returns A function that deserializes a row into a normalized picker item
 * data object
 */
export function usePickerItemRowDeserializer({
  table,
  keyColumnName,
  labelColumnName,
}: {
  table: dh.Table;
  keyColumnName?: string;
  labelColumnName?: string;
}): (row: dh.Row) => NormalizedPickerItemData {
  const keyColumn = useMemo(
    () => getPickerKeyColumn(table, keyColumnName),
    [keyColumnName, table]
  );

  const labelColumn = useMemo(
    () => getPickerLabelColumn(table, keyColumn, labelColumnName),
    [keyColumn, labelColumnName, table]
  );

  const deserializeRow = useCallback(
    (row: dh.Row): NormalizedPickerItemData => {
      const key = formatValue(row.get(keyColumn));
      const content = formatValue(row.get(labelColumn));

      return {
        key,
        content,
      };
    },
    [keyColumn, labelColumn]
  );

  return deserializeRow;
}

export default usePickerItemRowDeserializer;
