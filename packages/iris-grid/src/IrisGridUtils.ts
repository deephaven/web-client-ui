import {
  GridMetrics,
  GridRange,
  GridUtils,
  ModelIndex,
  ModelSizeMap,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import dh, {
  Column,
  DateWrapper,
  FilterCondition,
  LongWrapper,
  RangeSet,
  RollupConfig,
  Sort,
  Table,
  TableData,
} from '@deephaven/jsapi-shim';
import {
  DateUtils,
  TableUtils,
  ReverseType,
  SortDirection,
  FormattingRule,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import AggregationUtils from './sidebar/aggregations/AggregationUtils';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { FilterData, IrisGridProps, IrisGridState } from './IrisGrid';
import {
  ColumnName,
  AdvancedFilterMap,
  QuickFilterMap,
  AdvancedFilter,
  InputFilter,
  QuickFilter,
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
> & {
  metrics: Pick<GridMetrics, 'userColumnWidths' | 'userRowHeights'>;
};

export interface DehydratedIrisGridState {
  advancedFilters: [
    number,
    {
      options: AdvancedFilterOptions;
    }
  ][];
  aggregationSettings: AggregationSettings;
  customColumnFormatMap: [string, FormattingRule][];
  isFilterBarShown: boolean;
  quickFilters: [
    number,
    {
      text: string;
    }
  ][];
  sorts: {
    column: ModelIndex;
    isAbs: boolean;
    direction: SortDirection;
  }[];
  userColumnWidths: [ColumnName, number][];
  userRowHeights: [number, number][];
  customColumns: ColumnName[];
  conditionalFormats: SidebarFormattingRule[];
  reverseType: ReverseType;
  rollupConfig?: UIRollupConfig;
  showSearchBar: boolean;
  searchValue: string;
  selectDistinctColumns: ColumnName[];
  selectedSearchColumns: ColumnName[];
  invertSearchColumns: boolean;
  pendingDataMap: DehydratedPendingDataMap<string | CellData | null>;
  frozenColumns: ColumnName[];
}

type DehydratedPendingDataMap<T> = [number, { data: [string, T][] }][];

/**
 * Checks if an index is valid for the given array
 * @param x The index to check
 * @param array The array
 * @returns True if the index if valid within the array
 */
function isValidIndex(x: number, array: unknown[]): boolean {
  return x >= 0 && x < array.length;
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
    const {
      isStuckToBottom,
      isStuckToRight,
      movedColumns,
      movedRows,
    } = gridState;

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
      movedColumns: {
        from: string | [string, string] | ModelIndex | [ModelIndex, ModelIndex];
        to: string | ModelIndex;
      }[];
      movedRows: MoveOperation[];
    },
    customColumns: string[] = []
  ): Pick<
    IrisGridProps,
    'isStuckToBottom' | 'isStuckToRight' | 'movedColumns' | 'movedRows'
  > {
    const {
      isStuckToBottom,
      isStuckToRight,
      movedColumns,
      movedRows,
    } = gridState;

    const { columns } = model;
    const customColumnNames = IrisGridUtils.parseCustomColumnNames(
      customColumns
    );
    const columnNames = columns
      .map(({ name }) => name)
      .concat(customColumnNames);

    return {
      isStuckToBottom,
      isStuckToRight,
      movedColumns: [...movedColumns]
        .map(({ to, from }) => {
          const getIndex = (x: string | number) =>
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
   * Exports the state from IrisGrid to a JSON stringifiable object
   * @param model The table model to export the state for
   * @param irisGridState The current state of the IrisGrid
   */
  static dehydrateIrisGridState(
    model: IrisGridModel,
    irisGridState: HydratedIrisGridState
  ): DehydratedIrisGridState {
    const {
      aggregationSettings = { aggregations: [], showOnTop: false },
      advancedFilters,
      customColumnFormatMap,
      isFilterBarShown,
      metrics,
      quickFilters,
      customColumns,
      conditionalFormats = [],
      reverseType,
      rollupConfig = undefined,
      showSearchBar,
      searchValue,
      selectDistinctColumns = [],
      selectedSearchColumns,
      sorts,
      invertSearchColumns,
      pendingDataMap = new Map(),
      frozenColumns,
    } = irisGridState;
    assertNotNull(metrics);
    const { userColumnWidths, userRowHeights } = metrics;
    const { columns } = model;
    return {
      advancedFilters: IrisGridUtils.dehydrateAdvancedFilters(
        columns,
        advancedFilters
      ),
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
      pendingDataMap: IrisGridUtils.dehydratePendingDataMap(
        columns,
        pendingDataMap
      ),
      frozenColumns,
    };
  }

  /**
   * Import a state for IrisGrid that was exported with {{@link dehydrateIrisGridState}}
   * @param model The table model to import the state with
   * @param irisGridState The saved IrisGrid state
   */
  static hydrateIrisGridState(
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
    } = irisGridState;
    const { columns, formatter } = model;
    return {
      advancedFilters: IrisGridUtils.hydrateAdvancedFilters(
        columns,
        advancedFilters,
        formatter.timeZone
      ),
      aggregationSettings,
      customColumnFormatMap: new Map(customColumnFormatMap),
      isFilterBarShown,
      quickFilters: IrisGridUtils.hydrateQuickFilters(
        columns,
        quickFilters,
        formatter.timeZone
      ),
      sorts: IrisGridUtils.hydrateSort(columns, sorts),
      userColumnWidths: new Map(
        userColumnWidths
          .map(([column, width]: [string | number, number]): [
            number,
            number
          ] => {
            if (
              typeof column === 'string' ||
              (column as unknown) instanceof String
            ) {
              return [columns.findIndex(({ name }) => name === column), width];
            }
            return [column, width];
          })
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
      pendingDataMap: IrisGridUtils.hydratePendingDataMap(
        columns,
        pendingDataMap
      ) as PendingDataMap<UIRow>,
      frozenColumns,
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
      partition: string | undefined;
      partitionColumn: Column | undefined;
      advancedSettings: Map<AdvancedSettingsType, boolean>;
    }
  ): {
    isSelectingPartition: boolean;
    partition: string | undefined;
    partitionColumn: ColumnName | null;
    advancedSettings: [AdvancedSettingsType, boolean][];
  } {
    const {
      isSelectingPartition,
      partition,
      partitionColumn,
      advancedSettings,
    } = irisGridPanelState;

    return {
      isSelectingPartition,
      partition,
      partitionColumn: partitionColumn != null ? partitionColumn.name : null,
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
      partition: string | undefined;
      partitionColumn: ColumnName | undefined;
      advancedSettings: [AdvancedSettingsType, boolean][];
    }
  ): {
    isSelectingPartition: boolean;
    partition?: string;
    partitionColumn?: Column;
    advancedSettings: Map<AdvancedSettingsType, boolean>;
  } {
    const {
      isSelectingPartition,
      partition,
      partitionColumn,
      advancedSettings,
    } = irisGridPanelState;

    const { columns } = model;
    return {
      isSelectingPartition,
      partition,
      partitionColumn:
        partitionColumn != null
          ? IrisGridUtils.getColumnByName(columns, partitionColumn)
          : undefined,
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
    quickFilters: QuickFilterMap
  ): [number, { text: string }][] {
    return [...quickFilters].map(([columnIndex, quickFilter]) => {
      const { text } = quickFilter;
      return [columnIndex, { text }];
    });
  }

  /**
   * Import the saved quick filters to apply to the columns. Does not actually apply the filters.
   * @param  columns The columns the filters will be applied to
   * @param  savedQuickFilters Exported quick filters definitions
   * @param  timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns The quick filters to apply to the columns
   */
  static hydrateQuickFilters(
    columns: Column[],
    savedQuickFilters: [number, { text: string }][],
    timeZone?: string
  ): QuickFilterMap {
    const importedFilters = savedQuickFilters.map(
      ([columnIndex, quickFilter]: [number, { text: string }]): [
        number,
        { text: string; filter: FilterCondition | null }
      ] => {
        const { text } = quickFilter;

        let filter = null;
        try {
          const column = IrisGridUtils.getColumn(columns, columnIndex);
          if (column != null) {
            filter = TableUtils.makeQuickFilter(column, text, timeZone);
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
  static dehydrateAdvancedFilters(
    columns: Column[],
    advancedFilters: AdvancedFilterMap
  ): [number, { options: AdvancedFilterOptions }][] {
    return [...advancedFilters].map(([columnIndex, advancedFilter]) => {
      const column = IrisGridUtils.getColumn(columns, columnIndex);
      assertNotNull(column);
      const options = IrisGridUtils.dehydrateAdvancedFilterOptions(
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
  static hydrateAdvancedFilters(
    columns: Column[],
    savedAdvancedFilters: [number, { options: AdvancedFilterOptions }][],
    timeZone: string
  ): AdvancedFilterMap {
    const importedFilters = savedAdvancedFilters.map(
      ([columnIndex, advancedFilter]: [
        number,
        { options: AdvancedFilterOptions }
      ]): [
        number,
        { options: AdvancedFilterOptions; filter: FilterCondition | null }
      ] => {
        const column = IrisGridUtils.getColumn(columns, columnIndex);
        assertNotNull(column);
        const options = IrisGridUtils.hydrateAdvancedFilterOptions(
          column,
          advancedFilter.options
        );
        let filter = null;

        try {
          const columnRetrieved = IrisGridUtils.getColumn(columns, columnIndex);
          if (columnRetrieved != null) {
            filter = TableUtils.makeAdvancedFilter(column, options, timeZone);
          }
        } catch (error) {
          log.error('hydrateAdvancedFilters error with', options, error);
        }

        return [columnIndex, { options, filter }];
      }
    );

    return new Map(importedFilters);
  }

  static dehydrateAdvancedFilterOptions(
    column: Column,
    options: AdvancedFilterOptions
  ): AdvancedFilterOptions {
    const { selectedValues, ...otherOptions } = options;
    return {
      selectedValues: selectedValues?.map((value: unknown) =>
        IrisGridUtils.dehydrateValue(value, column?.type)
      ),
      ...otherOptions,
    };
  }

  static hydrateAdvancedFilterOptions(
    column: Column,
    options: AdvancedFilterOptions
  ): AdvancedFilterOptions {
    const { selectedValues, ...otherOptions } = options;
    return {
      selectedValues: selectedValues?.map(value =>
        IrisGridUtils.hydrateValue(value, column?.type)
      ),
      ...otherOptions,
    };
  }

  static dehydratePendingDataMap(
    columns: Column[],
    pendingDataMap: Map<
      number,
      | UIRow
      | {
          data: Map<ModelIndex, string>;
        }
    >
  ): DehydratedPendingDataMap<CellData | string | null> {
    return [...pendingDataMap].map(
      ([rowIndex, { data }]: [
        number,
        { data: Map<ModelIndex, CellData | string> }
      ]) => [
        rowIndex,
        {
          data: [...data].map(([c, value]) => [
            columns[c].name,
            IrisGridUtils.dehydrateValue(value, columns[c].type),
          ]),
        },
      ]
    );
  }

  static hydratePendingDataMap(
    columns: Column[],
    pendingDataMap: DehydratedPendingDataMap<CellData | string | null>
  ): Map<
    number,
    { data: Map<ModelIndex | null, string | CellData | LongWrapper | null> }
  > {
    const columnMap = new Map<ColumnName, number>();
    const getColumnIndex = (columnName: ColumnName) => {
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
          { data: [string, CellData | string | null][] }
        ]) => [
          rowIndex,
          {
            data: new Map(
              data.map(([columnName, value]) => {
                const index = getColumnIndex(columnName);
                assertNotNull(index);
                return [
                  getColumnIndex(columnName) ?? null,
                  IrisGridUtils.hydrateValue(value, columns[index].type),
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
  static dehydrateValue<T>(value: T, columnType: string): string | T | null {
    if (TableUtils.isDateType(columnType)) {
      return IrisGridUtils.dehydrateDateTime(
        (value as unknown) as number | DateWrapper | Date
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
  static hydrateValue<T>(
    value: T,
    columnType: string
  ): DateWrapper | LongWrapper | T | null {
    if (TableUtils.isDateType(columnType)) {
      return IrisGridUtils.hydrateDateTime((value as unknown) as string);
    }

    if (TableUtils.isLongType(columnType)) {
      return IrisGridUtils.hydrateLong((value as unknown) as string);
    }

    return value;
  }

  static dehydrateDateTime(value: number | DateWrapper | Date): string | null {
    return value != null
      ? dh.i18n.DateTimeFormat.format(DateUtils.FULL_DATE_FORMAT, value)
      : null;
  }

  static hydrateDateTime(value: string): DateWrapper | null {
    return value != null
      ? dh.i18n.DateTimeFormat.parse(DateUtils.FULL_DATE_FORMAT, value)
      : null;
  }

  static dehydrateLong<T>(value: T): string | null {
    return value != null ? `${value}` : null;
  }

  static hydrateLong(value: string): LongWrapper | null {
    return value != null ? dh.LongWrapper.ofString(value) : null;
  }

  /**
   * Export the sorts from the provided table sorts to JSON stringifiable object
   * @param  sorts The table sorts
   * @returns The dehydrated sorts
   */
  static dehydrateSort(
    sorts: Sort[]
  ): {
    column: ModelIndex;
    isAbs: boolean;
    direction: SortDirection;
  }[] {
    return sorts.map(sort => {
      const { column, isAbs, direction } = sort;
      return {
        column: column.index,
        isAbs,
        direction,
      };
    });
  }

  /**
   * Import the saved sorts to apply to the table. Does not actually apply the sort.
   * @param  columns The columns the sorts will be applied to
   * @param  sorts Exported sort definitions
   * @returns The sorts to apply to the table
   */
  static hydrateSort(
    columns: Column[],
    sorts: { column: number; isAbs: boolean; direction: SortDirection }[]
  ): Sort[] {
    return (
      sorts
        .map(sort => {
          const { column: columnIndex, isAbs, direction } = sort;
          if (direction === TableUtils.sortDirection.reverse) {
            return dh.Table.reverse();
          }
          const column = IrisGridUtils.getColumn(columns, columnIndex);
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
   * Pulls just the table settings from the panel state, eg. filters/sorts
   * @param  panelState The dehydrated panel state
   * @returns A dehydrated table settings object, { partition, partitionColumn, advancedFilters, quickFilters, sorts }
   */
  static extractTableSettings<AF, QF, S>(
    panelState: {
      irisGridState: { advancedFilters: AF; quickFilters: QF; sorts: S };
      irisGridPanelState: {
        partitionColumn?: ColumnName;
        partition?: unknown;
      };
    },
    inputFilters: InputFilter[] = []
  ): {
    partitionColumn: ColumnName | undefined;
    partition: unknown;
    advancedFilters: AF;
    inputFilters: InputFilter[];
    quickFilters: QF;
    sorts: S;
  } {
    const { irisGridPanelState, irisGridState } = panelState;
    const { partitionColumn, partition } = irisGridPanelState;
    const { advancedFilters, quickFilters, sorts } = irisGridState;

    return {
      advancedFilters,
      inputFilters,
      partition,
      partitionColumn,
      quickFilters,
      sorts,
    };
  }

  /**
   * Applies the passed in table settings directly to the provided table
   * @param  table The table to apply the settings to
   * @param  tableSettings Dehydrated table settings extracted with `extractTableSettings`
   * @param  timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   */
  static applyTableSettings(
    table: Table,
    tableSettings: {
      quickFilters?: [
        number,
        {
          text: string;
        }
      ][];
      advancedFilters?: [
        number,
        {
          options: AdvancedFilterOptions;
        }
      ][];
      inputFilters?: InputFilter[];
      sorts?: {
        column: ModelIndex;
        isAbs: boolean;
        direction: SortDirection;
      }[];
      partition?: unknown;
      partitionColumn?: ColumnName;
    },
    timeZone: string
  ): void {
    const { columns } = table;

    let quickFilters: FilterCondition[] = [];
    if (tableSettings.quickFilters) {
      quickFilters = IrisGridUtils.getFiltersFromFilterMap(
        IrisGridUtils.hydrateQuickFilters(
          columns,
          tableSettings.quickFilters,
          timeZone
        )
      );
    }

    let advancedFilters: FilterCondition[] = [];
    if (tableSettings.advancedFilters) {
      advancedFilters = IrisGridUtils.getFiltersFromFilterMap(
        IrisGridUtils.hydrateAdvancedFilters(
          columns,
          tableSettings.advancedFilters,
          timeZone
        )
      );
    }
    const inputFilters = IrisGridUtils.getFiltersFromInputFilters(
      columns,
      tableSettings.inputFilters,
      timeZone
    );

    let sorts: Sort[] = [];
    if (tableSettings.sorts) {
      sorts = IrisGridUtils.hydrateSort(columns, tableSettings.sorts);
    }

    let filters = [...quickFilters, ...advancedFilters];
    const { partition, partitionColumn: partitionColumnName } = tableSettings;
    if (partition != null && partitionColumnName != null) {
      const partitionColumn = IrisGridUtils.getColumnByName(
        columns,
        partitionColumnName
      );
      if (partitionColumn) {
        const partitionFilter = partitionColumn
          .filter()
          .eq(dh.FilterValue.ofString(partition));
        filters = [partitionFilter, ...filters];
      }
    }
    filters = [...inputFilters, ...filters];

    table.applyFilter(filters);
    table.applySort(sorts);
  }

  static getInputFiltersForColumns(
    columns: Column[],
    inputFilters: InputFilter[] = []
  ): InputFilter[] {
    return inputFilters.filter(({ name, type }) =>
      columns.find(
        ({ name: columnName, type: columnType }) =>
          columnName === name && columnType === type
      )
    );
  }

  static getFiltersFromInputFilters(
    columns: Column[],
    inputFilters: InputFilter[] = [],
    timeZone: string
  ): FilterCondition[] {
    return inputFilters
      .map(({ name, type, value }) => {
        const column = columns.find(
          ({ name: columnName, type: columnType }) =>
            columnName === name && columnType === type
        );
        if (column) {
          try {
            return TableUtils.makeQuickFilter(column, value, timeZone);
          } catch (e) {
            // It may be unable to create it because user hasn't completed their input
            log.debug('Unable to create input filter', e);
          }
        }

        return null;
      })
      .filter(filter => filter != null) as FilterCondition[];
  }

  static getFiltersFromFilterMap(
    filterMap: Map<ModelIndex, QuickFilter | AdvancedFilter | null>
  ): FilterCondition[] {
    const filters = [];

    const keys = Array.from(filterMap.keys());
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const item = filterMap.get(key);
      if (item && item.filter != null) {
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
  static getHiddenColumns(userColumnWidths: ModelSizeMap): number[] {
    return [...userColumnWidths.entries()]
      .filter(([, value]) => value === 0)
      .map(([key]) => key);
  }

  static parseCustomColumnNames(customColumns: ColumnName[]): ColumnName[] {
    return customColumns.map(customColumn => customColumn.split('=')[0]);
  }

  static getRemovedCustomColumnNames(
    oldCustomColumns: ColumnName[],
    customColumns: ColumnName[]
  ): ColumnName[] {
    const oldCustomColumnsNames = IrisGridUtils.parseCustomColumnNames(
      oldCustomColumns
    );
    const customColumnNames = IrisGridUtils.parseCustomColumnNames(
      customColumns
    );
    return oldCustomColumnsNames.filter(
      oldCustomColumnName => !customColumnNames.includes(oldCustomColumnName)
    );
  }

  static removeSortsInColumns(sorts: Sort[], columnNames: string[]): Sort[] {
    return sorts.filter(sort => !columnNames.includes(sort.column.name));
  }

  static removeFiltersInColumns<T>(
    columns: Column[],
    filters: Map<number, T>,
    removedColumnNames: ColumnName[]
  ): Map<number, T> {
    const columnNames = columns.map(({ name }) => name);
    const newFilter = new Map(filters);
    removedColumnNames.forEach(columnName =>
      newFilter.delete(columnNames.indexOf(columnName))
    );
    return newFilter;
  }

  static removeColumnFromMovedColumns(
    columns: Column[],
    movedColumns: MoveOperation[],
    removedColumnNames: ColumnName[]
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
    selectDistinctColumns: ColumnName[],
    removedColumnNames: ColumnName[]
  ): ColumnName[] {
    return selectDistinctColumns.filter(
      columnName => !removedColumnNames.includes(columnName)
    );
  }

  static getVisibleColumnsInRange(
    tableColumns: Column[],
    left: number,
    right: number,
    movedColumns: MoveOperation[],
    hiddenColumns: number[]
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
    tableColumns: Column[],
    startIndex: VisibleIndex,
    count: number,
    movedColumns: MoveOperation[],
    hiddenColumns: VisibleIndex[]
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
    tableColumns: Column[],
    startIndex: VisibleIndex,
    count: number,
    movedColumns: MoveOperation[],
    hiddenColumns: VisibleIndex[]
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
    tableColumns: Column[],
    viewportColumns: Column[],
    alwaysFetchColumnNames: ColumnName[]
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
    columns: Column[],
    left: number | null,
    right: number | null,
    movedColumns: MoveOperation[],
    hiddenColumns: VisibleIndex[] = [],
    alwaysFetchColumnNames: ColumnName[] = [],
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
   * Get the dh.RangeSet representation of the provided ranges.
   * Ranges are sorted prior to creating the RangeSet. Only the rows are taken into account,
   * RangeSet does not have an option for columns.
   * @param  ranges The ranges to get the range set for
   * @returns The rangeset for the provided ranges
   */
  static rangeSetFromRanges(ranges: GridRange[]): RangeSet {
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

  /**
   * Validate whether the ranges passed in are valid to take a snapshot from.
   * Multiple selections are valid if all of the selected rows have the same columns selected.
   *
   * @param ranges The ranges to validate
   * @returns True if the ranges are valid, false otherwise
   */
  static isValidSnapshotRanges(ranges: GridRange[]): boolean {
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
    ranges: GridRange[],
    allColumns: Column[]
  ): Column[] {
    if (ranges == null || ranges.length === 0) {
      return [];
    }
    if (ranges[0].startColumn === null && ranges[0].endColumn === null) {
      // Snapshot of all the columns
      return allColumns;
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
    originalColumns: Column[],
    config: UIRollupConfig,
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
  static getColumn(columns: Column[], columnIndex: ModelIndex): Column | null {
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
    columns: Column[],
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
    columns: Column[],
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
      const aOperator =
        a.value == null && a.operator !== 'notEq' ? 'eq' : a.operator;
      const bOperator =
        b.value == null && b.operator !== 'notEq' ? 'eq' : b.operator;
      if (aOperator === 'eq' && bOperator !== 'eq') {
        return 1;
      }
      if (aOperator !== 'eq' && bOperator === 'eq') {
        return -1;
      }
      return a.startColumnIndex - b.startColumnIndex;
    });

    let combinedText = '';
    for (let i = 0; i < filterList.length; i += 1) {
      let { operator } = filterList[i];
      const { text, value } = filterList[i];
      if (value !== undefined) {
        let symbol = '';
        if (operator !== undefined) {
          if (value == null && operator !== 'notEq') {
            symbol = '=';
            operator = 'eq';
          } else if (operator !== 'eq') {
            if (operator === 'startsWith' || operator === 'endsWith') {
              symbol = '*';
            } else {
              symbol = TableUtils.getFilterOperatorString(operator);
            }
          }
        }

        let filterText = `${symbol}${text}`;
        if (operator === 'startsWith' && value !== null) {
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
}

export default IrisGridUtils;
