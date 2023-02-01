/* eslint class-methods-use-this: "off" */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  dhFilterFilled,
  vsRemove,
  vsCheck,
  vsFilter,
  IconDefinition,
} from '@deephaven/icons';
import debounce from 'lodash.debounce';
import {
  ContextAction,
  ContextActions,
  ContextActionUtils,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
import {
  EventHandlerResult,
  Grid,
  GridMouseHandler,
  GridPoint,
  isEditableGridModel,
  isExpandableGridModel,
  ModelIndex,
  VisibleIndex,
} from '@deephaven/grid';
import dh, {
  Column,
  FilterCondition,
  FilterValue,
  Sort,
} from '@deephaven/jsapi-shim';
import {
  TableColumnFormatter,
  DateTimeColumnFormatter,
  TableUtils,
  TableColumnFormat,
  IntegerColumnFormat,
  SortDirection,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import type { DebouncedFunc } from 'lodash';
import { assertNotNull, copyToClipboard } from '@deephaven/utils';
import {
  DateTimeFormatContextMenu,
  DecimalFormatContextMenu,
  IntegerFormatContextMenu,
} from '../format-context-menus';
import './IrisGridContextMenuHandler.scss';
import SHORTCUTS from '../IrisGridShortcuts';
import IrisGrid from '../IrisGrid';
import { QuickFilter } from '../CommonTypes';

const log = Log.module('IrisGridContextMenuHandler');

const DEBOUNCE_UPDATE_FORMAT = 150;
const CONTEXT_MENU_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSSSSSSSS';

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
    columnFilter: FilterCondition | null | undefined,
    newColumnFilter: FilterCondition,
    operator?: '&&' | '||' | null
  ): FilterCondition {
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

  /**
   * Gets an equality filter for the provided numeric value
   * @param column The column to make the filter for
   * @param value The value to get the equality filter for
   */
  static getNumberValueEqualsFilter(
    column: Column,
    value: number
  ): FilterCondition {
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

    const filterValue = IrisGridContextMenuHandler.getFilterValueForNumberOrChar(
      column.type,
      value
    );
    return columnFilter.eq(filterValue);
  }

  static getFilterValueForNumberOrChar(
    columnType: string,
    value: unknown
  ): FilterValue {
    return TableUtils.isCharType(columnType)
      ? dh.FilterValue.ofString(String.fromCharCode(value as number))
      : dh.FilterValue.ofNumber(value);
  }

  irisGrid: IrisGrid;

  debouncedUpdateCustomFormat: DebouncedFunc<
    (modelIndex: number, selectedFormat: TableColumnFormat | null) => void
  >;

  constructor(irisGrid: IrisGrid) {
    super();

    this.debouncedUpdateCustomFormat = debounce(
      irisGrid.handleFormatSelection,
      DEBOUNCE_UPDATE_FORMAT
    );

    this.irisGrid = irisGrid;
  }

  componentWillUnmount(): void {
    this.debouncedUpdateCustomFormat.flush();
  }

  getHeaderActions(modelColumn: number, gridPoint: GridPoint): ContextAction[] {
    const { irisGrid } = this;
    const { column: columnIndex } = gridPoint;
    assertNotNull(columnIndex);
    const { model } = irisGrid.props;
    const { columns } = model;
    const column = columns[modelColumn];

    const actions = [] as ContextAction[];

    const {
      metrics,
      reverseType,
      quickFilters,
      advancedFilters,
      searchFilter,
    } = irisGrid.state;
    const theme = irisGrid.getTheme();
    assertNotNull(metrics);
    const {
      filterIconColor,
      filterBarActiveColor,
      contextMenuSortIconColor,
      contextMenuReverseIconColor,
    } = theme;

    const modelSort = model.sort;
    const columnSort = TableUtils.getSortForColumn(modelSort, modelColumn);
    const hasReverse = reverseType !== TableUtils.REVERSE_TYPE.NONE;
    const { userColumnWidths } = metrics;
    const isColumnHidden = [...userColumnWidths.values()].some(
      columnWidth => columnWidth === 0
    );
    const isColumnFrozen = model.isColumnFrozen(columnIndex as VisibleIndex);
    actions.push({
      title: 'Hide Column',
      group: IrisGridContextMenuHandler.GROUP_HIDE_COLUMNS,
      action: () => {
        this.irisGrid.hideColumnByVisibleIndex(columnIndex as VisibleIndex);
      },
    });
    actions.push({
      title: isColumnFrozen ? 'Unfreeze Column' : 'Freeze Column',
      group: IrisGridContextMenuHandler.GROUP_HIDE_COLUMNS,
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
        this.irisGrid.toggleFilterBar(columnIndex);
      },
    });
    actions.push({
      title: 'Advanced Filters',
      icon: advancedFilters.get(modelColumn) ? dhFilterFilled : vsFilter,
      iconColor: filterIconColor,
      group: IrisGridContextMenuHandler.GROUP_FILTER,
      order: 20,
      action: () => {
        this.irisGrid.handleAdvancedMenuOpened(columnIndex);
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
      actions: this.sortByActions(column, modelColumn, columnSort),
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
        (hasReverse && modelSort.length === 1) ||
        (columnSort && hasReverse && modelSort.length === 2) ||
        modelSort.length === 0,
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 20,
      actions: this.additionalSortActions(column, modelColumn),
    });
    actions.push({
      title: 'Clear Table Sorting',
      disabled:
        // reverse is a type of sort, but special and needs to be exluded despite being part of model.sort
        modelSort.length === 0 || (hasReverse && modelSort.length === 1),
      group: IrisGridContextMenuHandler.GROUP_SORT,
      action: () => {
        this.irisGrid.sortColumn(
          columnIndex,
          IrisGridContextMenuHandler.COLUMN_SORT_DIRECTION.none
        );
      },
      order: 30,
    });
    actions.push({
      title:
        reverseType === TableUtils.REVERSE_TYPE.NONE
          ? 'Reverse Table'
          : 'Clear Reverse Table',
      icon: vsRemove,
      iconColor: contextMenuReverseIconColor,
      group: IrisGridContextMenuHandler.GROUP_SORT,
      order: 40,
      disabled: !model.isReversible,
      // this just displays the shortcut, the actual listener is in irisgrid handleKeyDown
      shortcut: SHORTCUTS.TABLE.REVERSE,
      action: () => {
        if (reverseType === TableUtils.REVERSE_TYPE.NONE) {
          this.irisGrid.reverse(TableUtils.REVERSE_TYPE.POST_SORT);
        } else {
          this.irisGrid.reverse(TableUtils.REVERSE_TYPE.NONE);
        }
      },
    });
    actions.push({
      title: 'Copy Column Name',
      group: IrisGridContextMenuHandler.GROUP_COPY,
      action: () => {
        copyToClipboard(model.textForColumnHeader(modelColumn) ?? '').catch(e =>
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
    modelColumn: number | undefined | null,
    grid: Grid,
    gridPoint: GridPoint
  ): ContextAction[] {
    assertNotNull(modelColumn);
    const { irisGrid } = this;
    const { column: columnIndex, row: rowIndex } = gridPoint;
    const { model, canCopy } = irisGrid.props;
    const { columns } = model;
    const modelRow = irisGrid.getModelRow(rowIndex);
    assertNotNull(modelRow);
    const value = model.valueForCell(modelColumn, modelRow);

    const valueText = model.textForCell(modelColumn, modelRow);
    const column = columns[modelColumn];

    const actions = [] as ContextAction[];

    const { quickFilters } = irisGrid.state;
    const theme = irisGrid.getTheme();
    const { filterIconColor } = theme;
    const { settings } = irisGrid.props;

    const dateFilterFormatter = new DateTimeColumnFormatter({
      timeZone: settings?.timeZone,
      showTimeZone: false,
      showTSeparator: true,
      defaultDateTimeFormatString: CONTEXT_MENU_DATE_FORMAT,
    });
    const previewFilterFormatter = new DateTimeColumnFormatter({
      timeZone: settings?.timeZone,
      showTimeZone: settings?.showTimeZone,
      showTSeparator: settings?.showTSeparator,
      defaultDateTimeFormatString: CONTEXT_MENU_DATE_FORMAT,
    });

    if (column == null || rowIndex == null) return actions;

    // grid data area context menu options
    if (model.isFilterable(modelColumn)) {
      // cell data area contextmenu options
      const filterMenu = {
        title: 'Filter By Value',
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

      if (value == null) {
        if (quickFilters.get(modelColumn)) {
          filterMenu.actions.push({
            title: 'And',
            actions: this.nullFilterActions(
              column,
              quickFilters.get(modelColumn),
              '&&'
            ),
            order: 2,
            group: ContextActions.groups.high,
          });
        }
        filterMenu.actions.push(...this.nullFilterActions(column));
      } else if (TableUtils.isBooleanType(column.type)) {
        // boolean should have OR condition, and handles it's own null menu options
        if (quickFilters.get(modelColumn)) {
          filterMenu.actions.push({
            title: 'Or',
            actions: this.booleanFilterActions(
              column,
              valueText,
              quickFilters.get(modelColumn),
              '||'
            ),
            order: 2,
            group: ContextActions.groups.high,
          });
        }
        filterMenu.actions.push(
          ...this.booleanFilterActions(column, valueText)
        );
      } else if (
        TableUtils.isNumberType(column.type) ||
        TableUtils.isCharType(column.type)
      ) {
        // Chars get treated like numbers in terms of which filters are available
        assertNotNull(modelColumn);
        // We want to show the full unformatted value if it's a number, so user knows which value they are matching
        // If it's a Char we just show the char
        const numberValueText = TableUtils.isCharType(column.type)
          ? String.fromCharCode(value as number)
          : `${value}`;

        if (quickFilters.get(modelColumn)) {
          filterMenu.actions.push({
            title: 'And',
            actions: this.numberFilterActions(
              column,
              numberValueText,
              value,
              quickFilters.get(modelColumn),
              '&&'
            ),
            order: 2,
            group: ContextActions.groups.high,
          });
        }
        filterMenu.actions.push(
          ...this.numberFilterActions(
            column,
            numberValueText,
            value,
            quickFilters.get(modelColumn)
          )
        );
      } else if (TableUtils.isDateType(column.type)) {
        const dateValueText = dateFilterFormatter.format(value as Date);
        const previewValue = previewFilterFormatter.format(value as Date);
        if (quickFilters.get(modelColumn)) {
          filterMenu.actions.push({
            title: 'And',
            actions: this.dateFilterActions(
              column,
              dateValueText,
              previewValue,
              value,
              quickFilters.get(modelColumn),
              '&&'
            ),
            order: 2,
            group: ContextActions.groups.high,
          });
        }
        filterMenu.actions.push(
          ...this.dateFilterActions(
            column,
            dateValueText,
            previewValue,
            value,
            quickFilters.get(modelColumn)
          )
        );
      } else {
        if (quickFilters.get(modelColumn)) {
          filterMenu.actions.push({
            title: 'And',

            actions: this.stringFilterActions(
              column,
              valueText,
              value,
              quickFilters.get(modelColumn),
              '&&'
            ),
            order: 2,
            group: ContextActions.groups.high,
          });
        }
        filterMenu.actions.push(
          ...this.stringFilterActions(column, valueText, value)
        );
      }

      if (filterMenu.actions != null && filterMenu.actions.length > 0) {
        actions.push(filterMenu);
      }
    }

    // Expand/Collapse options
    if (isExpandableGridModel(model) && model.isRowExpandable(modelRow)) {
      // If there are grouped columns, then it is a rollup
      // For rollups, the column number will be the depth minus one
      let cellValue =
        model.groupedColumns.length > 0
          ? model.textForCell(model.depthForRow(modelRow) - 1, modelRow)
          : model.textForCell(0, modelRow);

      if (cellValue === '') {
        cellValue = 'null';
      }

      const getRowOptionFormatted = (
        command: string,
        cellVal: string,
        len: number
      ) => {
        let newCellVal = cellVal;
        if (command.length + cellVal.length + 3 > len) {
          newCellVal = `${cellVal.substring(0, len - command.length - 6)}...`;
        }
        return `${command} "${newCellVal}"`;
      };

      actions.push({
        title: model.isRowExpanded(modelRow)
          ? getRowOptionFormatted('Collapse', cellValue, 30)
          : getRowOptionFormatted('Expand', cellValue, 30),
        group: IrisGridContextMenuHandler.GROUP_EXPAND_COLLAPSE,
        order: 10,
        action: () => {
          model.setRowExpanded(modelRow, !model.isRowExpanded(modelRow));
        },
      });

      if (model.isExpandAllAvailable === true) {
        actions.push({
          title: getRowOptionFormatted('Expand All in', cellValue, 30),
          group: IrisGridContextMenuHandler.GROUP_EXPAND_COLLAPSE,
          order: 20,
          action: () => {
            model.setRowExpanded(modelRow, true, true);
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
      action: () => this.irisGrid.toggleGotoRow(`${rowIndex + 1}`),
    };
    actions.push(gotoRow);

    if (canCopy) {
      actions.push({
        title: 'Copy Cell',
        group: IrisGridContextMenuHandler.GROUP_COPY,
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

    return actions;
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

    const actions = [] as ContextAction[];

    if (modelColumn != null && modelRow != null) {
      const value = model.valueForCell(modelColumn, modelRow);

      const valueText = model.textForCell(modelColumn, modelRow);
      const column = columns[modelColumn];

      const { onContextMenu } = irisGrid.props;

      if (column != null) {
        actions.push(
          onContextMenu({
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

    if (modelColumn != null && model.isFilterable(modelColumn)) {
      // Clear column filter should still be available after last row
      // And should be available in both header and body context menus
      actions.push({
        title: 'Clear Column Filter',
        group: IrisGridContextMenuHandler.GROUP_FILTER,
        order: 30,
        action: () => {
          this.irisGrid.removeColumnFilter(modelColumn);
        },
        disabled: !(
          quickFilters.has(modelColumn) || advancedFilters.has(modelColumn)
        ),
      });
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
        selectedRanges.length > 0
      ) {
        actions.push({
          title: 'Delete Selected Rows',
          group: IrisGridContextMenuHandler.GROUP_EDIT,
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
      event.pageX,
      event.pageY,
      actions
    );
    return true;
  }

  dateFormatActions(column: Column): ContextAction[] {
    const { model } = this.irisGrid.props;
    const { formatter } = model;
    const selectedFormat = formatter.getColumnFormat(column.type, column.name);

    const formatOptions = DateTimeFormatContextMenu.getOptions(
      formatter,
      selectedFormat
    );

    const actions = [];

    for (let i = 0; i < formatOptions.length; i += 1) {
      const { description, format, group, isSelected, title } = formatOptions[
        i
      ];
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

  numberFormatActions(column: Column): ContextAction[] | null {
    const { model } = this.irisGrid.props;
    const { formatter } = model;
    const selectedFormat = formatter.getColumnFormat(
      column.type,
      column.name
    ) as IntegerColumnFormat;
    let formatOptions;

    const columnIndex = model.getColumnIndexByName(column.name);
    if (TableUtils.isDecimalType(column.type)) {
      formatOptions = DecimalFormatContextMenu.getOptions(
        selectedFormat,
        format => {
          assertNotNull(columnIndex);
          this.debouncedUpdateCustomFormat(columnIndex, format);
        }
      );
    } else if (TableUtils.isIntegerType(column.type)) {
      formatOptions = IntegerFormatContextMenu.getOptions(
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
    column: Column,
    valueText: string | null,
    value?: unknown,
    quickFilter?: QuickFilter,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const filterValue = dh.FilterValue.ofString(value);
    let newQuickFilter:
      | {
          filter: null | FilterCondition | undefined;
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
          &quot;{valueText}&quot;
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });

    actions.push({
      title: 'text is exactly',
      description: `Show only rows where ${column.name} is ${value} (case sensitive)`,
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
            `=${valueText}`,
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text is not exactly',
      description: `Show only rows where ${column.name} is not ${valueText} (case sensitive)`,
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
            `!=${valueText}`,
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: `text contains`,
      description: `Show only rows where ${column.name} contains ${valueText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().contains(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `~${valueText}`,
            operator
          )
        );
      },
      order: 30,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text does not contain',
      description: `Show only rows where ${column.name} does not contain ${value}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().contains(filterValue).not(),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!~${valueText}`,
            operator
          )
        );
      },
      order: 40,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text starts with',
      description: `Show only rows where ${column.name} starts with ${valueText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().invoke('startsWith', filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `${valueText}*`,
            operator
          )
        );
      },
      order: 50,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'text ends with',
      description: `Show only rows where ${column.name} ends with ${valueText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().invoke('endsWith', filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `*${valueText}`,
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
    column: Column,
    valueText: string,
    value: unknown,
    quickFilter?: QuickFilter | null,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const filterValue = IrisGridContextMenuHandler.getFilterValueForNumberOrChar(
      column.type,
      value
    );
    let filter: FilterCondition | null = null;
    let filterText: string | null = null;
    if (quickFilter) {
      filter = quickFilter.filter;
      filterText = quickFilter.text;
    }
    const actions = [];
    const isFinite =
      value !== Number.POSITIVE_INFINITY &&
      value !== Number.NEGATIVE_INFINITY &&
      !Number.isNaN(value);
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);
    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {operator
            ? IrisGridContextMenuHandler.getOperatorAsText(operator)
            : ''}{' '}
          &quot;{valueText}&quot;
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });
    actions.push({
      title: 'is equal to',
      description: `Show only rows where ${column.name} is ${valueText}`,
      action: () => {
        const valueFilter = IrisGridContextMenuHandler.getNumberValueEqualsFilter(
          column,
          value as number
        );
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            valueFilter,
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `=${valueText}`,
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'is not equal to',
      description: `Show only rows where ${column.name} is not ${valueText}`,
      action: () => {
        const valueFilter = IrisGridContextMenuHandler.getNumberValueEqualsFilter(
          column,
          value as number
        ).not();
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            valueFilter,
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!=${valueText}`,
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
    if (isFinite && !TableUtils.isCharType(column.type)) {
      actions.push({
        title: 'greater than',
        description: `Show only rows where ${column.name} is greater than ${valueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().greaterThan(filterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `>${valueText}`,
              operator
            )
          );
        },
        order: 30,
        group: ContextActions.groups.low,
      });
      actions.push({
        title: 'greater than or equal to',
        description: `Show only rows where ${column.name} is greater than or equal to ${valueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().greaterThanOrEqualTo(filterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `>=${valueText}`,
              operator
            )
          );
        },
        order: 40,
        group: ContextActions.groups.low,
      });
      actions.push({
        title: 'less than',
        description: `Show only rows where ${column.name} is less than ${valueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().lessThan(filterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `<${valueText}`,
              operator
            )
          );
        },
        order: 50,
        group: ContextActions.groups.low,
      });
      actions.push({
        title: 'less than or equal to',
        description: `Show only rows where ${column.name} is less than or equal to ${valueText}`,
        action: () => {
          this.irisGrid.setQuickFilter(
            columnIndex,
            IrisGridContextMenuHandler.getQuickFilterCondition(
              filter,
              column.filter().lessThanOrEqualTo(filterValue),
              operator
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `<=${valueText}`,
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
    column: Column,
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
    column: Column,
    valueText: string,
    previewValue: unknown,
    value: unknown,
    quickFilter?: QuickFilter | null,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    const filterValue = dh.FilterValue.ofNumber(value);

    let filter: FilterCondition | null = null;
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
          &quot;{previewValue}&quot;
        </div>
      ),
      order: 1,
      group: ContextActions.groups.high,
    });
    actions.push({
      title: 'date is',
      description: `Show only rows where ${column.name} is ${previewValue}`,
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
            `=${valueText}`,
            operator
          )
        );
      },
      order: 10,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is not',
      description: `Show only rows where ${column.name} is not ${previewValue}`,
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
            `!=${valueText}`,
            operator
          )
        );
      },
      order: 20,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is before',
      description: `Show only rows where ${column.name} is before ${previewValue}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().lessThan(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `<${valueText}`,
            operator
          )
        );
      },
      order: 30,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is before or equal',
      description: `Show only rows where ${column.name} is before or equal to ${previewValue}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().lessThanOrEqualTo(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `<=${valueText}`,
            operator
          )
        );
      },
      order: 40,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is after',
      description: `Show only rows where ${column.name} is greater than ${previewValue}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().greaterThan(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `>${valueText}`,
            operator
          )
        );
      },
      order: 50,
      group: ContextActions.groups.low,
    });
    actions.push({
      title: 'date is after or equal',
      description: `Show only rows where ${column.name} is after or equal to ${previewValue}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().greaterThanOrEqualTo(filterValue),
            operator
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `>=${valueText}`,
            operator
          )
        );
      },
      order: 60,
      group: ContextActions.groups.low,
    });
    return actions;
  }

  nullFilterActions(
    column: Column,
    quickFilter?: QuickFilter,
    operator?: '&&' | '||' | null
  ): ContextAction[] {
    let filter: FilterCondition | null = null;
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
          &quot;null&quot;
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
    column: Column,
    modelColumn: ModelIndex,
    columnSort: Sort | null
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
    column: Column,
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
              {ContextActionUtils.isMacPlatform() ? '⌘Click' : '^Click'}
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
    columnSort?: Sort | null,
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
