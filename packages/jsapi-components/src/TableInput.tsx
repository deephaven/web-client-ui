import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import classNames from 'classnames';
import {
  LoadingOverlay,
  SearchInput,
  SelectValueList,
} from '@deephaven/components';
import type { LongWrapper, Table } from '@deephaven/jsapi-types';
import { PromiseUtils } from '@deephaven/utils';
import Log from '@deephaven/log';
import { Formatter, FormatterUtils, Settings } from '@deephaven/jsapi-utils';
import useTableColumn from './useTableColumn';

import './TableInput.scss';

const log = Log.module('TableInput');

type Value = LongWrapper | string;

interface SelectValueItem {
  displayValue: string;
  value: Value;
  isSelected: boolean;
}

interface TableInputProps {
  className?: string;
  columnName: string;
  settings: Settings;
  defaultValue: Value[];
  isInvalid?: boolean;
  table: Promise<Table>;
  onChange(items: Value[]): void;
  onBlur?: () => void;
}

const SIZE_LIMIT = 250;

function TableInput(props: TableInputProps): JSX.Element {
  const {
    className = undefined,
    columnName,
    settings,
    defaultValue = [],
    isInvalid = false,
    onChange = () => false,
    onBlur = () => false,
    table: tablePromise,
  } = props;
  const parentRef = useRef<HTMLDivElement>(null);
  const formatter = useMemo(() => {
    const columnFormats = FormatterUtils.getColumnFormats(settings);
    const dateTimeFormatterOptions = FormatterUtils.getDateTimeFormatterOptions(
      settings
    );
    const {
      defaultDecimalFormatOptions = {},
      defaultIntegerFormatOptions = {},
    } = settings;
    return new Formatter(
      columnFormats,
      dateTimeFormatterOptions,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions
    );
  }, [settings]);
  const [searchValue, setSearchValue] = useState('');
  const [selection, setSelection] = useState(new Set(defaultValue));
  const [table, setTable] = useState<Table | undefined>();
  const listRef = useRef<SelectValueList<Value>>(null);

  const itemCount = Math.min(table?.size ?? 0, SIZE_LIMIT);

  const { column, data, error } = useTableColumn(
    table,
    0,
    SIZE_LIMIT - 1,
    columnName
  );

  const formatValue = useCallback(
    value =>
      column
        ? formatter.getFormattedString(value, column.type, column.name)
        : `${value}`,
    [column, formatter]
  );

  const [items, updatedSelection] = useMemo(() => {
    const removedItems = new Set(selection);
    const result: SelectValueItem[] = [];
    if (data == null) {
      // Viewport not initialized
      return [result, null];
    }
    (data as Value[]).forEach(v => {
      const value = `${v}`;
      const isSelected = selection.has(value);
      if (isSelected) {
        removedItems.delete(value);
      }
      result.push({
        value,
        displayValue: formatValue(v),
        isSelected,
      });
    });

    if (removedItems.size > 0) {
      log.debug2('Selection has items that are missing from the viewport');
      const newSelection = new Set(selection);
      Array.from(removedItems).forEach(value => {
        newSelection.delete(value);
      });
      return [result, newSelection];
    }
    return [result, null];
  }, [data, selection, formatValue]);

  useEffect(() => {
    if (updatedSelection !== null) {
      setSelection(updatedSelection);
      onChange(Array.from(updatedSelection));
    }
  }, [onChange, updatedSelection]);

  const initTable = useCallback(async promise => {
    try {
      const resolved = await promise;
      log.debug('Table resolved', resolved);
      setTable(resolved);
    } catch (e) {
      if (PromiseUtils.isCanceled(e)) {
        return;
      }
      log.error(e);
    }
  }, []);

  useEffect(() => {
    const cancelablePromise = PromiseUtils.makeCancelable(tablePromise);
    initTable(cancelablePromise);
    return () => {
      log.debug2('Cancel table promise');
      cancelablePromise.cancel();
    };
  }, [tablePromise, initTable]);

  // Scroll the item matching the input into view
  const handleSearchChange = useCallback(
    e => {
      const { value } = e.target;
      setSearchValue(value);
      const index = items.findIndex(item => item.displayValue.includes(value));
      if (index > -1) {
        log.debug2(`Found ${value} at index ${index}`);
        listRef.current?.scrollIntoView(index);
      } else {
        log.debug2(`${value} not found`);
      }
    },
    [items, listRef]
  );

  const handleSelect = useCallback(
    index => {
      log.debug('handleSelect', index);
      if (index >= items.length) {
        log.error('Invalid index', index);
        return;
      }
      const selectedValue = items[index].value;
      const newSelection = new Set(selection);
      if (items[index].isSelected) {
        newSelection.delete(selectedValue);
      } else {
        newSelection.add(selectedValue);
      }
      setSelection(newSelection);
      onChange(Array.from(newSelection));
    },
    [onChange, items, selection]
  );

  const handleSelectAll = useCallback(() => {
    const values = items.map(item => item.value);
    const newSelection = new Set(values);
    setSelection(newSelection);
    onChange(values);
  }, [items, onChange]);

  const handleClearSelection = useCallback(() => {
    setSelection(new Set());
    onChange([]);
  }, [onChange]);

  const handleViewportChange = useCallback(() => {
    // no-op
  }, []);

  const handleChildBlur = useCallback(
    (e: React.FocusEvent<Element>) => {
      const { relatedTarget } = e;
      log.debug(
        'handleChildBlur',
        relatedTarget,
        relatedTarget instanceof HTMLElement,
        parentRef.current,
        parentRef.current?.contains(relatedTarget)
      );
      if (
        !relatedTarget ||
        (parentRef.current &&
          relatedTarget instanceof HTMLElement &&
          !parentRef.current.contains(relatedTarget))
      ) {
        onBlur();
      }
    },
    [onBlur]
  );

  const isEmpty = items.length === 0;

  return (
    <div
      ref={parentRef}
      className={classNames(
        'table-input-container d-flex flex-column position-relative',
        className
      )}
    >
      <SearchInput
        disabled={!!error || isEmpty}
        value={searchValue}
        placeholder="Search"
        onChange={handleSearchChange}
        className="mb-2 d-flex"
        onBlur={handleChildBlur}
      />
      <SelectValueList
        className="table-input-list"
        disabled={table === undefined || isEmpty}
        isInvalid={isInvalid}
        items={isEmpty ? [{ value: 'Empty', isSelected: false }] : items}
        itemCount={itemCount}
        offset={0}
        onSelect={handleSelect}
        onViewportChange={handleViewportChange}
        ref={listRef}
        onBlur={handleChildBlur}
      />

      {table && (
        <div className="meta-row">
          <div className="d-flex align-items-center text-muted small">
            {table != null && table.size > itemCount && (
              <>Table is too large, showing the first {SIZE_LIMIT} items.</>
            )}
          </div>
          <div>
            <button
              type="button"
              className="btn btn-link"
              onBlur={handleChildBlur}
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn btn-link mr-a"
              onBlur={handleChildBlur}
              onClick={handleClearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {table == null ||
        (error && (
          <div className="h-100 w-100 position-absolute">
            <LoadingOverlay
              isLoaded={table != null}
              isLoading={table == null && error == null}
              errorMessage={error?.message ?? null}
            />
          </div>
        ))}
    </div>
  );
}

TableInput.displayName = 'TableInput';

TableInput.defaultProps = {
  isInvalid: false,
  className: undefined,
};

export default TableInput;
