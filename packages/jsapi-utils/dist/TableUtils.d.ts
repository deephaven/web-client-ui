import {
  Type as FilterType,
  TypeValue as FilterTypeValue,
  OperatorValue as FilterOperatorValue,
} from '@deephaven/filters';
import {
  Column,
  FilterCondition,
  FilterValue,
  LongWrapper,
  Sort,
  Table,
  TreeTable,
} from '@deephaven/jsapi-shim';
import { CancelablePromise } from '@deephaven/utils';

declare type Values<T> = T[keyof T];
export declare type DataType = Values<typeof TableUtils.dataType>;
export declare type SortDirection = Values<typeof TableUtils.sortDirection>;
export declare type ReverseType = Values<typeof TableUtils.REVERSE_TYPE>;
export declare type AdvancedFilterItemType = {
  selectedType: FilterTypeValue;
  value: string;
};
/** Utility class to provide some functions for working with tables */
export declare class TableUtils {
  static dataType: {
    readonly BOOLEAN: 'boolean';
    readonly CHAR: 'char';
    readonly DATETIME: 'datetime';
    readonly DECIMAL: 'decimal';
    readonly INT: 'int';
    readonly STRING: 'string';
  };

  static sortDirection: {
    readonly ascending: 'ASC';
    readonly descending: 'DESC';
    readonly reverse: 'REVERSE';
    readonly none: null;
  };

  static REVERSE_TYPE: Readonly<{
    readonly NONE: 'none';
    readonly PRE_SORT: 'pre-sort';
    readonly POST_SORT: 'post-sort';
  }>;

  static NUMBER_REGEX: RegExp;

  static getSortIndex(sort: Sort[], columnIndex: number): number | null;

  /**
   * @param tableSort The sorts from the table to get the sort from
   * @param columnIndex The index of the column to get the sort for
   * @return The sort for the column, or null if it's not sorted
   */
  static getSortForColumn(tableSort: Sort[], columnIndex: number): Sort | null;

  static getFilterText(filter: FilterCondition): string | null;

  /** Return the valid filter types for the column */
  static getFilterTypes(columnType: string): FilterType[];

  static getNextSort(table: Table, columnIndex: number): Sort | null;

  static makeColumnSort(
    table: Table,
    columnIndex: number,
    direction: SortDirection,
    isAbs: boolean
  ): Sort | null;

  /**
   * Toggles the sort for the specified column
   * @param sorts The current sorts from IrisGrid.state
   * @param table The table to apply the sort to
   * @param columnIndex The column index to apply the sort to
   * @param addToExisting Add this sort to the existing sort
   */
  static toggleSortForColumn(
    sorts: Sort[],
    table: Table,
    columnIndex: number,
    addToExisting?: boolean
  ): Sort[];

  static sortColumn(
    table: Table,
    modelColumn: number,
    direction: SortDirection,
    isAbs: boolean,
    addToExisting: boolean
  ): Sort[];

  /**
   * Sets the sort for the given column *and* removes any reverses
   * @param tableSort The current sorts from IrisGrid.state
   * @param columnIndex The column index to apply the sort to
   * @param sort The sort object to add
   * @param addToExisting Add this sort to the existing sort
   * @returns Returns the modified array of sorts - removing reverses
   */
  static setSortForColumn(
    tableSort: Sort[],
    columnIndex: number,
    sort: Sort | null,
    addToExisting?: boolean
  ): Sort[];

  static getNormalizedType(columnType: string): DataType | null;

  static isLongType(columnType: string): boolean;

  static isDateType(columnType: string): boolean;

  static isNumberType(columnType: string): boolean;

  static isIntegerType(columnType: string): boolean;

  static isDecimalType(columnType: string): boolean;

  static isBooleanType(columnType: string): boolean;

  static isCharType(columnType: string): boolean;

  static isStringType(columnType: string): boolean;

  static isTextType(columnType: string): boolean;

  /**
   * Get base column type
   * @param columnType Column type
   * @returns Element type for array columns, original type for non-array columns
   */
  static getBaseType(columnType: string): string;

  /**
   * Check if the column types are compatible
   * @param type1 Column type to check
   * @param type2 Column type to check
   * @returns True, if types are compatible
   */
  static isCompatibleType(type1: string, type2: string): boolean;

  /**
   * Create filter with the provided column and text. Handles multiple filters joined with && or ||
   * @param column The column to set the filter on
   * @param text The text string to create the filter from
   * @param timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns Returns the created filter, null if text could not be parsed
   */
  static makeQuickFilter(
    column: Column,
    text: string,
    timeZone: string
  ): FilterCondition | null;

  /**
   * Create filter with the provided column and text of one component (no multiple conditions)
   * @param column The column to set the filter on
   * @param text The text string to create the filter from
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns Returns the created filter, null if text could not be parsed
   */
  static makeQuickFilterFromComponent(
    column: Column,
    text: string,
    timeZone: string
  ): FilterCondition | null;

  static makeQuickNumberFilter(
    column: Column,
    text: string
  ): FilterCondition | null;

  static makeQuickTextFilter(
    column: Column,
    text: string | null
  ): FilterCondition | null;

  static makeQuickBooleanFilter(
    column: Column,
    text: string
  ): FilterCondition | null;

  /**
   * Builds a date filter parsed from the text string which may or may not include an operator.
   * @param column The column to build the filter from, with or without a leading operator.
   * @param text The date string text to parse.
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   */
  static makeQuickDateFilter(
    column: Column,
    text: string,
    timeZone: string
  ): FilterCondition;

  /**
   * Builds a date filter parsed from the text string with the provided filter.
   * @param column The column to build the filter from.
   * @param text The date string text to parse, without an operator.
   * @param operation The filter operation to use.
   * @param timeZone The time zone to make this filter with. E.g. America/New_York
   */
  static makeQuickDateFilterWithOperation(
    column: Column,
    text: string,
    operation: string | undefined,
    timeZone: string
  ): FilterCondition;

  static makeQuickCharFilter(
    column: Column,
    text: string
  ): FilterCondition | null;

  /**
   * @param filter The column filter to apply the range operation to
   * @param operation The range operation to run
   * @param value The value to use for the operation
   * @returns The condition with the specified operation
   */
  static makeRangeFilterWithOperation(
    filter: FilterValue,
    operation: string,
    value: FilterValue
  ): FilterCondition | null;

  /**
   * Wraps a table promise in a cancelable promise that will close the table if the promise is cancelled.
   * Use in a component that loads a table, and call cancel when unmounting.
   * @param table The table promise to wrap
   */
  static makeCancelableTablePromise(
    table: Promise<Table> | Table
  ): CancelablePromise<Table>;

  /**
   * Make a cancelable promise for a one-shot table event with a timeout.
   * @param table Table to listen for events on
   * @param eventName Event to listen for
   * @param timeout Event timeout in milliseconds, defaults to 0
   * @param matcher Optional function to determine if the promise can be resolved or stays pending
   * @returns Resolves with the event data
   */
  static makeCancelableTableEventPromise(
    table: Table | TreeTable,
    eventName: string,
    timeout?: number,
    matcher?: ((event: CustomEvent) => boolean) | null
  ): CancelablePromise<CustomEvent>;

  static makeAdvancedFilter(
    column: Column,
    options: {
      filterItems: AdvancedFilterItemType[];
      filterOperators: FilterOperatorValue[];
      invertSelection: boolean;
      selectedValues: string[];
    },
    timeZone: string
  ): FilterCondition | null;

  static removeCommas(value: string): string;

  /**
   * @param columnType The column type to make the filter value from.
   * @param value The value to make the filter value from.
   * @returns The FilterValue item for this column/value combination
   */
  static makeFilterValue(columnType: string, value: string): FilterValue;

  /**
   * Takes a value and converts it to an `dh.FilterValue`
   *
   * @param columnType The column type to make the filter value from.
   * @param value The value to actually set
   * @returns The FilterValue item for this column/value combination
   */
  static makeFilterRawValue(columnType: string, rawValue: unknown): FilterValue;

  /**
   * Converts a string value to a value appropriate for the column
   * @param columnType The column type to make the value for
   * @param text The string value to make a type for
   * @param timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   */
  static makeValue(
    columnType: string,
    text: string,
    timeZone: string
  ): string | number | boolean | LongWrapper | null;

  static makeBooleanValue(text: string, allowEmpty?: boolean): boolean | null;

  static makeNumberValue(text: string): number | null;

  static makeAdvancedValueFilter(
    column: Column,
    operation: FilterTypeValue,
    value: string,
    timeZone: string
  ): FilterCondition;

  /**
   * Create a filter using the selected items
   * Has a flag for invertSelection as we start from a "Select All" state and a user just deselects items.
   * Since there may be millions of distinct items, it's easier to build an inverse filter.
   * @param column The column to set the filter on
   * @param selectedValues The values that are selected
   * @param invertSelection Invert the selection (eg. All items are selected, then you deselect items)
   * @returns Returns a `in` or `notIn` FilterCondition as necessary, or null if no filtering should be applied (everything selected)
   */
  static makeSelectValueFilter(
    column: Column,
    selectedValues: string[],
    invertSelection: boolean
  ): FilterCondition | null;

  static isTreeTable(table: unknown): table is TreeTable;

  /**
   * Copies the provided array, sorts by column name case insensitive, and returns the sorted array.
   * @param columns The columns to sort
   * @param isAscending Whether to sort ascending
   */
  static sortColumns(columns: Column[], isAscending?: boolean): Column[];
}
export default TableUtils;
// # sourceMappingURL=TableUtils.d.ts.map
