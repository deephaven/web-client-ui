import { useCallback, useState } from 'react';
import type { Table } from '@deephaven/jsapi-types';
import { useDebouncedValue, usePromiseFactory } from '@deephaven/react-hooks';
import useTableUtils from './useTableUtils';

export interface CheckIfExistsValue {
  /** Current trimmed value */
  valueTrimmed: string;

  /** Debounced trimmed value */
  valueTrimmedDebounced: string;

  /**
   * Whether the value exists in the given table columns. Will be null whenever
   * the value changes until the next check is complete.
   */
  valueExists: boolean | null;

  /** Trims and updates the value */
  trimAndUpdateValue: (value: string) => void;
}

/**
 * Manage a trimmed text value and check if it exists in a list of table columns.
 * @param table The table to check for the value
 * @param columnNames The column names to check
 * @param debounceMs Debounce timer for re-checking the value
 * @param isCaseSensitive Whether the value check is case sensitive
 */
export function useCheckIfExistsValue(
  table: Table | null | undefined,
  columnNames: string | string[],
  debounceMs: number,
  isCaseSensitive: boolean
): CheckIfExistsValue {
  const tableUtils = useTableUtils();

  const [valueTrimmed, setValueTrimmed] = useState('');
  const valueTrimmedDebounced = useDebouncedValue(valueTrimmed, debounceMs);

  const trimAndUpdateValue = useCallback((text: string) => {
    setValueTrimmed(text.trim());
  }, []);

  const { data: valueExistsData, isLoading: valueExistsIsLoading } =
    usePromiseFactory(tableUtils.doesColumnValueExist, [
      table,
      columnNames,
      valueTrimmedDebounced,
      isCaseSensitive,
    ]);

  // If value check is loading or if debounce hasn't settled, set
  // `matchesExistingValue` to null since it is indeterminate
  const valueExists =
    valueExistsIsLoading || valueTrimmed !== valueTrimmedDebounced
      ? null
      : valueExistsData;

  return {
    valueTrimmed,
    valueTrimmedDebounced,
    valueExists,
    trimAndUpdateValue,
  };
}

export default useCheckIfExistsValue;
