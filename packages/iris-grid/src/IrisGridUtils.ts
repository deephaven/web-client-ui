import {
  GridMetrics,
  GridRange,
  GridUtils,
  ModelIndex,
  ModelSizeMap,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import type {
  Column,
  ColumnGroup,
  DateWrapper,
  dh as DhType,
  FilterCondition,
  LongWrapper,
  RangeSet,
  RollupConfig,
  Sort,
  Table,
  TableData,
} from '@deephaven/jsapi-types';
import {
  DateUtils,
  TableUtils,
  ReverseType,
  SortDirection,
  FormattingRule,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { assertNotNull, EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import AggregationUtils from './sidebar/aggregations/AggregationUtils';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { FilterData, IrisGridProps, IrisGridState } from './IrisGrid';
import {
  ColumnName,
  ReadonlyAdvancedFilterMap,
  ReadonlyQuickFilterMap,
  InputFilter,
  CellData,
  PendingDataMap,
  UIRow,
  AdvancedFilterOptions,
} from './CommonTypes';
import { UIRollupConfig } from './sidebar/RollupRows';
import { AggregationSettings } from './sidebar/aggregations/Aggregations';
import { FormattingRule as SidebarFormattingRule } from './sidebar/conditional-formatting/ConditionalFormattingUtils';
import IrisGridModel from './IrisGridModel';
import type AdvancedSettingsType from './sidebar/AdvancedSettingsType';
import AdvancedSettings from './sidebar/AdvancedSettings';
import ColumnHeaderGroup from './ColumnHeaderGroup';

const log = Log.module('IrisGridUtils');

type HydratedIrisGridState = Pick<
  IrisGridState,
  | 'advancedFilters'
  | 'aggregationSettings'
  | 'customColumnFormatMap'
  | 'isFilterBarShown'
  | 'quickFilters'
  | 'customColumns'
  | 'reverseType'
  | 'rollupConfig'
  | 'showSearchBar'
  | 'searchValue'
  | 'selectDistinctColumns'
  | 'selectedSearchColumns'
  | 'sorts'
  | 'invertSearchColumns'
  | 'pendingDataMap'
  | 'frozenColumns'
  | 'conditionalFormats'
  | 'columnHeaderGroups'
> & {
  metrics: Pick<GridMetrics, 'userColumnWidths' | 'userRowHeights'>;
};

export type DehydratedPendingDataMap<T> = [number, { data: [string, T][] }][];

export type DehydratedAdvancedFilter = [
  number,
  {
    options: AdvancedFilterOptions;
  },
];

export type DehydratedQuickFilter = [
  number,
  {
    text: string;
  },
];

export type DehydratedCustomColumnFormat = [string, FormattingRule];

export type DehydratedUserColumnWidth = [ColumnName, number];

export type DehydratedUserRowHeight = [number, number];

/** @deprecated Use `DehydratedSort` instead */
export interface LegacyDehydratedSort {
  column: ModelIndex;
  isAbs: boolean;
  direction: SortDirection;
}

export interface DehydratedSort {
  column: ColumnName;
  isAbs: boolean;
  direction: SortDirection;
}

export interface TableSettings {
  quickFilters?: readonly DehydratedQuickFilter[];
  advancedFilters?: readonly DehydratedAdvancedFilter[];
  inputFilters?: readonly InputFilter[];
  sorts?: readonly (DehydratedSort | LegacyDehydratedSort)[];
  partitions?: unknown[];
  partitionColumns?: ColumnName[];
}

export interface DehydratedIrisGridState {
  advancedFilters: readonly DehydratedAdvancedFilter[];
  aggregationSettings: AggregationSettings;
  customColumnFormatMap: readonly DehydratedCustomColumnFormat[];
  isFilterBarShown: boolean;
  quickFilters: readonly DehydratedQuickFilter[];
  sorts: readonly DehydratedSort[];
  userColumnWidths: readonly DehydratedUserColumnWidth[];
  userRowHeights: readonly DehydratedUserRowHeight[];
  customColumns: readonly ColumnName[];
  conditionalFormats: readonly SidebarFormattingRule[];
  reverseType: ReverseType;
  rollupConfig?: UIRollupConfig;
  showSearchBar: boolean;
  searchValue: string;
  selectDistinctColumns: readonly ColumnName[];
  selectedSearchColumns: readonly ColumnName[];
  invertSearchColumns: boolean;
  pendingDataMap: DehydratedPendingDataMap<string | CellData | null>;
  frozenColumns: readonly ColumnName[];
  columnHeaderGroups?: readonly ColumnGroup[];
}

/**
 * Checks if an index is valid for the given array
 * @param x The index to check
 * @param array The array
 * @returns True if the index if valid within the array
 */
function isValidIndex(x: number, array: readonly unknown[]): boolean {
  return x >= 0 && x < array.length;
}

function isDateWrapper(value: unknown): value is DateWrapper {
  return (value as DateWrapper).asDate != null;
}

class IrisGridUtils {
  /**
   * Exports the state from Grid component to a JSON stringifiable object
   * @param model The table model to export the Grid state for
   * @param gridState The state of the Grid to export
   * @returns An object that can be stringified and imported with {{@link hydrateGridState}}
   */
  static dehydrateGridState(
    model: IrisGridModel,
    gridState: Pick<
      IrisGridProps,
      'isStuckToBottom' | 'isStuckToRight' | 'movedColumns' | 'movedRows'
    >
  ): {
    isStuckToBottom: boolean;
    isStuckToRight: boolean;
    movedColumns: { from: string | [string, string]; to: string }[];
    movedRows: MoveOperation[];
  } {
    const { isStuckToBottom, isStuckToRight, movedColumns, movedRows } =
      gridState;

    const { columns } = model;

    return {
      isStuckToBottom,
      isStuckToRight,
      movedColumns: [...movedColumns]
        .filter(
          ({ to, from }) =>
            isValidIndex(to, columns) &&
            ((typeof from === 'number' && isValidIndex(from, columns)) ||
              (Array.isArray(from) &&
                isValidIndex(from[0], columns) &&
                isValidIndex(from[1], columns)))
        )
        .map(({ to, from }) => ({
          to: columns[to].name,
          from: Array.isArray(from)
            ? [columns[from[0]].name, columns[from[1]].name]
            : columns[from].name,
        })),
      movedRows: [...movedRows],
    };
  }

  /**
   * Import a state for Grid that was exported with {{@link dehydrateGridState}}
   * @param model The table model to import the state for
   * @param gridState The state of the panel that was saved
   * @returns The gridState props to set on the Grid
   */
  static hydrateGridState(
    model: IrisGridModel,
    gridState: {
      isStuckToBottom: boolean;
      isStuckToRight: boolean;
      movedColumns: readonly {
        from: string | [string, string] | ModelIndex | [ModelIndex, ModelIndex];
        to: string | ModelIndex;
      }[];
      movedRows: readonly MoveOperation[];
    },
    customColumns: readonly string[] = []
  ): Pick<
    IrisGridProps,
    'isStuckToBottom' | 'isStuckToRight' | 'movedColumns' | 'movedRows'
  > {
    const { isStuckToBottom, isStuckToRight, movedColumns, movedRows } =
      gridState;

    const { columns } = model;
    const customColumnNames =
      IrisGridUtils.parseCustomColumnNames(customColumns);
    const columnNames = columns
      .map(({ name }) => name)
      .concat(customColumnNames);

    return {
      isStuckToBottom,
      isStuckToRight,
      movedColumns: [...movedColumns]
        .map(({ to, from }) => {
          const getIndex = (x: string | number): number =>
            typeof x === 'string'
              ? columnNames.findIndex(name => name === x)
              : x;

          return {
            to: getIndex(to),
            from: Array.isArray(from)
              ? ([getIndex(from[0]), getIndex(from[1])] as [number, number])
              : getIndex(from),
          };
        })
        .filter(
          ({ to, from }) =>
            isValidIndex(to, columnNames) &&
            ((typeof from === 'number' && isValidIndex(from, columnNames)) ||
              (Array.isArray(from) &&
                isValidIndex(from[0], columnNames) &&
                isValidIndex(from[1], columnNames)))
        ),
      movedRows: [...movedRows],
    };
  }

  /**
   * Export the IrisGridPanel state.
   * @param model The table model the state is being dehydrated with
   * @param irisGridPanelState The current IrisGridPanel state
   * @returns The dehydrated IrisGridPanel state
   */
  static dehydrateIrisGridPanelState(
    model: IrisGridModel,
    irisGridPanelState: {
      // This needs to be changed after IrisGridPanel is done
      isSelectingPartition: boolean;
      partitions: (string | null)[];
      partitionColumns: Column[];
      advancedSettings: Map<AdvancedSettingsType, boolean>;
    }
  ): {
    isSelectingPartition: boolean;
    partitions: (string | null)[];
    partitionColumns: ColumnName[];
    advancedSettings: [AdvancedSettingsType, boolean][];
  } {
    const {
      isSelectingPartition,
      partitions,
      partitionColumns,
      advancedSettings,
    } = irisGridPanelState;

    // Return value will be serialized, should not contain undefined
    return {
      isSelectingPartition,
      partitions,
      partitionColumns: partitionColumns.map(
        partitionColumn => partitionColumn.name
      ),
      advancedSettings: [...advancedSettings],
    };
  }

  /**
   * Import the saved IrisGridPanel state.
   * @param model The model the state is being hydrated with
   * @param irisGridPanelState Exported IrisGridPanel state
   * @returns The state to apply to the IrisGridPanel
   */
  static hydrateIrisGridPanelState(
    model: IrisGridModel,
    irisGridPanelState: {
      // This needs to be changed after IrisGridPanel is done
      isSelectingPartition: boolean;
      partitions: (string | null)[];
      partitionColumns: ColumnName[];
      advancedSettings: [AdvancedSettingsType, boolean][];
    }
  ): {
    isSelectingPartition: boolean;
    partitions: (string | null)[];
    partitionColumns: Column[];
    advancedSettings: Map<AdvancedSettingsType, boolean>;
  } {
    const {
      isSelectingPartition,
      partitions,
      partitionColumns,
      advancedSettings,
    } = irisGridPanelState;

    const { columns } = model;
    return {
      isSelectingPartition,
      partitions,
      partitionColumns: partitionColumns.map(partitionColumn => {
        const column = IrisGridUtils.getColumnByName(columns, partitionColumn);
        if (column === undefined) {
          throw new Error(`Invalid partition column ${partitionColumn}`);
        }
        return column;
      }),
      advancedSettings: new Map([
        ...AdvancedSettings.DEFAULTS,
        ...advancedSettings,
      ]),
    };
  }

  /**
   * Export the quick filters to JSON striginfiable object
   * @param quickFilters The quick filters to dehydrate
   * @returns The dehydrated quick filters
   */
  static dehydrateQuickFilters(
    quickFilters: ReadonlyQuickFilterMap
  ): DehydratedQuickFilter[] {
    return [...quickFilters].map(([columnIndex, quickFilter]) => {
      const { text } = quickFilter;
      return [columnIndex, { text }];
    });
  }

  static dehydrateLong<T>(value: T): string | null {
    return value != null ? `${value}` : null;
  }

  /**
   * Export the sorts from the provided table sorts to JSON stringifiable object
   * @param  sorts The table sorts
   * @returns The dehydrated sorts
   */
  static dehydrateSort(sorts: readonly Sort[]): DehydratedSort[] {
    return sorts.map(sort => {
      const { column, isAbs, direction } = sort;
      return {
        column: column.name,
        isAbs,
        direction,
      };
    });
  }

  /**
   * Pulls just the table settings from the panel state, eg. filters/sorts
   * @param  panelState The dehydrated panel state
   * @returns A dehydrated table settings object, { partition, partitionColumn, advancedFilters, quickFilters, sorts }
   */
  static extractTableSettings<AF, QF, S>(
    panelState: {
      irisGridState: { advancedFilters: AF; quickFilters: QF; sorts: S };
      irisGridPanelState: {
        partitionColumns: ColumnName[];
        partitions: unknown[];
      };
    },
    inputFilters: InputFilter[] = []
  ): {
    partitionColumns: ColumnName[];
    partitions: unknown[];
    advancedFilters: AF;
    inputFilters: InputFilter[];
    quickFilters: QF;
    sorts: S;
  } {
    const { irisGridPanelState, irisGridState } = panelState;
    const { partitionColumns, partitions } = irisGridPanelState;
    const { advancedFilters, quickFilters, sorts } = irisGridState;

    return {
      advancedFilters,
      inputFilters,
      partitions,
      partitionColumns,
      quickFilters,
      sorts,
    };
  }

  static getInputFiltersForColumns(
    columns: readonly Column[],
    inputFilters: readonly InputFilter[] = []
  ): InputFilter[] {
    return inputFilters.filter(({ name, type }) =>
      columns.find(
        ({ name: columnName, type: columnType }) =>
          columnName === name && columnType === type
      )
    );
  }

  static getFiltersFromFilterMap(
    filterMap: ReadonlyAdvancedFilterMap | ReadonlyQuickFilterMap
  ): FilterCondition[] {
    const filters = [];

    const keys = Array.from(filterMap.keys());
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const item = filterMap.get(key);
      if (item?.filter != null) {
        filters.push(item.filter);
      }
    }

    return filters;
  }

  /**
   * Get array of hidden column indexes
   * @param  userColumnWidths Map of user column widths
   * @returns Array of hidden column indexes
   */
  static getHiddenColumns(userColumnWidths: ModelSizeMap): ModelIndex[] {
    return [...userColumnWidths.entries()]
      .filter(([, value]) => value === 0)
      .map(([key]) => key);
  }

  static parseCustomColumnNames(
    customColumns: readonly ColumnName[]
  ): ColumnName[] {
    return customColumns.map(customColumn => customColumn.split('=')[0]);
  }

  static getRemovedCustomColumnNames(
    oldCustomColumns: readonly ColumnName[],
    customColumns: readonly ColumnName[]
  ): ColumnName[] {
    const oldCustomColumnsNames =
      IrisGridUtils.parseCustomColumnNames(oldCustomColumns);
    const customColumnNames =
      IrisGridUtils.parseCustomColumnNames(customColumns);
    return oldCustomColumnsNames.filter(
      oldCustomColumnName => !customColumnNames.includes(oldCustomColumnName)
    );
  }

  static removeSortsInColumns(
    sorts: readonly Sort[],
    columnNames: readonly string[]
  ): Sort[] {
    return sorts.filter(sort => !columnNames.includes(sort.column.name));
  }

  static removeFiltersInColumns<T>(
    columns: readonly Column[],
    filters: ReadonlyMap<number, T>,
    removedColumnNames: readonly ColumnName[]
  ): Map<number, T> {
    const columnNames = columns.map(({ name }) => name);
    const newFilter = new Map(filters);
    removedColumnNames.forEach(columnName =>
      newFilter.delete(columnNames.indexOf(columnName))
    );
    return newFilter;
  }

  static removeColumnFromMovedColumns(
    columns: readonly Column[],
    movedColumns: readonly MoveOperation[],
    removedColumnNames: readonly ColumnName[]
  ): MoveOperation[] {
    const columnNames = columns.map(({ name }) => name);
    let newMoves = [...movedColumns];
    for (let i = 0; i < removedColumnNames.length; i += 1) {
      const removedColumnName = removedColumnNames[i];
      let removedColumnIndex = columnNames.findIndex(
        name => name === removedColumnName
      );
      const moves: MoveOperation[] = [];
      for (let j = 0; j < newMoves.length; j += 1) {
        const move = newMoves[j];
        const newMove = { ...move };
        let [fromStart, fromEnd] = Array.isArray(move.from)
          ? move.from
          : [move.from, move.from];

        if (removedColumnIndex <= move.to) {
          newMove.to -= 1;
        }

        // If equal to fromStart, the new fromStart would stay the same
        // It's just the next element in the range which will have the same index after deletion
        if (removedColumnIndex < fromStart) {
          fromStart -= 1;
        }

        if (removedColumnIndex <= fromEnd) {
          fromEnd -= 1;
        }

        if (fromStart <= fromEnd && fromStart !== newMove.to) {
          if (fromStart === fromEnd) {
            moves.push({ ...newMove, from: fromStart });
          } else {
            moves.push({ ...newMove, from: [fromStart, fromEnd] });
          }
        }

        // get the next index of the removed column after the move is applied
        // eslint-disable-next-line prefer-destructuring
        removedColumnIndex = GridUtils.applyItemMoves(
          removedColumnIndex,
          removedColumnIndex,
          [move]
        )[0][0];
      }

      newMoves = moves;
      columnNames.splice(
        columnNames.findIndex(name => name === removedColumnName),
        1
      );
    }
    return newMoves;
  }

  static removeColumnsFromSelectDistinctColumns(
    selectDistinctColumns: readonly ColumnName[],
    removedColumnNames: readonly ColumnName[]
  ): ColumnName[] {
    return selectDistinctColumns.filter(
      columnName => !removedColumnNames.includes(columnName)
    );
  }

  static getVisibleColumnsInRange(
    tableColumns: readonly Column[],
    left: number,
    right: number,
    movedColumns: readonly MoveOperation[],
    hiddenColumns: readonly number[]
  ): Column[] {
    const columns: Column[] = [];
    for (let i = left; i <= right; i += 1) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns);
      if (
        modelIndex >= 0 &&
        modelIndex < tableColumns.length &&
        !hiddenColumns.includes(modelIndex)
      ) {
        columns.push(tableColumns[modelIndex]);
      }
    }
    return columns;
  }

  static getPrevVisibleColumns(
    tableColumns: readonly Column[],
    startIndex: VisibleIndex,
    count: number,
    movedColumns: readonly MoveOperation[],
    hiddenColumns: readonly VisibleIndex[]
  ): Column[] {
    const columns = [];
    let i = startIndex;
    while (i >= 0 && columns.length < count) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns);
      if (
        modelIndex >= 0 &&
        modelIndex < tableColumns.length &&
        !hiddenColumns.includes(modelIndex)
      ) {
        columns.unshift(tableColumns[modelIndex]);
      }
      i -= 1;
    }
    return columns;
  }

  static getNextVisibleColumns(
    tableColumns: readonly Column[],
    startIndex: VisibleIndex,
    count: number,
    movedColumns: readonly MoveOperation[],
    hiddenColumns: readonly VisibleIndex[]
  ): Column[] {
    const columns = [];
    let i = startIndex;
    while (i < tableColumns.length && columns.length < count) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns);
      if (
        modelIndex >= 0 &&
        modelIndex < tableColumns.length &&
        !hiddenColumns.includes(modelIndex)
      ) {
        columns.push(tableColumns[modelIndex]);
      }
      i += 1;
    }
    return columns;
  }

  static getColumnsToFetch(
    tableColumns: readonly Column[],
    viewportColumns: readonly Column[],
    alwaysFetchColumnNames: readonly ColumnName[]
  ): Column[] {
    const columnsToFetch = [...viewportColumns];
    alwaysFetchColumnNames.forEach(columnName => {
      const column = tableColumns.find(({ name }) => name === columnName);
      if (column != null && !viewportColumns.includes(column)) {
        columnsToFetch.push(column);
      }
    });
    return columnsToFetch;
  }

  static getModelViewportColumns(
    columns: readonly Column[],
    left: number | null,
    right: number | null,
    movedColumns: readonly MoveOperation[],
    hiddenColumns: readonly VisibleIndex[] = [],
    alwaysFetchColumnNames: readonly ColumnName[] = [],
    bufferPages = 0
  ): Column[] | null {
    if (left == null || right == null) {
      return null;
    }

    const columnsCenter = IrisGridUtils.getVisibleColumnsInRange(
      columns,
      left,
      right,
      movedColumns,
      hiddenColumns
    );
    const bufferWidth = columnsCenter.length * bufferPages;
    const columnsLeft = IrisGridUtils.getPrevVisibleColumns(
      columns,
      left - 1,
      bufferWidth,
      movedColumns,
      hiddenColumns
    );
    const columnsRight = IrisGridUtils.getNextVisibleColumns(
      columns,
      right + 1,
      bufferWidth,
      movedColumns,
      hiddenColumns
    );

    const bufferedColumns = [...columnsLeft, ...columnsCenter, ...columnsRight];

    return IrisGridUtils.getColumnsToFetch(
      columns,
      bufferedColumns,
      alwaysFetchColumnNames
    );
  }

  /**
   * Validate whether the ranges passed in are valid to take a snapshot from.
   * Multiple selections are valid if all of the selected rows have the same columns selected.
   *
   * @param ranges The ranges to validate
   * @returns True if the ranges are valid, false otherwise
   */
  static isValidSnapshotRanges(ranges: readonly GridRange[]): boolean {
    if (ranges == null || ranges.length === 0) {
      return false;
    }

    // To verify all the rows selected have the same set of columns selected, build a map with string representations
    // of each range.
    const rangeMap = new Map();
    for (let i = 0; i < ranges.length; i += 1) {
      const range = ranges[i];
      const rowMapIndex = `${range.startRow}:${range.endRow}`;
      const columnMapIndex = `${range.startColumn}:${range.endColumn}`;
      if (!rangeMap.has(rowMapIndex)) {
        rangeMap.set(rowMapIndex, []);
      }
      rangeMap.get(rowMapIndex).push(columnMapIndex);
    }

    const keys = [...rangeMap.keys()];
    const matchColumnRanges = rangeMap.get(keys[0]).sort().join(',');
    for (let i = 1; i < keys.length; i += 1) {
      if (rangeMap.get(keys[i]).sort().join(',') !== matchColumnRanges) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if the provided value is a valid table index
   * @param  value A value to check if it's a valid table index
   */
  static isValidIndex(value: unknown): boolean {
    if (!Number.isInteger(value)) {
      return false;
    }
    if (!(typeof value === 'number')) {
      return false;
    }
    return value >= 0;
  }

  /**
   * Returns all columns used in any of the ranges provided
   * @param  ranges The model ranges to get columns for
   * @param  allColumns All the columns to pull from
   * @returns The columns selected in the range
   */
  static columnsFromRanges(
    ranges: readonly GridRange[],
    allColumns: readonly Column[]
  ): Column[] {
    if (ranges == null || ranges.length === 0) {
      return [];
    }
    if (ranges[0].startColumn === null && ranges[0].endColumn === null) {
      // Snapshot of all the columns
      return [...allColumns];
    }

    const columnSet = new Set<ModelIndex>();
    for (let i = 0; i < ranges.length; i += 1) {
      const range = ranges[i];
      assertNotNull(range.startColumn);
      assertNotNull(range.endColumn);
      for (
        let c = range.startColumn ?? 0;
        c <= (range.endColumn ?? allColumns.length - 1);
        c += 1
      ) {
        columnSet.add(c);
      }
    }
    return [...columnSet].map(c => allColumns[c]);
  }

  /**
   * Transforms an iris data snapshot into a simple data matrix
   * @param  data The Iris formatted table data
   * @returns A matrix of the values of the data
   */
  static snapshotDataToMatrix(data: TableData): unknown[][] {
    const { columns, rows } = data;
    const result = [];
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      const rowData = [];
      for (let c = 0; c < columns.length; c += 1) {
        const column = columns[c];
        const value = row.get(column);
        rowData.push(value);
      }
      result.push(rowData);
    }
    return result;
  }

  /**
   * Hydrate model rollup config
   * @param  originalColumns Original model columns
   * @param  config Dehydrated rollup config
   * @param  aggregationSettings Aggregation settings
   * @returns Rollup config for the model
   */
  static getModelRollupConfig(
    originalColumns: readonly Column[],
    config: UIRollupConfig | undefined,
    aggregationSettings: AggregationSettings
  ): RollupConfig | null {
    if ((config?.columns?.length ?? 0) === 0) {
      return null;
    }

    const {
      columns: groupingColumns = [],
      showConstituents: includeConstituents = true,
      showNonAggregatedColumns = true,
      includeDescriptions = true,
    } = config ?? {};
    const { aggregations = [] } = aggregationSettings ?? {};
    const aggregationColumns = aggregations.map(
      ({ operation, selected, invert }) =>
        AggregationUtils.isRollupOperation(operation)
          ? []
          : AggregationUtils.getOperationColumnNames(
              originalColumns,
              operation,
              selected,
              invert
            )
    );

    const aggregationMap = {} as Record<AggregationOperation, string[]>;
    // Aggregation columns should show first, add them first
    for (let i = 0; i < aggregations.length; i += 1) {
      aggregationMap[aggregations[i].operation] = aggregationColumns[i];
    }

    if (showNonAggregatedColumns) {
      // Filter out any column that already has an aggregation or grouping
      const nonAggregatedColumnSet = new Set(
        originalColumns
          .map(c => c.name)
          .filter(name => !groupingColumns.includes(name))
      );
      aggregationColumns.forEach(columns => {
        columns.forEach(name => nonAggregatedColumnSet.delete(name));
      });

      if (nonAggregatedColumnSet.size > 0) {
        const existingColumns =
          aggregationMap[AggregationOperation.FIRST] ?? [];
        aggregationMap[AggregationOperation.FIRST] = [
          ...existingColumns,
          ...nonAggregatedColumnSet,
        ];
      }
    }

    return {
      groupingColumns,
      includeConstituents,
      includeDescriptions,
      aggregations: aggregationMap,
    };
  }

  /**
   * @param  pendingDataMap Map of pending data
   * @returns A map with the errors in the pending data
   */
  static getPendingErrors(pendingDataMap: Map<number, UIRow>): void {
    pendingDataMap.forEach((row, rowIndex) => {
      if (!IrisGridUtils.isValidIndex(rowIndex)) {
        throw new Error(`Invalid rowIndex ${rowIndex}`);
      }

      const { data } = row;
      data.forEach((value, columnIndex) => {
        if (!IrisGridUtils.isValidIndex(columnIndex)) {
          throw new Error(`Invalid columnIndex ${columnIndex}`);
        }
      });
    });
  }

  /**
   * Retrieves a column from the provided array at the index, or `null` and logs an error if it's invalid
   *
   * @param  columns The columns to get the column from
   * @param  columnIndex The column index to get
   */
  static getColumn(
    columns: readonly Column[],
    columnIndex: ModelIndex
  ): Column | null {
    if (columnIndex < columns.length) {
      return columns[columnIndex];
    }

    log.error('Unable to retrieve column', columnIndex, '>=', columns.length);

    return null;
  }

  /**
   * Retrieves a column from the provided array matching the name, or `null` and logs an error if not found
   * @param  columns The columns to get the column from
   * @param  columnName The column name to retrieve
   */
  static getColumnByName(
    columns: readonly Column[],
    columnName: ColumnName
  ): Column | undefined {
    const column = columns.find(({ name }) => name === columnName);
    if (column == null) {
      log.error(
        'Unable to retrieve column by name',
        columnName,
        columns.map(({ name }) => name)
      );
    }

    return column;
  }

  /**
   * Get filter configs with column names changed to indexes, exclude missing columns
   * @param  columns The columns to get column indexes from
   * @param  filters Filter configs
   * @returns Updated filter configs with column names changed to indexes
   */
  static changeFilterColumnNamesToIndexes<T>(
    columns: readonly Column[],
    filters: { name: ColumnName; filter: T }[]
  ): [number, T][] {
    return filters
      .map(({ name, filter }): null | [number, T] => {
        const index = columns.findIndex(column => column.name === name);
        return index < 0 ? null : [index, filter];
      })
      .filter(filterConfig => filterConfig != null) as [number, T][];
  }

  /**
   * @param columnType The column type that the filters will be applied to.
   * @param filterList The list of filters to be combined.
   * @returns The combination of the filters in filterList as text.
   */
  static combineFiltersFromList(
    columnType: string,
    filterList: FilterData[]
  ): string {
    filterList.sort((a, b) => {
      // move all 'equals' comparisons to end of list
      if (a.operator === 'eq' && b.operator !== 'eq') {
        return 1;
      }
      if (a.operator !== 'eq' && b.operator === 'eq') {
        return -1;
      }
      return a.startColumnIndex - b.startColumnIndex;
    });

    let combinedText = '';
    for (let i = 0; i < filterList.length; i += 1) {
      const { text, value, operator } = filterList[i];
      if (value !== undefined) {
        let symbol = '';
        if (operator !== undefined) {
          if (value == null && operator === 'eq') {
            symbol = '=';
          } else if (operator !== 'eq') {
            if (operator === 'startsWith' || operator === 'endsWith') {
              symbol = '*';
            } else {
              symbol = TableUtils.getFilterOperatorString(operator);
            }
          }
        }

        let filterText = `${symbol}${text}`;
        if (operator === 'startsWith') {
          filterText = `${text}${symbol}`;
        }
        if (
          columnType != null &&
          value !== null &&
          TableUtils.isCharType(columnType)
        ) {
          filterText = `${symbol}${String.fromCharCode(parseInt(text, 10))}`;
        }
        if (i !== 0) {
          combinedText += operator === 'eq' ? ' || ' : ' && ';
        }
        combinedText += filterText;
      }
    }
    return combinedText;
  }

  /**
   * Parses the column header groups provided.
   * If undefined, should provide default groups such as from layoutHints
   *
   * @returns Object containing groups array, max depth, map of name to parent group, and map of name to group
   */
  static parseColumnHeaderGroups(
    model: IrisGridModel,
    groupsParam: readonly ColumnGroup[]
  ): {
    groups: ColumnHeaderGroup[];
    maxDepth: number;
    parentMap: Map<string, ColumnHeaderGroup>;
    groupMap: Map<string, ColumnHeaderGroup>;
  } {
    let maxDepth = 1;
    const parentMap: Map<string, ColumnHeaderGroup> = new Map();
    const groupMap: Map<string, ColumnHeaderGroup> = new Map();

    // Remove any empty groups before parsing
    const groups = groupsParam?.filter(({ children }) => children.length > 0);

    if (groups.length === 0) {
      return { groups: [], maxDepth, parentMap, groupMap };
    }

    const originalGroupMap = new Map(groups.map(group => [group.name, group]));
    const seenChildren = new Set<string>();

    const addGroup = (group: ColumnGroup): ColumnHeaderGroup => {
      const { name } = group;

      if (model.getColumnIndexByName(name) != null) {
        throw new Error(`Column header group has same name as column: ${name}`);
      }

      const existingGroup = groupMap.get(name);

      if (existingGroup) {
        return existingGroup;
      }

      const childIndexes: ColumnHeaderGroup['childIndexes'] = [];
      let depth = 1;

      group.children.forEach(childName => {
        if (seenChildren.has(childName)) {
          throw new Error(
            `Column group child ${childName} specified in multiple groups`
          );
        }
        seenChildren.add(childName);

        const childGroup = originalGroupMap.get(childName);
        const childIndex = model.getColumnIndexByName(childName);
        if (childGroup) {
          // Adding another column header group
          const addedGroup = addGroup(childGroup);
          childIndexes.push(...addedGroup.childIndexes);
          depth = Math.max(depth, addedGroup.depth + 1);
        } else if (childIndex != null) {
          // Adding a base column
          childIndexes.push(childIndex);
          depth = Math.max(depth, 1);
        } else {
          throw new Error(`Unknown child ${childName} in group ${name}`);
        }
      });

      const columnHeaderGroup = new ColumnHeaderGroup({
        ...group,
        depth,
        childIndexes: childIndexes.flat(),
      });

      groupMap.set(name, columnHeaderGroup);
      group.children.forEach(childName =>
        parentMap.set(childName, columnHeaderGroup)
      );

      maxDepth = Math.max(maxDepth, columnHeaderGroup.depth + 1);
      return columnHeaderGroup;
    };

    const groupNames = new Set();

    groups.forEach(group => {
      const { name } = group;
      if (groupNames.has(name)) {
        throw new Error(`Duplicate column group name: ${name}`);
      }
      groupNames.add(name);
      addGroup(group);
    });

    groupMap.forEach(group => {
      group.setParent(parentMap.get(group.name)?.name);
    });

    return { groups: [...groupMap.values()], maxDepth, groupMap, parentMap };
  }

  /**
   * @param value The value of the cell in a column
   * @param columnType The type of the column
   * @returns The value of the cell converted to text
   */
  static convertValueToText(value: unknown, columnType: string): string {
    if (
      columnType != null &&
      TableUtils.isCharType(columnType) &&
      value != null &&
      typeof value === 'number'
    ) {
      return String.fromCharCode(value);
    }
    if (TableUtils.isDateType(columnType) && isDateWrapper(value)) {
      const date = new Date(value.asDate());
      const offset = date.getTimezoneOffset();
      const offsetDate = new Date(date.getTime() - offset * 60 * 1000);
      const dateText = offsetDate.toISOString();
      const formattedText = dateText.replace('T', ' ').substring(0, 23);
      return formattedText;
    }
    if (value == null) {
      return '';
    }
    return `${value}`;
  }

  private dh: DhType;

  private tableUtils: TableUtils;

  constructor(dh: DhType) {
    this.dh = dh;
    this.tableUtils = new TableUtils(dh);
  }

  /**
   * Exports the state from IrisGrid to a JSON stringifiable object
   * @param model The table model to export the state for
   * @param irisGridState The current state of the IrisGrid
   */
  dehydrateIrisGridState(
    model: IrisGridModel,
    irisGridState: HydratedIrisGridState
  ): DehydratedIrisGridState {
    const {
      aggregationSettings = { aggregations: EMPTY_ARRAY, showOnTop: false },
      advancedFilters,
      customColumnFormatMap,
      isFilterBarShown,
      metrics,
      quickFilters,
      customColumns,
      conditionalFormats = EMPTY_ARRAY,
      reverseType,
      rollupConfig = undefined,
      showSearchBar,
      searchValue,
      selectDistinctColumns = EMPTY_ARRAY,
      selectedSearchColumns,
      sorts,
      invertSearchColumns,
      pendingDataMap = EMPTY_MAP,
      frozenColumns,
      columnHeaderGroups,
    } = irisGridState;
    assertNotNull(metrics);
    const { userColumnWidths, userRowHeights } = metrics;
    const { columns } = model;
    // Return value will be serialized, should not contain undefined
    return {
      advancedFilters: this.dehydrateAdvancedFilters(columns, advancedFilters),
      aggregationSettings,
      customColumnFormatMap: [...customColumnFormatMap],
      isFilterBarShown,
      quickFilters: IrisGridUtils.dehydrateQuickFilters(quickFilters),
      sorts: IrisGridUtils.dehydrateSort(sorts),
      userColumnWidths: [...userColumnWidths]
        .filter(
          ([columnIndex]) =>
            columnIndex != null &&
            columnIndex >= 0 &&
            columnIndex < columns.length
        )
        .map(([columnIndex, width]) => [columns[columnIndex].name, width]),
      userRowHeights: [...userRowHeights],
      customColumns: [...customColumns],
      conditionalFormats: [...conditionalFormats],
      reverseType,
      rollupConfig,
      showSearchBar,
      searchValue,
      selectDistinctColumns: [...selectDistinctColumns],
      selectedSearchColumns,
      invertSearchColumns,
      pendingDataMap: this.dehydratePendingDataMap(columns, pendingDataMap),
      frozenColumns,
      columnHeaderGroups: columnHeaderGroups?.map(item => ({
        name: item.name,
        children: item.children,
        color: item.color,
      })),
    };
  }

  /**
   * Import a state for IrisGrid that was exported with {{@link dehydrateIrisGridState}}
   * @param model The table model to import the state with
   * @param irisGridState The saved IrisGrid state
   */
  hydrateIrisGridState(
    model: IrisGridModel,
    irisGridState: DehydratedIrisGridState
  ): Omit<HydratedIrisGridState, 'metrics'> & {
    userColumnWidths: ModelSizeMap;
    userRowHeights: ModelSizeMap;
  } {
    const {
      advancedFilters,
      aggregationSettings = { aggregations: [], showOnTop: false },
      customColumnFormatMap,
      isFilterBarShown,
      quickFilters,
      sorts,
      customColumns,
      conditionalFormats,
      userColumnWidths,
      userRowHeights,
      reverseType,
      rollupConfig = undefined,
      showSearchBar,
      searchValue,
      selectDistinctColumns,
      selectedSearchColumns,
      invertSearchColumns = true,
      pendingDataMap = [],
      frozenColumns,
      columnHeaderGroups,
    } = irisGridState;
    const { columns, formatter } = model;

    return {
      advancedFilters: this.hydrateAdvancedFilters(
        columns,
        advancedFilters,
        formatter.timeZone
      ),
      aggregationSettings,
      customColumnFormatMap: new Map(customColumnFormatMap),
      isFilterBarShown,
      quickFilters: this.hydrateQuickFilters(
        columns,
        quickFilters,
        formatter.timeZone
      ),
      sorts: this.hydrateSort(columns, sorts),
      userColumnWidths: new Map(
        userColumnWidths
          .map(
            ([column, width]: [string | number, number]): [number, number] => {
              if (
                typeof column === 'string' ||
                (column as unknown) instanceof String
              ) {
                return [
                  columns.findIndex(({ name }) => name === column),
                  width,
                ];
              }
              return [column, width];
            }
          )
          .filter(
            ([column]) =>
              column != null && column >= 0 && column < columns.length
          )
      ),
      customColumns,
      conditionalFormats,
      userRowHeights: new Map(userRowHeights),
      reverseType,
      rollupConfig,
      showSearchBar,
      searchValue,
      selectDistinctColumns,
      selectedSearchColumns,
      invertSearchColumns,
      pendingDataMap: this.hydratePendingDataMap(
        columns,
        pendingDataMap
      ) as PendingDataMap<UIRow>,
      frozenColumns,
      columnHeaderGroups: IrisGridUtils.parseColumnHeaderGroups(
        model,
        columnHeaderGroups ?? model.layoutHints?.columnGroups ?? []
      ).groups,
    };
  }

  /**
   * Import the saved quick filters to apply to the columns. Does not actually apply the filters.
   * @param  columns The columns the filters will be applied to
   * @param  savedQuickFilters Exported quick filters definitions
   * @param  timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns The quick filters to apply to the columns
   */
  hydrateQuickFilters(
    columns: readonly Column[],
    savedQuickFilters: readonly DehydratedQuickFilter[],
    timeZone?: string
  ): ReadonlyQuickFilterMap {
    const importedFilters = savedQuickFilters.map(
      ([columnIndex, quickFilter]: DehydratedQuickFilter): [
        number,
        { text: string; filter: FilterCondition | null },
      ] => {
        const { text } = quickFilter;

        let filter = null;
        try {
          const column = IrisGridUtils.getColumn(columns, columnIndex);
          if (column != null) {
            filter = this.tableUtils.makeQuickFilter(column, text, timeZone);
          }
        } catch (error) {
          log.error('hydrateQuickFilters error with', text, error);
        }

        return [columnIndex, { text, filter }];
      }
    );

    return new Map(importedFilters);
  }

  /**
   * Export the advanced filters from the provided columns to JSON striginfiable object
   * @param columns The columns for the filters
   * @param advancedFilters The advanced filters to dehydrate
   * @returns The dehydrated advanced filters
   */
  dehydrateAdvancedFilters(
    columns: readonly Column[],
    advancedFilters: ReadonlyAdvancedFilterMap
  ): DehydratedAdvancedFilter[] {
    return [...advancedFilters].map(([columnIndex, advancedFilter]) => {
      const column = IrisGridUtils.getColumn(columns, columnIndex);
      assertNotNull(column);
      const options = this.dehydrateAdvancedFilterOptions(
        column,
        advancedFilter.options
      );
      return [columnIndex, { options }];
    });
  }

  /**
   * Import the saved advanced filters to apply to the columns. Does not actually apply the filters.
   * @param  columns The columns the filters will be applied to
   * @param  savedAdvancedFilters Exported advanced filters definitions
   * @param  timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns The advanced filters to apply to the columns
   */
  hydrateAdvancedFilters(
    columns: readonly Column[],
    savedAdvancedFilters: readonly DehydratedAdvancedFilter[],
    timeZone: string
  ): ReadonlyAdvancedFilterMap {
    const importedFilters = savedAdvancedFilters.map(
      ([columnIndex, advancedFilter]: DehydratedAdvancedFilter): [
        number,
        { options: AdvancedFilterOptions; filter: FilterCondition | null },
      ] => {
        const column = IrisGridUtils.getColumn(columns, columnIndex);
        assertNotNull(column);
        const options = this.hydrateAdvancedFilterOptions(
          column,
          advancedFilter.options
        );
        let filter = null;

        try {
          const columnRetrieved = IrisGridUtils.getColumn(columns, columnIndex);
          if (columnRetrieved != null) {
            filter = this.tableUtils.makeAdvancedFilter(
              column,
              options,
              timeZone
            );
          }
        } catch (error) {
          log.error('hydrateAdvancedFilters error with', options, error);
        }

        return [columnIndex, { options, filter }];
      }
    );

    return new Map(importedFilters);
  }

  dehydrateAdvancedFilterOptions(
    column: Column,
    options: AdvancedFilterOptions
  ): AdvancedFilterOptions {
    const { selectedValues, ...otherOptions } = options;
    return {
      selectedValues: selectedValues?.map((value: unknown) =>
        this.dehydrateValue(value, column?.type)
      ),
      ...otherOptions,
    };
  }

  hydrateAdvancedFilterOptions(
    column: Column,
    options: AdvancedFilterOptions
  ): AdvancedFilterOptions {
    const { selectedValues, ...otherOptions } = options;
    return {
      selectedValues: selectedValues?.map(value =>
        this.hydrateValue(value, column?.type)
      ),
      ...otherOptions,
    };
  }

  dehydratePendingDataMap(
    columns: readonly Column[],
    pendingDataMap: ReadonlyMap<
      ModelIndex,
      {
        data: Map<ModelIndex, CellData | string>;
      }
    >
  ): DehydratedPendingDataMap<CellData | string | null> {
    return [...pendingDataMap].map(([rowIndex, { data }]) => [
      rowIndex,
      {
        data: [...data].map(([c, value]) => [
          columns[c].name,
          this.dehydrateValue(value, columns[c].type),
        ]),
      },
    ]);
  }

  hydratePendingDataMap(
    columns: readonly Column[],
    pendingDataMap: DehydratedPendingDataMap<CellData | string | null>
  ): Map<
    number,
    { data: Map<ModelIndex | null, string | CellData | LongWrapper | null> }
  > {
    const columnMap = new Map<ColumnName, number>();
    const getColumnIndex = (columnName: ColumnName): number | undefined => {
      if (!columnMap.has(columnName)) {
        columnMap.set(
          columnName,
          columns.findIndex(({ name }) => name === columnName)
        );
      }
      return columnMap.get(columnName);
    };

    return new Map(
      pendingDataMap.map(
        ([rowIndex, { data }]: [
          number,
          { data: [string, CellData | string | null][] },
        ]) => [
          rowIndex,
          {
            data: new Map(
              data.map(([columnName, value]) => {
                const index = getColumnIndex(columnName);
                assertNotNull(index);
                return [
                  getColumnIndex(columnName) ?? null,
                  this.hydrateValue(value, columns[index].type),
                ];
              })
            ),
          },
        ]
      )
    );
  }

  /**
   * Dehydrates/serializes a value for storage.
   * @param  value The value to dehydrate
   * @param  columnType The column type
   */
  dehydrateValue<T>(value: T, columnType: string): string | T | null {
    if (TableUtils.isDateType(columnType)) {
      return this.dehydrateDateTime(
        value as unknown as number | DateWrapper | Date
      );
    }

    if (TableUtils.isLongType(columnType)) {
      return IrisGridUtils.dehydrateLong(value);
    }

    return value;
  }

  /**
   * Hydrate a value from it's serialized state
   * @param  value The dehydrated value that needs to be hydrated
   * @param  columnType The type of column
   */
  hydrateValue<T>(
    value: T,
    columnType: string
  ): DateWrapper | LongWrapper | T | null {
    if (TableUtils.isDateType(columnType)) {
      return this.hydrateDateTime(value as unknown as string);
    }

    if (TableUtils.isLongType(columnType)) {
      return this.hydrateLong(value as unknown as string);
    }

    return value;
  }

  dehydrateDateTime(value: number | DateWrapper | Date): string | null {
    return value != null
      ? this.dh.i18n.DateTimeFormat.format(DateUtils.FULL_DATE_FORMAT, value)
      : null;
  }

  hydrateDateTime(value: string): DateWrapper | null {
    return value != null
      ? this.dh.i18n.DateTimeFormat.parse(DateUtils.FULL_DATE_FORMAT, value)
      : null;
  }

  hydrateLong(value: string): LongWrapper | null {
    return value != null ? this.dh.LongWrapper.ofString(value) : null;
  }

  /**
   * Import the saved sorts to apply to the table. Does not actually apply the sort.
   * @param  columns The columns the sorts will be applied to
   * @param  sorts Exported sort definitions
   * @returns The sorts to apply to the table
   */
  hydrateSort(
    columns: readonly Column[],
    sorts: readonly (DehydratedSort | LegacyDehydratedSort)[]
  ): Sort[] {
    const { dh } = this;
    return (
      sorts
        .map(sort => {
          const { column: columnIndexOrName, isAbs, direction } = sort;
          if (direction === TableUtils.sortDirection.reverse) {
            return dh.Table.reverse();
          }

          const column =
            typeof columnIndexOrName === 'string'
              ? IrisGridUtils.getColumnByName(columns, columnIndexOrName)
              : IrisGridUtils.getColumn(columns, columnIndexOrName);

          if (column != null) {
            let columnSort = column.sort();
            if (isAbs) {
              columnSort = columnSort.abs();
            }
            if (direction === TableUtils.sortDirection.descending) {
              columnSort = columnSort.desc();
            } else {
              columnSort = columnSort.asc();
            }
            return columnSort;
          }

          return null;
        })
        // If we can't find the column any more, it's null, filter it out
        // If the item is a reverse sort item, filter it out - it will get applied with the `reverseType` property
        // This should only happen when loading a legacy dashboard
        .filter(
          item =>
            item != null && item.direction !== TableUtils.sortDirection.reverse
        ) as Sort[]
    );
  }

  /**
   * Applies the passed in table settings directly to the provided table
   * @param  table The table to apply the settings to
   * @param  tableSettings Dehydrated table settings extracted with `extractTableSettings`
   * @param  timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   */
  applyTableSettings(
    table: Table,
    tableSettings: TableSettings,
    timeZone: string
  ): void {
    const { columns } = table;

    let quickFilters: FilterCondition[] = [];
    if (tableSettings.quickFilters) {
      quickFilters = IrisGridUtils.getFiltersFromFilterMap(
        this.hydrateQuickFilters(columns, tableSettings.quickFilters, timeZone)
      );
    }

    let advancedFilters: FilterCondition[] = [];
    if (tableSettings.advancedFilters) {
      advancedFilters = IrisGridUtils.getFiltersFromFilterMap(
        this.hydrateAdvancedFilters(
          columns,
          tableSettings.advancedFilters,
          timeZone
        )
      );
    }
    const inputFilters = this.getFiltersFromInputFilters(
      columns,
      tableSettings.inputFilters,
      timeZone
    );

    let sorts: Sort[] = [];
    if (tableSettings.sorts) {
      sorts = this.hydrateSort(columns, tableSettings.sorts);
    }

    let filters = [...quickFilters, ...advancedFilters];
    const { partitions, partitionColumns: partitionColumnNames } =
      tableSettings;
    if (
      partitions &&
      partitions.length &&
      partitionColumnNames &&
      partitionColumnNames?.length
    ) {
      const partitionColumns = partitionColumnNames.map(partitionColumnName =>
        IrisGridUtils.getColumnByName(columns, partitionColumnName)
      );
      for (let i = 0; i < partitionColumns.length; i += 1) {
        if (partitionColumns[i] !== undefined && partitions[i] != null) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const partitionFilter = partitionColumns[i]!.filter().eq(
            this.dh.FilterValue.ofString(partitions[i])
          );
          filters = [partitionFilter, ...filters];
        }
      }
    }
    filters = [...inputFilters, ...filters];

    table.applyFilter(filters);
    table.applySort(sorts);
  }

  getFiltersFromInputFilters(
    columns: readonly Column[],
    inputFilters: readonly InputFilter[] = [],
    timeZone?: string
  ): FilterCondition[] {
    return inputFilters
      .map(({ name, type, value }) => {
        const column = columns.find(
          ({ name: columnName, type: columnType }) =>
            columnName === name && columnType === type
        );
        if (column) {
          try {
            return this.tableUtils.makeQuickFilter(column, value, timeZone);
          } catch (e) {
            // It may be unable to create it because user hasn't completed their input
            log.debug('Unable to create input filter', e);
          }
        }

        return null;
      })
      .filter(filter => filter != null) as FilterCondition[];
  }

  /**
   * Get the dh.RangeSet representation of the provided ranges.
   * Ranges are sorted prior to creating the RangeSet. Only the rows are taken into account,
   * RangeSet does not have an option for columns.
   * @param  ranges The ranges to get the range set for
   * @returns The rangeset for the provided ranges
   */
  rangeSetFromRanges(ranges: readonly GridRange[]): RangeSet {
    const { dh } = this;
    const rangeSets = ranges
      .slice()
      .sort((a, b): number => {
        assertNotNull(a.startRow);
        assertNotNull(b.startRow);
        return a.startRow - b.startRow;
      })
      .map(range => {
        const { startRow, endRow } = range;
        assertNotNull(startRow);
        assertNotNull(endRow);
        return dh.RangeSet.ofRange(startRow, endRow);
      });
    return dh.RangeSet.ofRanges(rangeSets);
  }
}

export default IrisGridUtils;
