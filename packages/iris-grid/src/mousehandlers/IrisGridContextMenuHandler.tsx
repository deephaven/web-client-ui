/* eslint class-methods-use-this: "off" */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhFilterFilled, vsRemove, vsCheck, vsFilter } from '@deephaven/icons';
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
} from '@deephaven/grid';
import dh, {
  Column,
  FilterCondition,
  FilterValue,
} from '@deephaven/jsapi-shim';
import {
  TableColumnFormatter,
  DateTimeColumnFormatter,
  TableUtils,
  SortDirection,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  DateTimeFormatContextMenu,
  DecimalFormatContextMenu,
  IntegerFormatContextMenu,
} from '../format-context-menus';
import './IrisGridContextMenuHandler.scss';
import SHORTCUTS from '../IrisGridShortcuts';
import IrisGrid, {
  assertNotNull,
  assertNotNullNorUndefined,
} from '../IrisGrid';
import { DebouncedFunc } from 'lodash';

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

  static GROUP_SORT = ContextActions.groups.high + 75;

  static GROUP_COPY = ContextActions.groups.high + 100;

  static GROUP_FORMAT = ContextActions.groups.high + 150;

  static COLUMN_SORT_DIRECTION = {
    ascending: 'ASC',
    descending: 'DESC',
    none: null,
  };

  /**
   * Get filter condition for quick filter with existed column filter and the new filter to be applied,
   * returns new filter if filters are not additive.
   * if filters are additive, returns filter conditions combined with 'and'.
   * @param {FilterCondition} columnFilter
   * @param {FilterCondition} newColumnFilter
   * @param {boolean} additive
   */
  static getQuickFilterCondition(
    columnFilter: FilterCondition,
    newColumnFilter: FilterCondition,
    additive = false
  ): FilterCondition {
    if (!additive || !columnFilter) {
      return newColumnFilter;
    }
    return columnFilter.and(newColumnFilter);
  }

  /**
   * combines filter text with '&&' if filters are additive
   * @param {String} filterText
   * @param {String} newFilterText
   * @param {boolean} additive
   */
  static getQuickFilterText(
    filterText: string,
    newFilterText: string,
    additive = false
  ): string {
    return additive && filterText
      ? `${filterText} && ${newFilterText}`
      : newFilterText;
  }

  /**
   * Gets an equality filter for the provided numeric value
   * @param {dh.Column} column The column to make the filter for
   * @param {Number} value The value to get the equality filter for
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
    value: number
  ): FilterValue {
    return TableUtils.isCharType(columnType)
      ? dh.FilterValue.ofString(String.fromCharCode(value))
      : dh.FilterValue.ofNumber(value);
  }

  irisGrid: IrisGrid;
  debouncedUpdateCustomFormat: DebouncedFunc<
    (modelIndex: any, selectedFormat: any) => void
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

  onContextMenu(
    gridPoint: GridPoint,
    grid: Grid,
    event: React.MouseEvent<Element, MouseEvent>
  ): EventHandlerResult {
    const { irisGrid } = this;
    const { y, column: columnIndex, row: rowIndex } = gridPoint;
    const modelColumn = irisGrid.getModelColumn(columnIndex);
    const modelRow = irisGrid.getModelRow(rowIndex);
    const { model, canCopy } = irisGrid.props;
    const { columns } = model;
    assertNotNullNorUndefined(modelColumn);
    assertNotNullNorUndefined(modelRow);
    const value = model.valueForCell(modelColumn, modelRow);
    const valueText = model.textForCell(modelColumn, modelRow);
    const column = columns[modelColumn];

    const actions = [] as ContextAction[];

    const {
      metrics,
      isFilterBarShown,
      reverseType,
      quickFilters,
      advancedFilters,
      searchFilter,
    } = irisGrid.state;
    const theme = irisGrid.getTheme();
    assertNotNull(metrics);
    const { columnHeaderHeight, gridY } = metrics;
    const {
      filterIconColor,
      filterBarActiveColor,
      contextMenuSortIconColor,
      contextMenuReverseIconColor,
    } = theme;
    const { onContextMenu, settings } = irisGrid.props;

    const modelSort = model.sort;
    const columnSort = TableUtils.getSortForColumn(modelSort, modelColumn);
    const hasReverse = reverseType !== TableUtils.REVERSE_TYPE.NONE;
    const dateFilterFormatter = new DateTimeColumnFormatter({
      timeZone: settings.timeZone,
      showTimeZone: false,
      showTSeparator: true,
      defaultDateTimeFormatString: CONTEXT_MENU_DATE_FORMAT,
    });
    const previewFilterFormatter = new DateTimeColumnFormatter({
      timeZone: settings.timeZone,
      showTimeZone: settings.showTimeZone,
      showTSeparator: settings.showTSeparator,
      defaultDateTimeFormatString: CONTEXT_MENU_DATE_FORMAT,
    });

    if (column != null) {
      const { table } = model;
      actions.push(
        onContextMenu({
          table,
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

    if (column != null && model.isFilterable(modelColumn)) {
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

    if (isFilterBarShown ? y <= gridY : y <= columnHeaderHeight) {
      // grid header context menu options
      if (column != null) {
        const { userColumnWidths } = metrics;
        const isColumnHidden = [...userColumnWidths.values()].some(
          columnWidth => columnWidth === 0
        );
        const isColumnFrozen = model.isColumnFrozen(modelColumn);
        actions.push({
          title: 'Hide Column',
          group: IrisGridContextMenuHandler.GROUP_HIDE_COLUMNS,
          action: () => {
            this.irisGrid.hideColumnByVisibleIndex(columnIndex);
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
          disabled: !model.isColumnMovable(modelColumn) && !isColumnFrozen,
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
            searchFilter !== null
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
            ContextActionUtils.copyToClipboard(
              model.textForColumnHeader(modelColumn)
            ).catch(e => log.error('Unable to copy header', e));
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
            actions: this.numberFormatActions(column),
          });
        }
      }
    } else {
      // grid data area context menu options
      if (column != null && rowIndex != null) {
        if (model.isFilterable(modelColumn)) {
          // cell data area contextmenu options
          const filterMenu = {
            title: 'Filter By Value',
            icon: vsRemove,
            iconColor: filterIconColor,
            group: IrisGridContextMenuHandler.GROUP_FILTER,
            order: 10,
            actions: null,
          };

          const andFilterMenu = {
            title: 'Add Filter By Value',
            icon: vsRemove,
            iconColor: filterIconColor,
            group: IrisGridContextMenuHandler.GROUP_FILTER,
            order: 20,
            actions: null,
            disabled: !quickFilters.get(modelColumn),
          };

          if (value != null) {
            // Chars get treated like numbers in terms of which filters are available
            if (
              TableUtils.isNumberType(column.type) ||
              TableUtils.isCharType(column.type)
            ) {
              // We want to show the full unformatted value if it's a number, so user knows which value they are matching
              // If it's a Char we just show the char
              const numberValueText = TableUtils.isCharType(column.type)
                ? String.fromCharCode(value)
                : `${value}`;
              filterMenu.actions = this.numberFilterActions(
                column,
                numberValueText,
                value
              );
              andFilterMenu.actions = this.numberFilterActions(
                column,
                numberValueText,
                value,
                quickFilters.get(modelColumn),
                true
              );
            } else if (TableUtils.isBooleanType(column.type)) {
              filterMenu.actions = this.booleanFilterActions(column, valueText);
              andFilterMenu.actions = this.booleanFilterActions(
                column,
                valueText,
                quickFilters.get(modelColumn),
                true
              );
            } else if (TableUtils.isDateType(column.type)) {
              const dateValueText = dateFilterFormatter.format(value);
              const previewValue = previewFilterFormatter.format(value);
              filterMenu.actions = this.dateFilterActions(
                column,
                dateValueText,
                previewValue,
                value
              );
              andFilterMenu.actions = this.dateFilterActions(
                column,
                dateValueText,
                previewValue,
                value,
                quickFilters.get(modelColumn),
                true
              );
            } else {
              filterMenu.actions = this.stringFilterActions(
                column,
                valueText,
                value
              );
              andFilterMenu.actions = this.stringFilterActions(
                column,
                valueText,
                value,
                quickFilters.get(modelColumn),
                true
              );
            }
          } else {
            filterMenu.actions = this.nullFilterActions(column);
            andFilterMenu.actions = this.nullFilterActions(
              column,
              quickFilters.get(modelColumn),
              true
            );
          }

          if (filterMenu.actions != null && filterMenu.actions.length > 0) {
            actions.push(filterMenu);
          }
          if (
            andFilterMenu.actions != null &&
            andFilterMenu.actions.length > 0
          ) {
            actions.push(andFilterMenu);
          }
        }

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
      }

      // data area, including blank space context menu options
      const { selectedRanges } = grid.state;
      if (selectedRanges.length > 0) {
        if (canCopy) {
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

        if (model.isEditable) {
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

  dateFormatActions(column) {
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
        icon: isSelected ? vsCheck : null,
        group,
        order: i,
        action: () => {
          this.irisGrid.handleFormatSelection(
            model.getColumnIndexByName(column.name),
            format
          );
        },
      });
    }
    return actions;
  }

  numberFormatActions(column) {
    const { model } = this.irisGrid.props;
    const { formatter } = model;
    const selectedFormat = formatter.getColumnFormat(column.type, column.name);
    let formatOptions;

    const columnIndex = model.getColumnIndexByName(column.name);
    if (TableUtils.isDecimalType(column.type)) {
      formatOptions = DecimalFormatContextMenu.getOptions(
        selectedFormat,
        format => {
          this.debouncedUpdateCustomFormat(columnIndex, format);
        }
      );
    } else if (TableUtils.isIntegerType(column.type)) {
      formatOptions = IntegerFormatContextMenu.getOptions(
        selectedFormat,
        format => {
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
        icon: isSelected ? vsCheck : null,
        order: i,
        action: () => {
          if (
            format &&
            format.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM
          ) {
            return;
          }
          this.irisGrid.handleFormatSelection(columnIndex, format);
        },
      });
    }
    return actions;
  }

  stringFilterActions(
    column,
    valueText,
    value,
    quickFilter = {},
    additive = false
  ) {
    const filterValue = dh.FilterValue.ofString(value);
    const { filter, text: filterText } = quickFilter;
    const actions = [];
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          &quot;{valueText}&quot;
        </div>
      ),
      order: 1,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `=${valueText}`,
            additive
          )
        );
      },
      order: 10,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!=${valueText}`,
            additive
          )
        );
      },
      order: 20,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `~${valueText}`,
            additive
          )
        );
      },
      order: 30,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!~${valueText}`,
            additive
          )
        );
      },
      order: 40,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `${valueText}*`,
            additive
          )
        );
      },
      order: 50,
    });
    actions.push({
      title: 'text ends with',
      description: `Show only rows where ${column.name} ends with ${valueText}`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            quickFilter,
            column.filter().invoke('endsWith', filterValue),
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `*${valueText}`,
            additive
          )
        );
      },
      order: 60,
    });
    return actions;
  }

  numberFilterActions(
    column,
    valueText,
    value,
    quickFilter = {},
    additive = false
  ) {
    const filterValue = IrisGridContextMenuHandler.getFilterValueForNumberOrChar(
      column.type,
      value
    );
    const { filter, text: filterText } = quickFilter;
    const actions = [];
    const isFinite =
      value !== Number.POSITIVE_INFINITY &&
      value !== Number.NEGATIVE_INFINITY &&
      !Number.isNaN(value);
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {additive ? ' AND ' : ''}&quot;{valueText}&quot;
        </div>
      ),
      order: 1,
    });
    actions.push({
      title: 'is equal to',
      description: `Show only rows where ${column.name} is ${valueText}`,
      action: () => {
        const valueFilter = IrisGridContextMenuHandler.getNumberValueEqualsFilter(
          column,
          value
        );
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            valueFilter,
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `=${valueText}`,
            additive
          )
        );
      },
      order: 10,
    });
    actions.push({
      title: 'is not equal to',
      description: `Show only rows where ${column.name} is not ${valueText}`,
      action: () => {
        const valueFilter = IrisGridContextMenuHandler.getNumberValueEqualsFilter(
          column,
          value
        ).not();
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            valueFilter,
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!=${valueText}`,
            additive
          )
        );
      },
      order: 20,
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
              additive
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `>${valueText}`,
              additive
            )
          );
        },
        order: 30,
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
              additive
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `>=${valueText}`,
              additive
            )
          );
        },
        order: 40,
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
              additive
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `<${valueText}`,
              additive
            )
          );
        },
        order: 50,
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
              additive
            ),
            IrisGridContextMenuHandler.getQuickFilterText(
              filterText,
              `<=${valueText}`,
              additive
            )
          );
        },
        order: 60,
      });
    }
    return actions;
  }

  booleanFilterActions(column, valueText, quickFilter = {}, additive = false) {
    const actions = [];
    const { filter, text: filterText } = quickFilter;
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {additive ? 'AND ' : ''}&quot;{valueText}&quot;
        </div>
      ),
      order: 1,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'true',
            additive
          )
        );
      },
      order: 10,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'false',
            additive
          )
        );
      },
      order: 20,
    });
    actions.push({
      title: 'null',
      description: `Show only rows where ${column.name} is null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            quickFilter,
            column.filter().isNull(),
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'null',
            additive
          )
        );
      },
      order: 30,
    });

    return actions;
  }

  dateFilterActions(
    column,
    valueText,
    previewValue,
    value,
    quickFilter = {},
    additive = false
  ) {
    const filterValue = dh.FilterValue.ofNumber(value);
    const { filter, text: filterText } = quickFilter;
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);

    const actions = [];

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {additive ? ' AND ' : ''}&quot;{previewValue}&quot;
        </div>
      ),
      order: 1,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `=${valueText}`,
            additive
          )
        );
      },
      order: 10,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `!=${valueText}`,
            additive
          )
        );
      },
      order: 20,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `<${valueText}`,
            additive
          )
        );
      },
      order: 30,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `<=${valueText}`,
            additive
          )
        );
      },
      order: 40,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `>${valueText}`,
            additive
          )
        );
      },
      order: 50,
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
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            `>=${valueText}`,
            additive
          )
        );
      },
      order: 60,
    });
    return actions;
  }

  nullFilterActions(column, quickFilter = {}, additive = false) {
    const { filter, text: filterText } = quickFilter;
    const actions = [];
    const { model } = this.irisGrid.props;
    const columnIndex = model.getColumnIndexByName(column.name);

    actions.push({
      menuElement: (
        <div className="iris-grid-filter-menu-item-value">
          {additive ? ' AND ' : ''}&quot;null&quot;
        </div>
      ),
      order: 1,
    });
    actions.push({
      title: 'equals null',
      description: `Show only rows where ${column.name} is null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isNull(),
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            'null',
            additive
          )
        );
      },
      order: 10,
    });
    actions.push({
      title: 'not equals null',
      description: `Show only rows where ${column.name} is not null`,
      action: () => {
        this.irisGrid.setQuickFilter(
          columnIndex,
          IrisGridContextMenuHandler.getQuickFilterCondition(
            filter,
            column.filter().isNull().not(),
            additive
          ),
          IrisGridContextMenuHandler.getQuickFilterText(
            filterText,
            '!null',
            additive
          )
        );
      },
      order: 20,
    });

    return actions;
  }

  sortByActions(column, modelColumn, columnSort) {
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
          : null,
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
          : null,
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
          : null,
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
          : null,
        iconColor: contextMenuSortIconColor,
      });
    }
    return sortActions;
  }

  additionalSortActions(column, columnIndex) {
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
                style={{ color: contextMenuSortIconColor }}
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

  checkColumnSort(columnSort, direction: string | null = null, isAbs = false) {
    if (!columnSort) {
      return false;
    }
    return columnSort.direction === direction && columnSort.isAbs === isAbs;
  }
}

export default IrisGridContextMenuHandler;
