/* eslint class-methods-use-this: "off" */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  dhFilterFilled,
  vsRemove,
  vsCheck,
  vsFilter,
  type IconDefinition,
} from '@deephaven/icons';
import debounce from 'lodash.debounce';
import {
  type ContextAction,
  ContextActions,
  ContextActionUtils,
  GLOBAL_SHORTCUTS,
  type ResolvableContextAction,
} from '@deephaven/components';
import {
  type EventHandlerResult,
  type Grid,
  GridMouseHandler,
  type GridPoint,
  GridRange,
  GridRenderer,
  isDeletableGridModel,
  isEditableGridModel,
  isExpandableGridModel,
  type ModelIndex,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  TableColumnFormatter,
  DateTimeColumnFormatter,
  TableUtils,
  type TableColumnFormat,
  type IntegerColumnFormat,
  type SortDirection,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import type { DebouncedFunc } from 'lodash';
import {
  ClipboardPermissionsDeniedError,
  ClipboardUnavailableError,
  TextUtils,
  assertNotEmpty,
  assertNotNaN,
  assertNotNull,
  copyToClipboard,
  readFromClipboard,
} from '@deephaven/utils';
import {
  DateTimeFormatContextMenu,
  DecimalFormatContextMenu,
  IntegerFormatContextMenu,
} from '../format-context-menus';
import './IrisGridContextMenuHandler.scss';
import SHORTCUTS from '../IrisGridShortcuts';
import type IrisGrid from '../IrisGrid';
import { type QuickFilter } from '../CommonTypes';
import { isPartitionedGridModel } from '../PartitionedGridModel';

const log = Log.module('IrisGridContextMenuHandler');

const DEBOUNCE_UPDATE_FORMAT = 150;
const CONTEXT_MENU_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSSSSSSSS';
const MAX_MULTISELECT_ROWS = 1000;

/**
 * Used to eat the mouse event in the bottom right corner of the scroll bar
 */
class IrisGridContextMenuHandler extends GridMouseHandler {
  static GROUP_EDIT = ContextActions.groups.high + 10;

  static GROUP_HIDE_COLUMNS = ContextActions.groups.high + 25;

  static GROUP_FILTER = ContextActions.groups.high + 50;

  static GROUP_EXPAND_COLLAPSE = ContextActions.groups.high + 55;

  static GROUP_GOTO = ContextActions.groups.high + 60;

  static GROUP_SORT = ContextActions.groups.high + 75;

  static GROUP_COPY = ContextActions.groups.high + 100;

  static GROUP_FORMAT = ContextActions.groups.high + 150;

  static GROUP_VIEW_CONTENTS = ContextActions.groups.high + 175;

  static COLUMN_SORT_DIRECTION = {
    ascending: 'ASC',
    descending: 'DESC',
    none: null,
  } as const;

  /**
   * Get filter condition for quick filter and combines with a new filter using the operator specified,
   * returns new filter if no operator supplied.
   * @param columnFilter
   * @param newColumnFilter
   * @param operator
   */
  static getQuickFilterCondition(
    columnFilter: DhType.FilterCondition | null | undefined,
    newColumnFilter: DhType.FilterCondition,
    operator?: '&&' | '||' | null
  ): DhType.FilterCondition {
    if (columnFilter && operator === '&&') {
      return columnFilter.and(newColumnFilter);
    }
    if (columnFilter && operator === '||') {
      return columnFilter.or(newColumnFilter);
    }
    return newColumnFilter;
  }

  /**
   * combines filter text with operator if declared
   * @param filterText
   * @param newFilterText
   * @param operator
   */
  static getQuickFilterText(
    filterText: string | null | undefined,
    newFilterText: string,
    operator?: '&&' | '||' | null
  ): string {
    return operator && filterText != null
      ? `${filterText} ${operator} ${newFilterText}`
      : newFilterText;
  }

  /**
   * Converts operator to text string,
   */
  static getOperatorAsText(operator: '&&' | '||'): 'And' | 'Or' {
    return operator === '&&' ? 'And' : 'Or';
  }

  static getRowOptionFormatted(
    command: string,
    cellValue: string,
    len = 30
  ): string {
    return `${command} "${GridRenderer.truncate(
      cellValue,
      len - command.length - 3
    )}"`;
  }

  irisGrid: IrisGrid;

  debouncedUpdateCustomFormat: DebouncedFunc<
    (modelIndex: number, selectedFormat: TableColumnFormat | null) => void
  >;

  constructor(irisGrid: IrisGrid, dh: typeof DhType) {
    super();

    this.getNumberValueEqualsFilter =
      this.getNumberValueEqualsFilter.bind(this);
    this.getFilterValueForNumberOrChar =
      this.getFilterValueForNumberOrChar.bind(this);

    this.debouncedUpdateCustomFormat = debounce(
      irisGrid.handleFormatSelection,
      DEBOUNCE_UPDATE_FORMAT
    );

    this.dh = dh;
    this.irisGrid = irisGrid;
  }

  componentWillUnmount(): void {
    this.debouncedUpdateCustomFormat.flush();
  }

  dh: typeof DhType;

  getHeaderActions(
    modelIndex: ModelIndex,
    gridPoint: GridPoint
  ): ResolvableContextAction[] {
    const { irisGrid } = this;
    const { column: visibleIndex } = gridPoint;
    assertNotNull(visibleIndex);
    const { model } = irisGrid.props;
    const { columns } = model;
    const column = columns[modelIndex];

    const actions = [] as ContextAction[];

    const { metrics, reverse, quickFilters, advancedFilters, searchFilter } =
      irisGrid.state;
    const theme = irisGrid.getTheme();
    assertNotNull(metrics);
    const {
      filterIconColor,
      filterBarActiveColor,
      contextMenuSortIconColor,
      contextMenuReverseIconColor,
    } = theme;

    const modelSort = model.sort;
    const columnSort = TableUtils.getSortForColumn(modelSort, column.name);
    const { userColumnWidths } = metrics;
    const isColumnHidden = [...userColumnWidths.values()].some(
      columnWidth => columnWidth === 0
    );
    const isColumnFreezable =
      model.getColumnHeaderParentGroup(modelIndex, 0) === undefined &&
      !(isExpandableGridModel(model) && model.hasExpandableRows);
    const isColumnFrozen = model.isColumnFrozen(modelIndex);
    const isColumnSortable = model.isColumnSortable(modelIndex);
    actions.push({
      title: 'Hide Column',
      group: IrisGridContextMenuHandler.GROUP_HIDE_COLUMNS,
      action: () => {
        this.irisGrid.hideColumnByVisibleIndex(visibleIndex);
      },
    });
    actions.push({
      title: isColumnFrozen ? 'Unfreeze Column' : 'Freeze Column',
      group: IrisGridContextMenuHandler.GROUP_HIDE_COLUMNS,
      disabled: !isColumnFreezable,
      action: () => {
        if (isColumnFrozen) {
          this.irisGrid.unFreezeColumnByColumnName(column.name);
        } else {
          this.irisGrid.freezeColumnByColumnName(column.name);
        }
      },
      order: 10,
    });
    actions.push({
      title: 'Show All Columns',
      group: IrisGridContextMenuHandler.GROUP_HIDE_COLUMNS,
      action: () => {
        this.irisGrid.showAllColumns();
      },
      disabled: !isColumnHidden,
    });
    actions.push({
      title: 'Quick Filters',
      icon: vsRemove,
      iconColor: filterBarActiveColor,
      shortcut: SHORTCUTS.TABLE.TOGGLE_QUICK_FILTER,
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 10,
      action: () => {
        this.irisGrid.toggleFilterBar(visibleIndex);
      },
    });
    actions.push({
      title: 'Advanced Filters',
      icon: advancedFilters.get(modelIndex) ? dhFilterFilled : vsFilter,
      iconColor: filterIconColor,
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 20,
      action: () => {
        this.irisGrid.handleAdvancedMenuOpened(visibleIndex);
      },
    });
    actions.push({
      title: 'Clear Table Filters',
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 40,
      // this just displays the shortcut, the actual listener is in irisgrid handleKeyDown
      shortcut: SHORTCUTS.TABLE.CLEAR_FILTERS,
      action: () => {
        this.irisGrid.clearAllFilters();
      },
      disabled: !(
        quickFilters.size > 0 ||
        advancedFilters.size > 0 ||
        searchFilter != null
      ),
    });
    actions.push({
      title: 'Sort by',
      icon: vsRemove,
      iconColor: contextMenuSortIconColor,
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 10,
      actions: this.sortByActions(column, modelIndex, columnSort),
      disabled: !isColumnSortable,
    });
    actions.push({
      title: 'Add Additional Sort',
      /**
       * disable conditions:
       * 1. table is sorted only by this column
       * 2. table is only reversed
       * 3. 1 & 2 combined
       * 4. table has no sort
       * reverse is a type of sort, so needs to be accounted for in exclusions
       * */
      disabled:
        (columnSort && modelSort.length === 1) ||
        (reverse && modelSort.length === 1) ||
        (columnSort && reverse && modelSort.length === 2) ||
        modelSort.length === 0 ||
        !isColumnSortable,
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 20,
      actions: this.additionalSortActions(column, modelIndex),
    });
    actions.push({
      title: 'Clear Table Sorting',
      disabled:
        // reverse is a type of sort, but special and needs to be exluded despite being part of model.sort
        modelSort.length === 0 || (reverse && modelSort.length === 1),
      group: IrisGridContextMenuHandler.GROUP_SORT,
      action: () => {
        this.irisGrid.sortColumn(
          visibleIndex,
          IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.none
        );
      },
      order: 30,
    });
    actions.push({
      title: reverse ? 'Clear Reverse Table' : 'Reverse Table',
      icon: vsRemove,
      iconColor: contextMenuReverseIconColor,
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 40,
      disabled: !model.isReversible,
      // this just displays the shortcut, the actual listener is in irisgrid handleKeyDown
      shortcut: SHORTCUTS.TABLE.REVERSE,
      action: () => {
        this.irisGrid.reverse(!reverse);
      },
    });
    actions.push({
      title: 'Copy Column Name',
      group: IrisGridContextMenuHandler.GROUP_COPY,
      shortcutText: ContextActionUtils.isMacPlatform() ? '⌥Click' : 'Alt+Click',
      action: () => {
        copyToClipboard(model.textForColumnHeader(modelIndex) ?? '').catch(e =>
          log.error('Unable to copy header', e)
        );
      },
    });

    if (TableUtils.isDateType(column.type)) {
      actions.push({
        title: 'Date/Time Format',
        group: IrisGridContextMenuHandler.GROUP_FORMAT,
        actions: this.dateFormatActions(column),
      });
    } else if (TableUtils.isNumberType(column.type)) {
      actions.push({
        title: 'Number Format',
        group: IrisGridContextMenuHandler.GROUP_FORMAT,
        actions: this.numberFormatActions(column) ?? undefined,
      });
    }
    return actions;
  }

  getCellActions(
    modelColumn: ModelIndex,
    grid: Grid,
    gridPoint: GridPoint
  ): ContextAction[] {
    const { irisGrid } = this;
    const { column: columnIndex, row: rowIndex } = gridPoint;
    const { model, canCopy } = irisGrid.props;
    const { columns } = model;
    const modelRow = irisGrid.getModelRow(rowIndex);
    assertNotNull(modelRow);
    const sourceCell = model.sourceForCell(modelColumn, modelRow);
    const { column: sourceColumn, row: sourceRow } = sourceCell;
    const value = model.valueForCell(sourceColumn, sourceRow);

    const column = columns[sourceColumn];

    const actions = [] as ContextAction[];

    const theme = irisGrid.getTheme();
    const { filterIconColor } = theme;

    if (column == null || rowIndex == null) return actions;

    // Expand/Collapse options
    if (isExpandableGridModel(model) && model.isRowExpandable(sourceRow)) {
      // If there are grouped columns, then it is a rollup
      // The first column will be the "group" column with the value that should be expanded
      const expandingColumn = 0;
      const cellValue = model.valueForCell(expandingColumn, sourceRow);
      const cellText =
        cellValue == null
          ? 'null'
          : model.textForCell(expandingColumn, sourceRow);

      actions.push({
        title: IrisGridContextMenuHandler.getRowOptionFormatted(
          model.isRowExpanded(sourceRow) ? 'Collapse' : 'Expand',
          cellText
        ),
        group: IrisGridContextMenuHandler.GROUP_EXPAND_COLLAPSE,
        order: 10,
        action: () => {
          model.setRowExpanded(sourceRow, !model.isRowExpanded(sourceRow));
        },
      });

      if (model.isExpandAllAvailable === true) {
        actions.push({
          title: IrisGridContextMenuHandler.getRowOptionFormatted(
            'Expand All in',
            cellText
          ),
          group: IrisGridContextMenuHandler.GROUP_EXPAND_COLLAPSE,
          order: 20,
          action: () => {
            model.setRowExpanded(sourceRow, true, true);
          },
        });
      }
    }

    if (
      isExpandableGridModel(model) &&
      model.hasExpandableRows &&
      model.isExpandAllAvailable === true
    ) {
      actions.push({
        title: 'Expand Entire Table',
        group: IrisGridContextMenuHandler.GROUP_EXPAND_COLLAPSE,
        order: 30,
        action: () => {
          model.expandAll();
        },
      });

      actions.push({
        title: 'Collapse Entire Table',
        group: IrisGridContextMenuHandler.GROUP_EXPAND_COLLAPSE,
        order: 40,
        action: () => {
          model.collapseAll();
        },
      });
    }

    const gotoRow = {
      title: 'Go to',
      iconColor: filterIconColor,
      shortcut: SHORTCUTS.TABLE.GOTO_ROW,
      group: IrisGridContextMenuHandler.GROUP_GOTO,
      order: 10,
      action: () =>
        this.irisGrid.toggleGotoRow(`${rowIndex + 1}`, `${value}`, column.name),
    };
    actions.push(gotoRow);

    if (canCopy) {
      actions.push({
        title: 'Copy Cell',
        group: IrisGridContextMenuHandler.GROUP_COPY,
        shortcutText: ContextActionUtils.isMacPlatform()
          ? '⌥Click'
          : 'Alt+Click',
        order: 10,
        action: () => {
          irisGrid.copyCell(columnIndex, rowIndex);
        },
      });

      actions.push({
        title: 'Copy Cell Unformatted',
        group: IrisGridContextMenuHandler.GROUP_COPY,
        order: 20,
        action: () => {
          irisGrid.copyCell(columnIndex, rowIndex, true);
        },
      });
    }

    actions.push({
      title: 'Paste',
      group: IrisGridContextMenuHandler.GROUP_COPY,
      order: 50,
      action: async () => {
        try {
          const text = await readFromClipboard();
          const items = text.split('\n').map(row => row.split('\t'));
          await grid.pasteValue(items);
        } catch (err) {
          if (err instanceof ClipboardUnavailableError) {
            irisGrid.handleOpenNoPastePermissionModal(
              'For security reasons your browser does not allow access to your clipboard on click.'
            );
          } else if (err instanceof ClipboardPermissionsDeniedError) {
            irisGrid.handleOpenNoPastePermissionModal(
              'Requested clipboard permissions have not been granted, please grant them and try again.'
            );
          } else {
            throw err;
          }
        }
      },
    });

    actions.push({
      title: 'View Cell Contents',
      group: IrisGridContextMenuHandler.GROUP_VIEW_CONTENTS,
      order: 10,
      action: () => {
        irisGrid.setState({
          showOverflowModal: true,
          overflowText: irisGrid.getValueForCell(
            columnIndex,
            rowIndex
          ) as string,
        });
      },
    });

    if (isPartitionedGridModel(model) && !model.isPartitionAwareSourceTable) {
      actions.push({
        title: 'View Constituent Table',
        group: IrisGridContextMenuHandler.GROUP_VIEW_CONTENTS,
        order: 40,
        action: () => {
          irisGrid.selectPartitionKeyFromTable(rowIndex);
        },
      });
    }

    return actions;
  }

  // moved out of getCellActions since snapshots are async
  async getCellFilterActions(
    modelColumn: ModelIndex,
    grid: Grid,
    gridPoint: GridPoint
  ): Promise<ContextAction[]> {
    const { dh, irisGrid } = this;
    const { row: rowIndex } = gridPoint;
    const { model } = irisGrid.props;
    const { columns } = model;
    const modelRow = irisGrid.getModelRow(rowIndex);
    const { getSelectedRanges } = grid;
    assertNotNull(modelRow);
    const sourceCell = model.sourceForCell(modelColumn, modelRow);
    const { column: sourceColumn, row: sourceRow } = sourceCell;
    const column = columns[sourceColumn];

    if (column == null || rowIndex == null) return [];
    if (!model.isFilterable(sourceColumn)) return [];

    const { quickFilters } = irisGrid.state;
    const theme = irisGrid.getTheme();
    const { filterIconColor } = theme;
    const { settings } = irisGrid.props;

    let selectedRanges = [...getSelectedRanges()];
    // no selected range (i.e. right clicked a cell without highlighting it)
    // although GridSelectionMouseHandler does change selectedRanges, state isn't updated in
    //   time for getSelectedRanges to show the selected cell
    if (selectedRanges.length === 0) {
      selectedRanges.push(
        new GridRange(sourceColumn, sourceRow, sourceColumn, sourceRow)
      );
    }

    // - this block truncates the selected ranges to MAX_MULTISELECT_ROWS rows
    //   - NOT first MAX_MULTISELECT_ROWS rows after the first row
    //   - NOT first MAX_MULTISELECT_ROWS unique values (prevent case where there are a small
    //     amount of values, but a large amount of rows with those values)
    if (GridRange.containsCell(selectedRanges, sourceColumn, sourceRow)) {
      let rowCount = GridRange.rowCount(selectedRanges);
      while (rowCount > MAX_MULTISELECT_ROWS) {
        const lastRow = selectedRanges.pop();
        // should never occur, sanity check
        assertNotNull(lastRow, 'Selected ranges should not be empty');

        const lastRowSize = GridRange.rowCount([lastRow]);
        // should never occur, sanity check
        assertNotNaN(lastRowSize, 'Selected ranges should not be unbounded');

        // if removing the last rows makes it dip below the max, then need to
        //   bring it back but truncated
        if (rowCount - lastRowSize < MAX_MULTISELECT_ROWS) {
          // nullish operator to make TS happy, but the check above should prevent this
          selectedRanges.push(
            new GridRange(
              lastRow.startColumn,
              lastRow.startRow,
              lastRow.endColumn,
              (lastRow.endRow ?? 0) - (rowCount - MAX_MULTISELECT_ROWS)
            )
          );
          break;
        }
        rowCount -= lastRowSize;
      }
    } else {
      // if the block is not in the selected ranges, meaning the user must've right-clicked
      // outside the selected ranges`
      selectedRanges = [
        new GridRange(sourceColumn, sourceRow, sourceColumn, sourceRow),
      ];
    }

    // this should be non empty
    //  - valid selected ranges will always have a startRow and endRow
    //  - if there are no selected ranges, then one with sourceColumn/Row is added
    assertNotEmpty(selectedRanges);

    // get the snapshot values, but ignore all null/undefined values
    const snapshot = await model.snapshot(selectedRanges);
    const snapshotValues = new Set();
    for (let i = 0; i < snapshot.length; i += 1) {
      if (snapshot[i].length === 1) {
        // if the selected range has start/end columns defined, so the snapshot is a 1D array of the row
        if (snapshot[i][0] != null) {
          snapshotValues.add(snapshot[i][0]);
        }
      } else if (snapshot[i][sourceColumn] != null) {
        // if the selected range is an entire row
        snapshotValues.add(snapshot[i][sourceColumn]);
      }
    }
    // if snapshotValues is empty here, it means all of the snapshot's values were null/undefined

    const filterMenu = {
      title: `Filter by Value${snapshotValues.size > 1 ? 's' : ''}`,
      icon: vsRemove,
      iconColor: filterIconColor,
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 10,
      actions: [],
    } as {
      title: string;
      icon: IconDefinition;
      iconColor: string;
      group: number;
      order: number;
      actions: ContextAction[];
    };

    // only made of null/undefineds
    if (snapshotValues.size === 0) {
      // null gets a special menu
      if (quickFilters.get(sourceColumn)) {
        filterMenu.actions.push({
          title: 'And',
          actions: this.nullFilterActions(
            column,
            quickFilters.get(sourceColumn),
            '&&'
          ),
          order: 2,
          group: ContextActions.groups.high,
        });
      }
      filterMenu.actions.push(...this.nullFilterActions(column));
    } else if (snapshotValues.size === 1 && snapshotValues.has('')) {
      // empty string gets a special menu
      if (quickFilters.get(sourceColumn)) {
        filterMenu.actions.push({
          title: 'And',

          actions: this.emptyStringFilterActions(
            column,
            quickFilters.get(sourceColumn),
            '&&'
          ),
          order: 2,
          group: ContextActions.groups.high,
        });
      }
      filterMenu.actions.push(...this.emptyStringFilterActions(column));
    } else if (TableUtils.isBooleanType(column.type)) {
      // boolean should have OR condition, and handles it's own null menu options
      if (quickFilters.get(sourceColumn)) {
        filterMenu.actions.push({
          title: 'Or',
          actions: this.booleanFilterActions(
            column,
            model.textForCell(sourceColumn, sourceRow),
            quickFilters.get(sourceColumn),
            '||'
          ),
          order: 2,
          group: ContextActions.groups.high,
        });
      }
      filterMenu.actions.push(
        ...this.booleanFilterActions(
          column,
          model.textForCell(sourceColumn, sourceRow)
        )
      );
    } else if (
      TableUtils.isNumberType(column.type) ||
      TableUtils.isCharType(column.type)
    ) {
      // Chars get treated like numbers in terms of which filters are available
      assertNotNull(sourceColumn);

      if (quickFilters.get(sourceColumn)) {
        filterMenu.actions.push({
          title: 'And',
          actions: this.numberFilterActions(
            column,
            snapshotValues as Set<number>,
            quickFilters.get(sourceColumn),
            '&&'
          ),
          order: 2,
          group: ContextActions.groups.high,
        });
      }
      filterMenu.actions.push(
        ...this.numberFilterActions(
          column,
          snapshotValues as Set<number>,
          quickFilters.get(sourceColumn)
        )
      );
    } else if (TableUtils.isDateType(column.type)) {
      const dateFilterFormatter = new DateTimeColumnFormatter(dh, {
        timeZone: settings?.timeZone,
        showTimeZone: false,
        showTSeparator: true,
        defaultDateTimeFormatString: CONTEXT_MENU_DATE_FORMAT,
      });
      const previewFilterFormatter = new DateTimeColumnFormatter(dh, {
        timeZone: settings?.timeZone,
        showTimeZone: settings?.showTimeZone,
        showTSeparator: settings?.showTSeparator,
        defaultDateTimeFormatString: CONTEXT_MENU_DATE_FORMAT,
      });
      if (quickFilters.get(sourceColumn)) {
        filterMenu.actions.push({
          title: 'And',
          actions: this.dateFilterActions(
            column,
            snapshotValues as Set<Date>,
            dateFilterFormatter,
            previewFilterFormatter,
            quickFilters.get(sourceColumn),
            '&&'
          ),
          order: 2,
          group: ContextActions.groups.high,
        });
      }
      filterMenu.actions.push(
        ...this.dateFilterActions(
          column,
          snapshotValues as Set<Date>,
          dateFilterFormatter,
          previewFilterFormatter,
          quickFilters.get(sourceColumn)
        )
      );
    } else {
      if (quickFilters.get(sourceColumn)) {
        filterMenu.actions.push({
          title: 'And',
          actions: this.stringFilterActions(
            column,
            snapshotValues as Set<string>,
            quickFilters.get(sourceColumn),
            '&&'
          ),
          order: 2,
          group: ContextActions.groups.high,
        });
      }
      filterMenu.actions.push(
        ...this.stringFilterActions(column, snapshotValues as Set<string>)
      );
    }
    return [filterMenu];
  }

  /**
   * Gets an equality filter for the provided numeric value
   * @param column The column to make the filter for
   * @param value The value to get the equality filter for
   */
  getNumberValueEqualsFilter(
    column: DhType.Column,
    value: number
  ): DhType.FilterCondition {
    const { dh } = this;
    const columnFilter = column.filter();
    if (value === Number.POSITIVE_INFINITY) {
      return dh.FilterCondition.invoke('isInf', columnFilter).and(
        columnFilter.greaterThan(dh.FilterValue.ofNumber(0))
      );
    }
    if (value === Number.NEGATIVE_INFINITY) {
      return dh.FilterCondition.invoke('isInf', columnFilter).and(
        columnFilter.lessThan(dh.FilterValue.ofNumber(0))
      );
    }
    if (Number.isNaN(value)) {
      return dh.FilterCondition.invoke('isNaN', columnFilter);
    }

    const filterValue = this.getFilterValueForNumberOrChar(column.type, value);
    return columnFilter.eq(filterValue);
  }

  getFilterValueForNumberOrChar(
    columnType: string,
    value: unknown
  ): DhType.FilterValue {
    const { dh } = this;
    return TableUtils.isCharType(columnType)
      ? dh.FilterValue.ofString(String.fromCharCode(value as number))
      : dh.FilterValue.ofNumber(value as number);
  }

  onContextMenu(
    gridPoint: GridPoint,
    grid: Grid,
    event: React.MouseEvent<Element, MouseEvent>
  ): EventHandlerResult {
    const { irisGrid } = this;
    const {
      y,
      column: columnIndex,
      row: rowIndex,
      columnHeaderDepth,
    } = gridPoint;
    const modelColumn = irisGrid.getModelColumn(columnIndex);
    const modelRow = irisGrid.getModelRow(rowIndex);

    const { model, canCopy } = irisGrid.props;
    const { columns } = model;

    const {
      metrics,
      isFilterBarShown,
      quickFilters,
      advancedFilters,
      selectedRanges,
    } = irisGrid.state;

    assertNotNull(metrics);

    const { columnHeaderHeight, gridY, columnHeaderMaxDepth } = metrics;

    const actions: ResolvableContextAction[] = [];

    if (modelColumn != null && modelRow != null) {
      const sourceCell = model.sourceForCell(modelColumn, modelRow ?? 0);
      const { column: sourceColumn, row: sourceRow } = sourceCell;
      const value = model.valueForCell(sourceColumn, sourceRow);
      const valueText = model.textForCell(sourceColumn, sourceRow);
      const column = columns[sourceColumn];

      const { onContextMenu } = irisGrid.props;

      if (column != null) {
        actions.push(
          ...onContextMenu({
            model,
            value,
            valueText,
            column,
            rowIndex,
            columnIndex,
            modelRow,
            modelColumn,
          })
        );
      }
    }

    if (modelColumn != null) {
      const clearFilterRange = model.getClearFilterRange(modelColumn);
      if (clearFilterRange != null && clearFilterRange.length > 0) {
        // Clear column filter should still be available after last row
        // And should be available in both header and body context menus
        actions.push({
          title:
            clearFilterRange[1] - clearFilterRange[0] > 0
              ? 'Clear Group Filter'
              : 'Clear Column Filter',
          group: IrisGridContextMenuHandler.GROUP_FILTER,
          order: 30,
          action: () => {
            this.irisGrid.removeColumnFilter(clearFilterRange);
          },
          disabled:
            !Array.from(quickFilters.keys()).some(
              col => col >= clearFilterRange[0] && col <= clearFilterRange[1]
            ) &&
            !Array.from(advancedFilters.keys()).some(
              col => col >= clearFilterRange[0] && col <= clearFilterRange[1]
            ),
        });
      }
    }

    if (
      isFilterBarShown
        ? y <= gridY
        : y <= columnHeaderHeight * columnHeaderMaxDepth &&
          columnHeaderDepth === 0
    ) {
      // grid header context menu options
      if (modelColumn != null) {
        actions.push(...this.getHeaderActions(modelColumn, gridPoint));
      }
    } else {
      // grid body context menu options
      if (modelColumn != null && modelRow != null) {
        actions.push(...this.getCellActions(modelColumn, grid, gridPoint));
        actions.push(this.getCellFilterActions(modelColumn, grid, gridPoint));
      }

      // blank space context menu options
      if (canCopy && selectedRanges.length > 0) {
        actions.push({
          title: 'Copy Selection',
          shortcut: GLOBAL_SHORTCUTS.COPY,
          group: IrisGridContextMenuHandler.GROUP_COPY,
          order: 30,
          action: () => {
            irisGrid.copyRanges(selectedRanges);
          },
        });

        actions.push({
          title: 'Copy Selection w/ Headers',
          group: IrisGridContextMenuHandler.GROUP_COPY,
          order: 40,
          action: () => {
            irisGrid.copyRanges(selectedRanges, true);
          },
        });
      }

      if (
        isEditableGridModel(model) &&
        model.isEditable &&
        selectedRanges.length > 0 &&
        isDeletableGridModel(model) &&
        model.isDeletable
      ) {
        actions.push({
          title: 'Delete Selected Rows',
          group: IrisGridContextMenuHandler.GROUP_EDIT,
          disabled: !model.isDeletableRanges(selectedRanges),
          order: 50,
          action: () => {
            this.irisGrid.deleteRanges(selectedRanges);
          },
        });
      }
    }

    if (actions.length === 0) {
      return false;
    }

    assertNotNull(irisGrid.gridWrapper);

    ContextActions.triggerMenu(
      irisGrid.gridWrapper,
      event.clientX,
      event.clientY,
      actions
    );
    return true;
  }

  dateFormatActions(column: DhType.Column): ContextAction[] {
    const { model } = this.irisGrid.props;
    const { formatter } = model;
    const selectedFormat = formatter.getColumnFormat(column.type, column.name);

    const formatOptions = DateTimeFormatContextMenu.getOptions(
      formatter,
      selectedFormat
    );

    const actions = [];

    for (let i = 0; i < formatOptions.length; i += 1) {
      const { description, format, group, isSelected, title } =
        formatOptions[i];
      actions.push({
        title,
        description,
        icon: isSelected ? vsCheck : undefined,
        group,
        order: i,
        action: () => {
          const modelIndex = model.getColumnIndexByName(column.name);
          assertNotNull(modelIndex);
          this.irisGrid.handleFormatSelection(modelIndex, format);
        },
      });
    }
    return actions;
  }

  numberFormatActions(column: DhType.Column): ContextAction[] | null {
    const { model } = this.irisGrid.props;
    const { formatter } = model;
    const { dh } = this;
    const selectedFormat = formatter.getColumnFormat(
      column.type,
      column.name
    ) as IntegerColumnFormat;
    let formatOptions;

    const columnIndex = model.getColumnIndexByName(column.name);
    if (TableUtils.isDecimalType(column.type)) {
      formatOptions = DecimalFormatContextMenu.getOptions(
        dh,
        selectedFormat,
        format => {
          assertNotNull(columnIndex);
          this.debouncedUpdateCustomFormat(columnIndex, format);
        }
      );
    } else if (TableUtils.isIntegerType(column.type)) {
      formatOptions = IntegerFormatContextMenu.getOptions(
        dh,
        selectedFormat,
        format => {
          assertNotNull(columnIndex);
          this.debouncedUpdateCustomFormat(columnIndex, format);
        }
      );
    } else {
      log.error('Invalid column type in numberFormatActions');
      return null;
    }

    const actions = [];

    for (let i = 0; i < formatOptions.length; i += 1) {
      const { format, isSelected } = formatOptions[i];
      actions.push({
        ...formatOptions[i],
        icon: isSelected ? vsCheck : undefined,
        order: i,
        action: () => {
          if (
            columnIndex === undefined &&
            format &&
            format.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM
          ) {
            return;
          }
          assertNotNull(columnIndex);
          this.irisGrid.handleFormatSelection(columnIndex, format);
        },
      });
    }
    return actions;
  }

  stringFilterActions(
    column: DhType.Column,
    snapshotValues: Set<string>,
    quickFilter?: QuickFilter,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const { dh } = this;
    const values = Array.from(snapshotValues.keys());
    const filterValues = values.map(value => dh.FilterValue.ofString(value));
    const valueDescription =
      filterValues.length === 1 ? filterValues[0] : 'the selected values';

    let newQuickFilter:
      | {
          filter: null | DhType.FilterCondition | undefined;
          text: string | null;
        }
      | undefined
      | null = quickFilter;
    if (!newQuickFilter) {
      newQuickFilter = { filter: null, text: null };
    }
    const { filter, text: filterText } = newQuickFilter;
    const actions = [];
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);

    const toFilterText = (item: string) =>
      TableUtils.escapeQuickTextFilter(item) ?? '';

    assertNotNull(columnIndex);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          {TextUtils.join(
            values.slice(0, 20).map(value => `"${toFilterText(value)}"`)
          )}
          {values.length > 1 && (
            <div className="iris-grid-filter-menu-subtitle">
              ({values.length} values selected)
            </div>
          )}
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });

    actions.push({
      title: 'text is exactly',
      description: `Show only rows where ${column.name} is ${valueDescription} (case sensitive)`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            filterValues
              .map(filterValue => column.filter().eq(filterValue))
              .reduce((prev, curr) => prev.or(curr)),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(toFilterText).join(' || '),
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text is not exactly',
      description: `Show only rows where ${column.name} is not ${valueDescription} (case sensitive)`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            filterValues
              .map(filterValue => column.filter().notEq(filterValue))
              .reduce((prev, curr) => prev.and(curr)),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `!=${toFilterText(value)}`).join(' && '),
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: `text contains`,
      description: `Show only rows where ${column.name} contains ${valueDescription}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column
              .filter()
              .isNull()
              .not()
              .and(
                filterValues
                  .map(filterValue => column.filter().contains(filterValue))
                  .reduce((prev, curr) => prev.or(curr))
              ),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `~${toFilterText(value)}`).join(' || '),
            operator
          )
        );
      },
      order: 30,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text does not contain',
      description: `Show only rows where ${column.name} does not contain ${valueDescription}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column
              .filter()
              .isNull()
              .or(
                filterValues
                  .map(filterValue =>
                    column.filter().contains(filterValue).not()
                  )
                  .reduce((prev, curr) => prev.and(curr))
              ),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `!~${toFilterText(value)}`).join(' && '),
            operator
          )
        );
      },
      order: 40,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text starts with',
      description: `Show only rows where ${column.name} starts with ${valueDescription}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column
              .filter()
              .isNull()
              .not()
              .and(
                filterValues
                  .map(filterValue =>
                    column.filter().invoke('startsWith', filterValue)
                  )
                  .reduce((prev, curr) => prev.or(curr))
              ),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `${toFilterText(value)}*`).join(' || '),
            operator
          )
        );
      },
      order: 50,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text ends with',
      description: `Show only rows where ${column.name} ends with ${valueDescription}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column
              .filter()
              .isNull()
              .not()
              .and(
                filterValues
                  .map(filterValue =>
                    column.filter().invoke('endsWith', filterValue)
                  )
                  .reduce((prev, curr) => prev.or(curr))
              ),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `*${toFilterText(value)}`).join(' || '),
            operator
          )
        );
      },
      order: 60,
      group: ContextActions.groups.low,
    });
    return actions;
  }

  numberFilterActions(
    column: DhType.Column,
    snapshotValues: Set<number>,
    quickFilter?: QuickFilter | null,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const values = Array.from(snapshotValues.keys());
    const valueDesc = values.length === 1 ? `${values}` : 'the selected values';
    // We want to show the full unformatted value if it's a number, so user knows which value they are matching
    // If it's a Char we just show the char
    const toFilterText = (item: number) =>
      TableUtils.isCharType(column.type)
        ? String.fromCharCode(item as number)
        : `${item}`;

    let filter: DhType.FilterCondition | null = null;
    let filterText: string | null = null;
    if (quickFilter) {
      filter = quickFilter.filter;
      filterText = quickFilter.text;
    }
    const actions = [];
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);
    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          {TextUtils.join(
            values.slice(0, 20).map(value => `"${toFilterText(value)}"`)
          )}
          {values.length > 1 && (
            <div className="iris-grid-filter-menu-subtitle">
              ({values.length} values selected)
            </div>
          )}
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });
    actions.push({
      title: 'is equal to',
      description: `Show only rows where ${column.name} is ${valueDesc}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            values
              .map(value =>
                this.getNumberValueEqualsFilter(column, value as number)
              )
              .reduce((acc, curr) => acc.or(curr)),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `=${toFilterText(value)}`).join(' || '),
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'is not equal to',
      description: `Show only rows where ${column.name} is not ${valueDesc}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            values
              .map(value =>
                this.getNumberValueEqualsFilter(column, value as number).not()
              )
              .reduce((acc, curr) => acc.and(curr)),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values.map(value => `!=${toFilterText(value)}`).join(' && '),
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });

    // IDS-6092 Less/greater than filters don't make sense for Infinite/NaN
    // TODO (DH-11799): These char filters should work in Bard, with the merge for DH-11040: https://gitlab.eng.illumon.com/illumon/iris/merge_requests/5801
    // They do not work in Powell though, so disable them.
    if (
      !snapshotValues.has(Number.NaN) &&
      !snapshotValues.has(Number.POSITIVE_INFINITY) &&
      !snapshotValues.has(Number.NEGATIVE_INFINITY) &&
      !TableUtils.isCharType(column.type)
    ) {
      // get the min/max because these are all ge/ne filters
      const maxValue = values.reduce((a, b) => (a > b ? a : b));
      const minValue = values.reduce((a, b) => (a < b ? a : b));
      const maxFilterValue = this.getFilterValueForNumberOrChar(
        column.type,
        maxValue
      );
      const minFilterValue = this.getFilterValueForNumberOrChar(
        column.type,
        minValue
      );
      const maxValueText = `${maxFilterValue}`;
      const minValueText = `${minFilterValue}`;

      actions.push({
        title: 'greater than',
        description: `Show only rows where ${column.name} is greater than ${maxValueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().greaterThan(maxFilterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `>${toFilterText(maxValue)}`,
              operator
            )
          );
        },
        order: 30,
        group: ContextActions.groups.low,
      });
      actions.push({
        title: 'greater than or equal to',
        description: `Show only rows where ${column.name} is greater than or equal to ${maxValueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().greaterThanOrEqualTo(maxFilterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `>=${toFilterText(maxValue)}`,
              operator
            )
          );
        },
        order: 40,
        group: ContextActions.groups.low,
      });
      actions.push({
        title: 'less than',
        description: `Show only rows where ${column.name} is less than ${minValueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().lessThan(minFilterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `<${toFilterText(minValue)}`,
              operator
            )
          );
        },
        order: 50,
        group: ContextActions.groups.low,
      });
      actions.push({
        title: 'less than or equal to',
        description: `Show only rows where ${column.name} is less than or equal to ${minValueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().lessThanOrEqualTo(minFilterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `<=${toFilterText(minValue)}`,
              operator
            )
          );
        },
        order: 60,
        group: ContextActions.groups.low,
      });
    }

    return actions;
  }

  booleanFilterActions(
    column: DhType.Column,
    valueText: string | null,
    quickFilter?: QuickFilter | null,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const actions: ContextAction[] = [];

    const { model } = this.irisGrid.props;
    const { filter, text: filterText } = quickFilter || {};
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          &quot;{valueText ?? 'null'}&quot;
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });

    actions.push({
      title: 'true',
      description: `Show only rows where ${column.name} is true`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isTrue(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'true',
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'false',
      description: `Show only rows where ${column.name} is false`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isFalse(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'false',
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'is null',
      description: `Show only rows where ${column.name} is null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isNull(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'null',
            operator
          )
        );
      },
      order: 30,
      group: ContextActions.groups.low,
    });

    actions.push({
      title: 'is not null',
      description: `Show only rows where ${column.name} is not null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isNull().not(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            '!null',
            operator
          )
        );
      },
      order: 40,
      group: ContextActions.groups.low,
    });

    return actions;
  }

  dateFilterActions(
    column: DhType.Column,
    snapshotValues: Set<unknown>,
    dateFilterFormatter: DateTimeColumnFormatter,
    previewFilterFormatter: DateTimeColumnFormatter,
    quickFilter?: QuickFilter | null,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const { dh } = this;

    const values = Array.from(snapshotValues.keys()) as DhType.DateWrapper[];
    const filterValues = values.map(value => dh.FilterValue.ofNumber(value));
    const valueDesc =
      filterValues.length === 1
        ? previewFilterFormatter.format(values[0])
        : 'the selected values';

    const maxValue = values.reduce((a, b) => (a > b ? a : b));
    const minValue = values.reduce((a, b) => (a < b ? a : b));
    const maxFilterValue = dh.FilterValue.ofNumber(maxValue);
    const minFilterValue = dh.FilterValue.ofNumber(minValue);
    const maxDateText = dateFilterFormatter.format(maxValue);
    const minDateText = dateFilterFormatter.format(minValue);
    const maxPreviewText = previewFilterFormatter.format(maxValue);
    const minPreviewText = previewFilterFormatter.format(minValue);

    let filter: DhType.FilterCondition | null = null;
    let filterText: string | null = null;
    if (quickFilter) {
      filter = quickFilter.filter;
      filterText = quickFilter.text;
    }
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);

    const actions = [];

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          {TextUtils.join(
            values
              .slice(0, 20)
              .map(value => `"${previewFilterFormatter.format(value)}"`)
          )}
          {values.length > 1 && (
            <div className="iris-grid-filter-menu-subtitle">
              ({values.length} values selected)
            </div>
          )}
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });
    actions.push({
      title: 'date is',
      description: `Show only rows where ${column.name} is ${valueDesc}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            filterValues
              .map(valueFilter => column.filter().eq(valueFilter))
              .reduce((acc, curr) => acc.or(curr)),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values
              .map(value => `=${dateFilterFormatter.format(value)}`)
              .join(' || '),
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is not',
      description: `Show only rows where ${column.name} is not ${valueDesc}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            filterValues
              .map(valueFilter => column.filter().notEq(valueFilter))
              .reduce((acc, curr) => acc.and(curr)),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            values
              .map(value => `!=${dateFilterFormatter.format(value)}`)
              .join(' && '),
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is before',
      description: `Show only rows where ${column.name} is before ${minPreviewText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().lessThan(minFilterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `<${minDateText}`,
            operator
          )
        );
      },
      order: 30,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is before or equal',
      description: `Show only rows where ${column.name} is before or equal to ${minPreviewText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().lessThanOrEqualTo(minFilterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `<=${minDateText}`,
            operator
          )
        );
      },
      order: 40,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is after',
      description: `Show only rows where ${column.name} is greater than ${maxPreviewText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().greaterThan(maxFilterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `>${maxDateText}`,
            operator
          )
        );
      },
      order: 50,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is after or equal',
      description: `Show only rows where ${column.name} is after or equal to ${maxPreviewText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().greaterThanOrEqualTo(maxFilterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `>=${maxDateText}`,
            operator
          )
        );
      },
      order: 60,
      group: ContextActions.groups.low,
    });
    return actions;
  }

  emptyStringFilterActions(
    column: DhType.Column,
    quickFilter?: QuickFilter,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const { dh } = this;
    const filterValue = dh.FilterValue.ofString('');
    let newQuickFilter:
      | {
          filter: null | DhType.FilterCondition | undefined;
          text: string | null;
        }
      | undefined
      | null = quickFilter;
    if (!newQuickFilter) {
      newQuickFilter = { filter: null, text: null };
    }
    const { filter, text: filterText } = newQuickFilter;
    const actions = [];
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          <i className="text-muted">empty</i>
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });

    actions.push({
      title: 'is empty string',
      description: `Show only rows where ${column.name} is empty`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().eq(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `=`,
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'is not empty string',
      description: `Show only rows where ${column.name} is not empty`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().notEq(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!=`,
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });

    return actions;
  }

  nullFilterActions(
    column: DhType.Column,
    quickFilter?: QuickFilter,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    let filter: DhType.FilterCondition | null = null;
    let filterText: string | null = null;
    if (quickFilter) {
      filter = quickFilter.filter;
      filterText = quickFilter.text;
    }
    const actions = [];
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          <i className="text-muted">null</i>
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });
    actions.push({
      title: 'is null',
      description: `Show only rows where ${column.name} is null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isNull(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'null',
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'is not null',
      description: `Show only rows where ${column.name} is not null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isNull().not(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            '!null',
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });

    return actions;
  }

  sortByActions(
    column: DhType.Column,
    modelColumn: ModelIndex,
    columnSort: DhType.Sort | null
  ): ContextAction[] {
    const theme = this.irisGrid.getTheme();
    const { contextMenuSortIconColor } = theme;
    const sortActions = [
      {
        title: `${column.name} Ascending`,
        order: 10,
        action: () => {
          this.irisGrid.sortColumn(
            modelColumn,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.ascending
          );
        },
        icon: this.checkColumnSort(
          columnSort,
          IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.ascending
        )
          ? vsRemove
          : undefined,
        iconColor: contextMenuSortIconColor,
      },
      {
        title: `${column.name} Descending`,
        order: 20,
        action: () => {
          this.irisGrid.sortColumn(
            modelColumn,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.descending
          );
        },
        icon: this.checkColumnSort(
          columnSort,
          IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.descending
        )
          ? vsRemove
          : undefined,
        iconColor: contextMenuSortIconColor,
      },
      {
        title: `Remove Sort`,
        order: 50,
        action: () => {
          this.irisGrid.sortColumn(
            modelColumn,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.none,
            false,
            true
          );
        },
        disabled: !columnSort,
      },
    ];
    if (TableUtils.isNumberType(column.type)) {
      sortActions.push({
        title: `ABS(${column.name}) Ascending`,
        order: 30,
        action: () => {
          this.irisGrid.sortColumn(
            modelColumn,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.ascending,
            true
          );
        },
        icon: this.checkColumnSort(
          columnSort,
          IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.ascending,
          true
        )
          ? vsRemove
          : undefined,
        iconColor: contextMenuSortIconColor,
      });
      sortActions.push({
        title: `ABS(${column.name})  Descending`,
        order: 40,
        action: () => {
          this.irisGrid.sortColumn(
            modelColumn,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.descending,
            true
          );
        },
        icon: this.checkColumnSort(
          columnSort,
          IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.descending,
          true
        )
          ? vsRemove
          : undefined,
        iconColor: contextMenuSortIconColor,
      });
    }
    return sortActions;
  }

  additionalSortActions(
    column: DhType.Column,
    columnIndex: ModelIndex
  ): ContextAction[] {
    const theme = this.irisGrid.getTheme();
    const { contextMenuSortIconColor } = theme;
    const additionalSortActions = [
      {
        title: 'Add Sort By',
        menuElement: (
          <div className="btn-context-menu menu-title">
            <span className="icon">
              <FontAwesomeIcon
                icon={vsRemove}
                style={{ color: contextMenuSortIconColor ?? undefined }}
              />
            </span>
            <span className="title">Add Additional Sort</span>
            <span className="shortcut">
              {ContextActionUtils.isMacPlatform() ? '⌘Click' : 'Ctrl+Click'}
            </span>
          </div>
        ),
        order: 1,
      },
      {
        title: `${column.name} Ascending`,
        order: 10,
        action: () => {
          this.irisGrid.sortColumn(
            columnIndex,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.ascending,
            false,
            true
          );
        },
      },
      {
        title: `${column.name} Descending`,
        order: 20,
        action: () => {
          this.irisGrid.sortColumn(
            columnIndex,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.descending,
            false,
            true
          );
        },
      },
    ];
    if (TableUtils.isNumberType(column.type)) {
      additionalSortActions.push({
        title: `ABS(${column.name}) Ascending`,
        order: 30,
        action: () => {
          this.irisGrid.sortColumn(
            columnIndex,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.ascending,
            true,
            true
          );
        },
      });
      additionalSortActions.push({
        title: `ABS(${column.name})  Descending`,
        order: 40,
        action: () => {
          this.irisGrid.sortColumn(
            columnIndex,
            IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.descending,
            true,
            true
          );
        },
      });
    }
    return additionalSortActions;
  }

  checkColumnSort(
    columnSort?: DhType.Sort | null,
    direction: SortDirection = null,
    isAbs = false
  ): boolean {
    if (!columnSort) {
      return false;
    }
    return columnSort.direction === direction && columnSort.isAbs === isAbs;
  }
}

export default IrisGridContextMenuHandler;
