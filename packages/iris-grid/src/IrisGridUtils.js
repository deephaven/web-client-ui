import { GridUtils } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import TableUtils from './TableUtils';
import DateUtils from './DateUtils';
import AdvancedSettings from './sidebar/AdvancedSettings';
import AggregationUtils from './sidebar/aggregations/AggregationUtils';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';

const log = Log.module('IrisGridUtils');

class IrisGridUtils {
  /**
   * Exports the state from Grid component to a JSON stringifiable object
   * @param {IrisGridModel} model The table model to export the Grid state for
   * @param {Object} gridState The state of the Grid to export
   * @returns {Object} An object that can be stringified and imported with {{@link hydrateGridState}}
   */
  static dehydrateGridState(model, gridState) {
    const { movedColumns, movedRows } = gridState;

    const { columns } = model;
    return {
      movedColumns: [...movedColumns]
        .filter(
          ({ to, from }) =>
            to >= 0 && to < columns.length && from >= 0 && from < columns.length
        )
        .map(({ to, from }) => ({
          to: columns[to].name,
          from: columns[from].name,
        })),
      movedRows: [...movedRows],
    };
  }

  /**
   * Import a state for Grid that was exported with {{@link dehydrateGridState}}
   * @param {IrisGridModel} model The table model to import the state for
   * @param {Object} gridState The state of the panel that was saved
   * @returns {Object} The gridState props to set on the Grid
   */
  static hydrateGridState(model, gridState, customColumns = []) {
    const { movedColumns, movedRows } = gridState;

    const { columns } = model;
    const customColumnNames = IrisGridUtils.parseCustomColumnNames(
      customColumns
    );
    const columnNames = columns
      .map(({ name }) => name)
      .concat(customColumnNames);

    return {
      movedColumns: [...movedColumns]
        .map(({ to, from }) => {
          if (
            (typeof to === 'string' || to instanceof String) &&
            (typeof from === 'string' || from instanceof String)
          ) {
            return {
              to: columnNames.findIndex(name => name === to),
              from: columnNames.findIndex(name => name === from),
            };
          }
          return { to, from };
        })
        .filter(
          ({ to, from }) =>
            to != null &&
            to >= 0 &&
            to < columnNames.length &&
            from != null &&
            from >= 0 &&
            from < columnNames.length
        ),
      movedRows: [...movedRows],
    };
  }

  /**
   * Exports the state from IrisGrid to a JSON stringifiable object
   * @param {IrisGridModel} model The table model to export the state for
   * @param {Object} irisGridState The current state of the IrisGrid
   */
  static dehydrateIrisGridState(model, irisGridState) {
    const {
      aggregationSettings = { aggregations: [], showOnTop: false },
      advancedSettings = [],
      advancedFilters,
      customColumnFormatMap,
      isFilterBarShown,
      metrics,
      quickFilters,
      customColumns,
      reverseType,
      rollupConfig = null,
      showSearchBar,
      searchValue,
      selectDistinctColumns,
      selectedSearchColumns,
      sorts,
      invertSearchColumns,
      pendingDataMap = new Map(),
    } = irisGridState;
    const { userColumnWidths, userRowHeights } = metrics;

    const { columns } = model;
    return {
      advancedFilters: IrisGridUtils.dehydrateAdvancedFilters(
        columns,
        advancedFilters
      ),
      advancedSettings: [...advancedSettings],
      aggregationSettings,
      customColumnFormatMap: [...customColumnFormatMap],
      isFilterBarShown,
      quickFilters: IrisGridUtils.dehydrateQuickFilters(quickFilters),
      sorts: IrisGridUtils.dehydrateSort(sorts, model),
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
    };
  }

  /**
   * Import a state for IrisGrid that was exported with {{@link dehydrateIrisGridState}}
   * @param {IrisGridModel} model The table model to import the state with
   * @param {Object} irisGridState The saved IrisGrid state
   */
  static hydrateIrisGridState(model, irisGridState) {
    const {
      advancedFilters,
      advancedSettings = [],
      aggregationSettings = { aggregations: [], showOnTop: false },
      customColumnFormatMap,
      isFilterBarShown,
      quickFilters,
      sorts,
      customColumns,
      userColumnWidths,
      userRowHeights,
      reverseType,
      rollupConfig = null,
      showSearchBar,
      searchValue,
      selectDistinctColumns,
      selectedSearchColumns,
      invertSearchColumns = true,
      pendingDataMap = [],
    } = irisGridState;

    const { columns, timeZone } = model;
    return {
      advancedFilters: IrisGridUtils.hydrateAdvancedFilters(
        columns,
        advancedFilters,
        timeZone
      ),
      advancedSettings: new Map([
        ...AdvancedSettings.DEFAULTS,
        ...advancedSettings,
      ]),
      aggregationSettings,
      customColumnFormatMap: new Map(customColumnFormatMap),
      isFilterBarShown,
      quickFilters: IrisGridUtils.hydrateQuickFilters(
        columns,
        quickFilters,
        timeZone
      ),
      sorts: IrisGridUtils.hydrateSort(columns, sorts),
      userColumnWidths: new Map(
        userColumnWidths
          .map(([column, width]) => {
            if (typeof column === 'string' || column instanceof String) {
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
      ),
    };
  }

  /**
   * Export the IrisGridPanel state.
   * @param {IrisGridModel} model The table model the state is being dehydrated with
   * @param {Object} irisGridPanelState The current IrisGridPanel state
   * @returns {Object} The dehydrated IrisGridPanel state
   */
  static dehydrateIrisGridPanelState(model, irisGridPanelState) {
    const {
      isSelectingPartition,
      partition,
      partitionColumn,
    } = irisGridPanelState;

    return {
      isSelectingPartition,
      partition,
      partitionColumn: partitionColumn ? partitionColumn.name : null,
    };
  }

  /**
   * Import the saved IrisGridPanel state.
   * @param {IrisGridModel} model The model the state is being hydrated with
   * @param {Object} irisGridPanelState Exported IrisGridPanel state
   * @returns {Object} The state to apply to the IrisGridPanel
   */
  static hydrateIrisGridPanelState(model, irisGridPanelState) {
    const {
      isSelectingPartition,
      partition,
      partitionColumn,
    } = irisGridPanelState;

    const { columns } = model;
    return {
      isSelectingPartition,
      partition,
      partitionColumn:
        partitionColumn != null
          ? IrisGridUtils.getColumnByName(columns, partitionColumn)
          : null,
    };
  }

  /**
   * Export the quick filters to JSON striginfiable object
   * @param {AdvancedFilter[]} quickFilters The quick filters to dehydrate
   * @returns {Object} The dehydrated quick filters
   */
  static dehydrateQuickFilters(quickFilters) {
    return [...quickFilters].map(([columnIndex, quickFilter]) => {
      const { text } = quickFilter;
      return [columnIndex, { text }];
    });
  }

  /**
   * Import the saved quick filters to apply to the columns. Does not actually apply the filters.
   * @param {dh.Column[]} columns The columns the filters will be applied to
   * @param {Object[]} savedQuickFilters Exported quick filters definitions
   * @param {string} timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns {QuickFilter[]} The quick filters to apply to the columns
   */
  static hydrateQuickFilters(columns, savedQuickFilters, timeZone) {
    const importedFilters = savedQuickFilters.map(
      ([columnIndex, quickFilter]) => {
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
   * @param {dh.Column[]} columns The columns for the filters
   * @param {AdvancedFilter[]} advancedFilters The advanced filters to dehydrate
   * @returns {Object} The dehydrated advanced filters
   */
  static dehydrateAdvancedFilters(columns, advancedFilters) {
    return [...advancedFilters].map(([columnIndex, advancedFilter]) => {
      const options = IrisGridUtils.dehydrateAdvancedFilterOptions(
        IrisGridUtils.getColumn(columns, columnIndex),
        advancedFilter.options
      );
      return [columnIndex, { options }];
    });
  }

  /**
   * Import the saved advanced filters to apply to the columns. Does not actually apply the filters.
   * @param {dh.Columns[]} columns The columns the filters will be applied to
   * @param {Object[]} savedAdvancedFilters Exported advanced filters definitions
   * @param {string} timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns {AdvancedFilter[]} The advanced filters to apply to the columns
   */
  static hydrateAdvancedFilters(columns, savedAdvancedFilters, timeZone) {
    const importedFilters = savedAdvancedFilters.map(
      ([columnIndex, advancedFilter]) => {
        const options = IrisGridUtils.hydrateAdvancedFilterOptions(
          IrisGridUtils.getColumn(columns, columnIndex),
          advancedFilter.options
        );
        let filter = null;

        try {
          const column = IrisGridUtils.getColumn(columns, columnIndex);
          if (column != null) {
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

  static dehydrateAdvancedFilterOptions(column, options) {
    const { selectedValues, ...otherOptions } = options;
    return {
      selectedValues: selectedValues.map(value =>
        IrisGridUtils.dehydrateValue(value, column?.type)
      ),
      ...otherOptions,
    };
  }

  static hydrateAdvancedFilterOptions(column, options) {
    const { selectedValues, ...otherOptions } = options;
    return {
      selectedValues: selectedValues.map(value =>
        IrisGridUtils.hydrateValue(value, column?.type)
      ),
      ...otherOptions,
    };
  }

  static dehydratePendingDataMap(columns, pendingDataMap) {
    return [...pendingDataMap].map(([rowIndex, { data }]) => [
      rowIndex,
      {
        data: [...data].map(([c, value]) => [
          columns[c].name,
          IrisGridUtils.dehydrateValue(value, columns[c].type),
        ]),
      },
    ]);
  }

  static hydratePendingDataMap(columns, pendingDataMap) {
    const columnMap = new Map();
    const getColumnIndex = columnName => {
      if (!columnMap.has(columnName)) {
        columnMap.set(
          columnName,
          columns.findIndex(({ name }) => name === columnName)
        );
      }
      return columnMap.get(columnName);
    };

    return new Map(
      pendingDataMap.map(([rowIndex, { data }]) => [
        rowIndex,
        {
          data: new Map(
            data.map(([columnName, value]) => [
              getColumnIndex(columnName),
              IrisGridUtils.hydrateValue(
                value,
                columns[getColumnIndex(columnName)].type
              ),
            ])
          ),
        },
      ])
    );
  }

  /**
   * Dehydrates/serializes a value for storage.
   * @param {Any} value The value to dehydrate
   * @param {String} columnType The column type
   */
  static dehydrateValue(value, columnType) {
    if (TableUtils.isDateType(columnType)) {
      return IrisGridUtils.dehydrateDateTime(value);
    }

    if (TableUtils.isLongType(columnType)) {
      return IrisGridUtils.dehydrateLong(value);
    }

    return value;
  }

  /**
   * Hydrate a value from it's serialized state
   * @param {Any} value The dehydrated value that needs to be hydrated
   * @param {String} columnType The type of column
   */
  static hydrateValue(value, columnType) {
    if (TableUtils.isDateType(columnType)) {
      return IrisGridUtils.hydrateDateTime(value);
    }

    if (TableUtils.isLongType(columnType)) {
      return IrisGridUtils.hydrateLong(value);
    }

    return value;
  }

  static dehydrateDateTime(value) {
    return value != null
      ? dh.i18n.DateTimeFormat.format(DateUtils.FULL_DATE_FORMAT, value)
      : null;
  }

  static hydrateDateTime(value) {
    return value != null
      ? dh.i18n.DateTimeFormat.parse(DateUtils.FULL_DATE_FORMAT, value)
      : null;
  }

  static dehydrateLong(value) {
    return value != null ? `${value}` : null;
  }

  static hydrateLong(value) {
    return value != null ? dh.LongWrapper.ofString(value) : null;
  }

  /**
   * Export the sorts from the provided table sorts to JSON stringifiable object
   * @param {dh.Sort[]} sorts The table sorts
   * @returns {Object} The dehydrated sorts
   */
  static dehydrateSort(sorts) {
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
   * @param {dh.Column[]} columns The columns the sorts will be applied to
   * @param {Object[]} sorts Exported sort definitions
   * @returns {dh.Sort[]} The sorts to apply to the table
   */
  static hydrateSort(columns, sorts) {
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
        )
    );
  }

  /**
   * Pulls just the table settings from the panel state, eg. filters/sorts
   * @param {Object} panelState The dehydrated panel state
   * @returns {Object} A dehydrated table settings object, { partition, partitionColumn, advancedFilters, quickFilters, sorts }
   */
  static extractTableSettings(panelState, inputFilters = []) {
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
   * @param {dh.Table} table The table to apply the settings to
   * @param {Object} tableSettings Dehydrated table settings extracted with `extractTableSettings`
   * @param {string} timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   */
  static applyTableSettings(table, tableSettings, timeZone) {
    const { columns } = table;
    const quickFilters = IrisGridUtils.getFiltersFromFilterMap(
      IrisGridUtils.hydrateQuickFilters(
        columns,
        tableSettings.quickFilters,
        timeZone
      )
    );
    const advancedFilters = IrisGridUtils.getFiltersFromFilterMap(
      IrisGridUtils.hydrateAdvancedFilters(
        columns,
        tableSettings.advancedFilters,
        timeZone
      )
    );
    const inputFilters = IrisGridUtils.getFiltersFromInputFilters(
      columns,
      tableSettings.inputFilters,
      timeZone
    );
    const sorts = IrisGridUtils.hydrateSort(columns, tableSettings.sorts);

    let filters = [...quickFilters, ...advancedFilters];
    const { partition, partitionColumn: partitionColumnName } = tableSettings;
    if (partition && partitionColumnName) {
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

  static getInputFiltersForColumns(columns, inputFilters = []) {
    return inputFilters.filter(({ name, type }) =>
      columns.find(
        ({ name: columnName, type: columnType }) =>
          columnName === name && columnType === type
      )
    );
  }

  static getFiltersFromInputFilters(columns, inputFilters = [], timeZone) {
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
      .filter(filter => filter);
  }

  static getFiltersFromFilterMap(filterMap) {
    const filters = [];

    const keys = Array.from(filterMap.keys());
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const item = filterMap.get(key);
      if (item.filter != null) {
        filters.push(item.filter);
      }
    }

    return filters;
  }

  /**
   * Get array of hidden column indexes
   * @param {Map} userColumnWidths Map of user column widths
   * @returns {number[]} Array of hidden column indexes
   */
  static getHiddenColumns(userColumnWidths) {
    return [...userColumnWidths.entries()]
      .filter(([, value]) => value === 0)
      .map(([key]) => key);
  }

  static parseCustomColumnNames(customColumns) {
    return customColumns.map(customColumn => customColumn.split('=')[0]);
  }

  static getRemovedCustomColumnNames(oldCustomColumns, customColumns) {
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

  static removeSortsInColumns(sorts, columnNames) {
    return sorts.filter(sort => !columnNames.includes(sort.column.name));
  }

  static removeFiltersInColumns(columns, filters, removedColumnNames) {
    const columnNames = columns.map(({ name }) => name);
    const newFilter = new Map(filters);
    removedColumnNames.forEach(columnName =>
      newFilter.delete(columnNames.indexOf(columnName))
    );
    return newFilter;
  }

  static removeColumnFromMovedColumns(
    columns,
    movedColumns,
    removedColumnNames
  ) {
    const columnNames = columns.map(({ name }) => name);
    let newMoves = [...movedColumns];
    for (let i = 0; i < removedColumnNames.length; i += 1) {
      const removedColumnName = removedColumnNames[i];
      let removedColumnIndex = columnNames.findIndex(
        name => name === removedColumnName
      );
      const moves = [];
      for (let j = 0; j < newMoves.length; j += 1) {
        const move = newMoves[j];
        const newMove = { ...move };
        // remove the move if it's a removed column move
        // from-=1 & to-=! if the from/to column is placed after the removed column
        if (removedColumnIndex !== move.from) {
          if (move.from > removedColumnIndex) {
            newMove.from -= 1;
          }
          if (move.to >= removedColumnIndex) {
            newMove.to -= 1;
          }
          if (newMove.from !== newMove.to) {
            moves.push(newMove);
          }
        }
        // get the next index of the removed column after the move
        if (move.from === removedColumnIndex) {
          removedColumnIndex = move.to;
        } else if (
          move.from < removedColumnIndex &&
          removedColumnIndex < move.to
        ) {
          removedColumnIndex -= 1;
        } else if (
          move.to <= removedColumnIndex &&
          removedColumnIndex < move.from
        ) {
          removedColumnIndex += 1;
        }
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
    selectDistinctColumns,
    removedColumnNames
  ) {
    return selectDistinctColumns.filter(
      columnName => !removedColumnNames.includes(columnName)
    );
  }

  static getVisibleColumnsInRange(
    tableColumns,
    left,
    right,
    movedColumns,
    hiddenColumns
  ) {
    const columns = [];
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
    tableColumns,
    startIndex,
    count,
    movedColumns,
    hiddenColumns
  ) {
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
    tableColumns,
    startIndex,
    count,
    movedColumns,
    hiddenColumns
  ) {
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
    tableColumns,
    viewportColumns,
    alwaysFetchColumnNames
  ) {
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
    columns,
    left,
    right,
    movedColumns = [],
    hiddenColumns = [],
    alwaysFetchColumnNames = [],
    bufferPages = 0
  ) {
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
   * @param {GridRange[]} ranges The ranges to get the range set for
   * @returns {dh.RangeSet} The rangeset for the provided ranges
   */
  static rangeSetFromRanges(ranges) {
    const rangeSets = ranges
      .slice()
      .sort((a, b) => a.startRow - b.startRow)
      .map(range => {
        const { startRow, endRow } = range;
        return dh.RangeSet.ofRange(startRow, endRow);
      });
    return dh.RangeSet.ofRanges(rangeSets);
  }

  /**
   * Validate whether the ranges passed in are valid to take a snapshot from.
   * Multiple selections are valid if all of the selected rows have the same columns selected.
   *
   * @param {GridRange[]} ranges The ranges to validate
   * @returns {boolean} True if the ranges are valid, false otherwise
   */
  static isValidSnapshotRanges(ranges) {
    if (!ranges || ranges.length === 0) {
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
   * @param {any} value A value to check if it's a valid table index
   */
  static isValidIndex(value) {
    return Number.isInteger(value) && value >= 0;
  }

  /**
   * Returns all columns used in any of the ranges provided
   * @param {GridRange[]} ranges The model ranges to get columns for
   * @param {dh.Column[]} allColumns All the columns to pull from
   * @returns {dh.Column[]} The columns selected in the range
   */
  static columnsFromRanges(ranges, allColumns) {
    if (!ranges || ranges.length === 0) {
      return [];
    }
    if (ranges[0].startColumn === null && ranges[0].endColumn === null) {
      // Snapshot of all the columns
      return allColumns;
    }

    const columnSet = new Set();
    for (let i = 0; i < ranges.length; i += 1) {
      const range = ranges[i];
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
   * @param {dh.TableData} data The Iris formatted table data
   * @returns {unknown[][]} A matrix of the values of the data
   */
  static snapshotDataToMatrix(data) {
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
   * @param {Array} originalColumns Original model columns
   * @param {Object} config Dehydrated rollup config
   * @param {Object} aggregationSettings Aggregation settings
   * @returns {Object} Rollup config for the model
   */
  static getModelRollupConfig(originalColumns, config, aggregationSettings) {
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

    const aggregationMap = {};
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
   * @param {Map} pendingDataMap Map of pending data
   * @returns {Map} A map with the errors in the pending data
   */
  static getPendingErrors(pendingDataMap) {
    pendingDataMap.forEach((row, rowIndex) => {
      if (!IrisGridUtils.isValidIndex(rowIndex)) {
        throw new Error('Invalid rowIndex', rowIndex);
      }

      const { data } = row;
      data.forEach((value, columnIndex) => {
        if (!IrisGridUtils.isValidIndex(columnIndex)) {
          throw new Error('Invalid columnIndex', columnIndex);
        }
      });
    });
  }

  /**
   * Retrieves a column from the provided array at the index, or `null` and logs an error if it's invalid
   *
   * @param {dh.Columns[]} columns The columns to get the column from
   * @param {Number} columnIndex The column index to get
   */
  static getColumn(columns, columnIndex) {
    if (columnIndex < columns.length) {
      return columns[columnIndex];
    }

    log.error('Unable to retrieve column', columnIndex, '>=', columns.length);

    return null;
  }

  /**
   * Retrieves a column from the provided array matching the name, or `null` and logs an error if not found
   * @param {dh.Column[]} columns The columns to get the column from
   * @param {String} columnName The column name to retrieve
   */
  static getColumnByName(columns, columnName) {
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
}

export default IrisGridUtils;
