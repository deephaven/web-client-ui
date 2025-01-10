import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Option, Select } from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { EMPTY_ARRAY } from '@deephaven/utils';

type JavaObject = {
  equals: (other: unknown) => boolean;
};

function isJavaObject(value: unknown): value is JavaObject {
  return (
    typeof value === 'object' &&
    value != null &&
    'equals' in value &&
    typeof value.equals === 'function'
  );
}

function defaultFormatValue(value: unknown): string {
  return `${value}`;
}

export type TableDropdownProps = {
  /** Table to use as the source of data. Does not own the table, does not close it on unmount. */
  table?: DhType.Table;

  /** Column to read data from the table. Defaults to the first column in the table if it's not provided. */
  column?: DhType.Column;

  /** Triggered when the dropdown selection has changed */
  onChange: (value: unknown) => void;

  /** Filter to apply on the table */
  filter?: readonly DhType.FilterCondition[];

  /** The currently selected value */
  selectedValue?: unknown;

  /** Whether the control is disabled */
  disabled?: boolean;

  /** Class to apply to the select element */
  className?: string;

  /** Optional function to format the value for display */
  formatValue?: (value: unknown) => string;

  /** Maximum number of elements to load */
  maxSize?: number;
};

/**
 * Dropdown that displays the values of a column in a table.
 */
export function TableDropdown({
  column,
  table,
  filter = EMPTY_ARRAY,
  onChange,
  selectedValue,
  disabled,
  className,
  formatValue = defaultFormatValue,
  maxSize = 1000,
}: TableDropdownProps): JSX.Element {
  const dh = useApi();
  const [values, setValues] = useState<unknown[]>([]);

  useEffect(() => {
    if (table == null) {
      setValues([]);
      return undefined;
    }

    const tableColumn = column ?? table.columns[0];
    // Need to set a viewport on the table and start listening to get the values to populate the dropdown
    table.applyFilter(filter as DhType.FilterCondition[]);
    const subscription = table.setViewport(0, maxSize, [tableColumn]);

    subscription.addEventListener(
      dh.Table.EVENT_UPDATED,
      (event: DhType.Event<DhType.ViewportData>) => {
        const { detail } = event;
        // Core JSAPI returns undefined for null table values,
        // coalesce with null to differentiate null from no selection in the dropdown
        // https://github.com/deephaven/deephaven-core/issues/5400
        const newValues = detail.rows.map(row => row.get(tableColumn) ?? null);
        setValues(newValues);
      }
    );

    return () => {
      subscription.close();
    };
  }, [column, dh, filter, maxSize, table]);

  // If the selected value is undefined, add a placeholder item
  const allValues = useMemo(() => {
    if (selectedValue === undefined) {
      return [undefined, ...values];
    }
    return values;
  }, [selectedValue, values]);

  // Since values could be anything, not just strings, track the selected index based on the current data
  const selectedIndex = useMemo(
    // eslint-disable-next-line eqeqeq
    () =>
      allValues.findIndex(
        value =>
          value === selectedValue ||
          (isJavaObject(value) && value.equals(selectedValue))
      ),
    [selectedValue, allValues]
  );

  const handleChange = useCallback(
    newSelectedIndex => {
      onChange(allValues[newSelectedIndex]);
    },
    [onChange, allValues]
  );

  return (
    <Select
      className={className}
      value={selectedIndex}
      onChange={handleChange}
      disabled={disabled}
    >
      {allValues.map((value, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Option key={`${i}`} value={i}>
          {formatValue(value)}
        </Option>
      ))}
    </Select>
  );
}

export default TableDropdown;
