import type { Key } from 'react';
import type { Selection } from '@react-types/shared';
import type {
  Column,
  FilterCondition,
  Table,
  TreeTable,
} from '@deephaven/jsapi-types';
import {
  generateRange,
  KeyedItem,
  SelectionMaybeInverted,
  SelectionT,
} from '@deephaven/utils';
import TableUtils from './TableUtils';

export interface FilterConditionFactory {
  (table: Table | TreeTable | null | undefined): FilterCondition | null;
}

/**
 * Create args for a filter derived from a combobox selection.
 * @param value
 */
export function createComboboxFilterArgs(
  value: string,
  allValue: string
): {
  operator: 'eq' | 'notEq';
  value: string;
} {
  return value === allValue
    ? { operator: 'notEq', value: '' } // this is synonymous with "no filter"
    : { operator: 'eq', value };
}

/**
 * Create a filter condition factory for a `contains` filter that matches the
 * given search text.
 * @param tableUtils TableUtils instance to create filter from
 * @param columnNames Names of the columns to filter
 * @param searchText Text to search (will be trimmed of leading / trailing whitespace)
 */
export function createSearchTextFilter(
  tableUtils: TableUtils,
  columnNames: string | string[],
  searchText: string
): FilterConditionFactory {
  /**
   * Creates a filter condition that matches based on search text.
   * @param maybeTable Table to filter
   */
  return function searchTextFilter(
    maybeTable: Table | TreeTable | null | undefined
  ): FilterCondition | null {
    const searchTextTrimmed = searchText.trim();

    if (searchTextTrimmed === '') {
      return null;
    }

    const factory = createFilterConditionFactory(
      columnNames,
      col =>
        col
          .filter()
          .containsIgnoreCase(
            tableUtils.makeFilterValue(col.type, searchTextTrimmed)
          ),
      'or'
    );

    return factory(maybeTable);
  };
}

/**
 * Create a filter condition factory function.
 * @param columnNames Column names that filter conditions will target
 * @param createColumnCondition Function that can create a `FilterCondition` from
 * a given column. This will be run across all columns corresponding to the given
 * list of column names.
 * @param conditionOperator Operator that will be used to combine multiple
 * `FilterConditions` if multiple column names are given.
 */
export function createFilterConditionFactory(
  columnNames: string | string[],
  createColumnCondition: (column: Column) => FilterCondition,
  conditionOperator: 'and' | 'or' = 'or'
): FilterConditionFactory {
  return function filterConditionFactory(
    maybeTable: Table | TreeTable | null | undefined
  ): FilterCondition | null {
    const maybeColumns = maybeTable?.findColumns(
      typeof columnNames === 'string' ? [columnNames] : columnNames
    );

    if (maybeColumns == null || maybeColumns.length === 0) {
      return null;
    }

    const filterConditions = maybeColumns.map(createColumnCondition);

    return filterConditions.reduce((current, next) =>
      current[conditionOperator](next)
    );
  };
}

/**
 * Create a filter condition factory for a filter operator that matches the
 * given value.
 * @param tableUtils TableUtils instance to create filter from
 * @param columnNames Column names to compare value to
 * @param value Value to match
 * @param operator Operator to use for matching
 */
export function createValueFilter(
  tableUtils: TableUtils,
  columnNames: string | string[],
  value: string,
  operator:
    | 'contains'
    | 'containsIgnoreCase'
    | 'eq'
    | 'eqIgnoreCase'
    | 'notEq'
    | 'notEqIgnoreCase'
): FilterConditionFactory {
  /**
   * Creates a filter condition that matches based on matching a given value.
   * @param maybeTable Table to filter
   */
  return createFilterConditionFactory(
    columnNames,
    col => col.filter()[operator](tableUtils.makeFilterValue(col.type, value)),
    'or'
  );
}

/**
 * Create a filter condition factory for a filter that matches a given Selection.
 * If column is not found or selection parameter is 'all', the factory will return
 * null to indicate the results will be unfiltered.
 * @param tableUtils TableUtils instance to create filter from
 * @param columnName The column name to filter
 * @param selection 'all' or an array of values to filter by
 * @param emptySelectionEqAll If true, empty selection means select
 * all. If false, it means select none.
 * @param invertSelection  Invert the selection (eg. All items are selected,
 * then you deselect items)
 */
export function createSelectedValuesFilter<TValue>(
  tableUtils: TableUtils,
  columnName: string,
  selection: SelectionT<TValue>,
  emptySelectionEqAll: boolean,
  invertSelection: boolean
): FilterConditionFactory {
  /**
   * Creates a filter condition that matches rows for selected values. Returns
   * null to indicate no filtering.
   * @param maybeTable the table to filter
   */
  return function selectedValuesFilter(
    maybeTable: Table | TreeTable | null | undefined
  ): FilterCondition | null {
    const maybeColumn = maybeTable?.findColumn(columnName);

    const isAllSelected =
      selection === 'all' || (emptySelectionEqAll && selection.size === 0);

    if (maybeColumn == null || isAllSelected) {
      return null;
    }

    return tableUtils.makeSelectValueFilter(
      maybeColumn,
      [...selection.keys()],
      invertSelection
    );
  };
}

/**
 * Check 2 SelectionT objects for value equality.
 * @param selectionA
 * @param selectionB
 */
export function isSelectionEqual<T>(
  selectionA: SelectionT<T>,
  selectionB: SelectionT<T>
): boolean {
  if (selectionA === selectionB) {
    return true;
  }

  if (selectionA === 'all' || selectionB === 'all') {
    return false;
  }

  if (selectionA.size !== selectionB.size) {
    return false;
  }

  return [...selectionA.keys()].every(key => selectionB.has(key));
}

/**
 * Check 2 `SelectionMaybeInverted` instances for value equality.
 * @param selectionA
 * @param selectionB
 */
export function isSelectionMaybeInvertedEqual<T>(
  selectionA: SelectionMaybeInverted<T>,
  selectionB: SelectionMaybeInverted<T>
): boolean {
  return (
    selectionA.isInverted === selectionB.isInverted &&
    isSelectionEqual(selectionA.selection, selectionB.selection)
  );
}

/**
 * Creates a `notNullOrEmptyFilterCondition` function.
 * @param tableUtils TableUtils instance to use for making filters.
 */
export function createNotNullOrEmptyFilterCondition(tableUtils: TableUtils) {
  /**
   * Returns a filter condition that matches values in a given column that are
   * not null or empty string.
   */
  return function notNullOrEmptyFilterCondition(
    column: Column
  ): FilterCondition {
    return column
      .filter()
      .isNull()
      .not()
      .and(column.filter().notEq(tableUtils.makeFilterValue(column.type, '')));
  };
}

/**
 * Creates a `showOnlyEmptyFilterCondition` function that can be toggled on or
 * off.
 * @param tableUtils TableUtils instance to use for making filters.
 * @param isOn Flag to indicate if the filter should be on or off.
 */
export function createShowOnlyEmptyFilterCondition(
  tableUtils: TableUtils,
  isOn: boolean
) {
  /**
   * Returns a filter condition that matches values in a given column. If the
   * `isOn` param is true, this will filter to only null or empty string values.
   * If `isOn` is false, it will return a filter that matches all values.
   */
  return function showOnlyEmptyFilterCondition(
    column: Column
  ): FilterCondition {
    const filter = column.filter();
    const emptyStringValue = tableUtils.makeFilterValue(column.type, '');
    const eqEmptyStringCondition = filter.eq(emptyStringValue);

    if (isOn) {
      return filter.isNull().or(eqEmptyStringCondition);
    }

    // If filter is off, return a condition that will always be true
    return eqEmptyStringCondition.or(filter.notEq(emptyStringValue));
  };
}

/**
 * Takes a Selection state and determines if there is a more optimal selection
 * that can be used. For example, if the user selects all and then deselects an
 * item, we want to filter by "not that value" instead of equal to all selected
 * values. Similarly, if 'all' items are selected, we want to optimize this as
 * "no filter".
 * @param selection The selection to optimize
 * @param totalRecords The total number of records that can potentially be selected
 */
export function optimizeSelection(
  selection: Selection,
  totalRecords: number
): { selection: Selection; isInverted: boolean } {
  const isInverted = selection === 'all' || selection.size > totalRecords / 2;

  let optimizedSelection = selection;

  if (isInverted) {
    optimizedSelection =
      selection === 'all'
        ? new Set<Key>()
        : new Set<Key>(
            // Create a new set from any key that is not selected
            [...generateRange(0, totalRecords - 1)]
              .filter(i => !selection.has(String(i)))
              .map(i => String(i))
          );
  }

  return {
    selection: optimizedSelection,
    isInverted,
  };
}

/**
 * Map a React Spectrum `Selection` to another `Selection`
 * @param selectedItemKeys
 * @param getItem
 * @param mapItem
 */
export function mapSelection<TItem, TMap>(
  selectedItemKeys: Selection,
  getItem: (key: React.Key) => KeyedItem<TItem>,
  mapItem: (item: KeyedItem<TItem>) => TMap
): SelectionT<TMap> {
  if (selectedItemKeys === 'all') {
    return 'all';
  }

  const keys = [...selectedItemKeys.keys()];

  return new Set(keys.map(key => mapItem(getItem(key))));
}
