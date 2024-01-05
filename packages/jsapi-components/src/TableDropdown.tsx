import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Option, Select } from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  Column,
  FilterCondition,
  Table,
  ViewportData,
} from '@deephaven/jsapi-types';

function defaultFormatValue(value: unknown): string {
  return `${value}`;
}

export type TableDropdownProps = {
  /** Table to use as the source of data. Does not own the table, does not close it on unmount. */
  table?: Table;

  /** Column to read data from the table */
  column: Column;

  /** Triggered when the dropdown selection has changed */
  onChange: (value: unknown) => void;

  /** Filter to apply on the table */
  filter?: FilterCondition[];

  /** The currently selected value */
  selectedValue?: unknown;

  /** Whether the control is disabled */
  disabled?: boolean;

  /** Class to apply to the select element */
  className?: string;

  /** Optional function to format the value for display */
  formatValue?: (value: unknown) => string;
};

/**
 * Dropdown that displays the values of a column in a table.
 */
export function TableDropdown({
  column,
  table,
  filter = [],
  onChange,
  selectedValue,
  disabled,
  className,
  formatValue = defaultFormatValue,
}: TableDropdownProps): JSX.Element {
  const dh = useApi();
  const [values, setValues] = useState<unknown[]>([]);

  useEffect(() => {
    if (table == null) {
      setValues([]);
      return undefined;
    }

    // Need to set a viewport on the table and start listening to get the values to populate the dropdown
    table.applyFilter(filter);
    const subscription = table.setViewport(0, Number.MAX_SAFE_INTEGER - 5, [
      column,
    ]);

    subscription.addEventListener(
      dh.Table.EVENT_UPDATED,
      (event: CustomEvent<ViewportData>) => {
        const { detail } = event;
        const newValues = detail.rows.map(row => row.get(column));
        setValues(newValues);
      }
    );

    return () => {
      subscription.close();
    };
  }, [column, dh, filter, table]);

  // If the selected value is undefined, add a placeholder item
  const allValues = useMemo(() => {
    if (selectedValue === undefined) {
      return [undefined, ...values];
    }
    return values;
  }, [selectedValue, values]);

  // Since values could be anything, not just strings, track the selected index based on the current data
  const selectedIndex = useMemo(
    () => allValues.findIndex(value => value === selectedValue),
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
