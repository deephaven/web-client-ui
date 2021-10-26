import Log from '@deephaven/log';
import dh from '@deephaven/jsapi-shim';
import { PromiseUtils, TextUtils, TimeoutError } from '@deephaven/utils';
import DateUtils from './DateUtils';
import { FilterType, FilterOperator } from './filters';

const log = Log.module('TableUtils');

/** Utility class to provide some functions for working with tables */
class TableUtils {
  static dataType = {
    BOOLEAN: 'boolean',
    CHAR: 'char',
    DATETIME: 'datetime',
    DECIMAL: 'decimal',
    INT: 'int',
    STRING: 'string',
  };

  static sortDirection = {
    ascending: 'ASC',
    descending: 'DESC',
    reverse: 'REVERSE',
    none: null,
  };

  static REVERSE_TYPE = Object.freeze({
    NONE: 'none',
    PRE_SORT: 'pre-sort',
    POST_SORT: 'post-sort',
  });

  // Regex looking for a negative or positive integer or decimal number
  static NUMBER_REGEX = /^-?\d+(\.\d+)?$/;

  static getSortIndex(sort, columnIndex) {
    for (let i = 0; i < sort.length; i += 1) {
      const s = sort[i];
      if (s.column?.index === columnIndex) {
        return i;
      }
    }

    return null;
  }

  /**
   * @param {dh.Sort[]} tableSort The sorts from the table to get the sort from
   * @param {number} columnIndex The index of the column to get the sort for
   * @return {dh.Sort} The sort for the column, or null if it's not sorted
   */
  static getSortForColumn(tableSort, columnIndex) {
    const sortIndex = TableUtils.getSortIndex(tableSort, columnIndex);
    if (sortIndex != null) {
      return tableSort[sortIndex];
    }
    return null;
  }

  static getFilterText(filter) {
    if (filter) {
      return filter.toString();
    }
    return null;
  }

  /** Return the valid filter types for the column */
  static getFilterTypes(columnType) {
    if (TableUtils.isBooleanType(columnType)) {
      return [FilterType.isTrue, FilterType.isFalse, FilterType.isNull];
    }
    if (
      TableUtils.isNumberType(columnType) ||
      TableUtils.isDateType(columnType)
    ) {
      return [
        FilterType.eq,
        FilterType.notEq,
        FilterType.greaterThan,
        FilterType.greaterThanOrEqualTo,
        FilterType.lessThan,
        FilterType.lessThanOrEqualTo,
      ];
    }
    if (TableUtils.isTextType(columnType)) {
      return [
        FilterType.eq,
        FilterType.eqIgnoreCase,
        FilterType.notEq,
        FilterType.notEqIgnoreCase,
        FilterType.contains,
        FilterType.notContains,
        FilterType.startsWith,
        FilterType.endsWith,
      ];
    }
    return [];
  }

  static getNextSort(table, columnIndex) {
    if (
      !table ||
      !table.columns ||
      columnIndex < 0 ||
      columnIndex >= table.columns.length
    ) {
      return null;
    }

    const sort = TableUtils.getSortForColumn(table.sort, columnIndex);
    if (sort === null) {
      return table.columns[columnIndex].sort().asc();
    }
    if (sort.direction === TableUtils.sortDirection.ascending) {
      return sort.desc();
    }
    return null;
  }

  static makeColumnSort(table, columnIndex, direction, isAbs) {
    if (
      !table ||
      !table.columns ||
      columnIndex < 0 ||
      columnIndex >= table.columns.length
    ) {
      return null;
    }

    if (direction === TableUtils.sortDirection.none) {
      return null;
    }

    let sort = table.columns[columnIndex].sort();

    switch (direction) {
      case TableUtils.sortDirection.ascending:
        sort = sort.asc();
        break;
      case TableUtils.sortDirection.descending:
        sort = sort.desc();
        break;
      default:
        break;
    }
    if (isAbs) {
      sort = sort.abs();
    }
    return sort;
  }

  /**
   * Toggles the sort for the specified column
   * @param {array} sorts The current sorts from IrisGrid.state
   * @param {dh.Table} table The table to apply the sort to
   * @param {number} columnIndex The column index to apply the sort to
   * @param {boolean} addToExisting Add this sort to the existing sort
   */
  static toggleSortForColumn(sorts, table, columnIndex, addToExisting = false) {
    if (!table || columnIndex < 0 || columnIndex >= table.columns.length) {
      return [];
    }

    const newSort = TableUtils.getNextSort(table, columnIndex);

    return TableUtils.setSortForColumn(
      sorts,
      columnIndex,
      newSort,
      addToExisting
    );
  }

  static sortColumn(table, modelColumn, direction, isAbs, addToExisting) {
    if (!table || modelColumn < 0 || modelColumn >= table.columns.length) {
      return [];
    }

    const newSort = TableUtils.makeColumnSort(
      table,
      modelColumn,
      direction,
      isAbs
    );

    return TableUtils.setSortForColumn(
      table.sort,
      modelColumn,
      newSort,
      addToExisting
    );
  }

  /**
   * Sets the sort for the given column *and* removes any reverses
   * @param {dh.Sort[]} tableSort The current sorts from IrisGrid.state
   * @param {number} columnIndex The column index to apply the sort to
   * @param {dh.Sort} sort The sort object to add
   * @param {boolean} addToExisting Add this sort to the existing sort
   * @returns {array} Returns the modified array of sorts - removing reverses
   */
  static setSortForColumn(tableSort, columnIndex, sort, addToExisting = false) {
    const sortIndex = TableUtils.getSortIndex(tableSort, columnIndex);
    let sorts = [];
    if (addToExisting) {
      sorts = sorts.concat(
        tableSort.filter(
          ({ direction }) => direction !== TableUtils.sortDirection.reverse
        )
      );
      if (sortIndex !== null) {
        sorts.splice(sortIndex, 1);
      }
    }

    if (sort !== null) {
      sorts.push(sort);
    }

    return sorts;
  }

  static getNormalizedType(columnType) {
    switch (columnType) {
      case 'boolean':
      case 'java.lang.Boolean':
      case TableUtils.dataType.BOOLEAN:
        return TableUtils.dataType.BOOLEAN;
      case 'char':
      case 'java.lang.Character':
      case TableUtils.dataType.CHAR:
        return TableUtils.dataType.CHAR;
      case 'java.lang.String':
      case TableUtils.dataType.STRING:
        return TableUtils.dataType.STRING;
      case 'io.deephaven.db.tables.utils.DBDateTime':
      case 'com.illumon.iris.db.tables.utils.DBDateTime':
      case TableUtils.dataType.DATETIME:
        return TableUtils.dataType.DATETIME;
      case 'double':
      case 'java.lang.Double':
      case 'float':
      case 'java.lang.Float':
      case TableUtils.dataType.DECIMAL:
        return TableUtils.dataType.DECIMAL;
      case 'int':
      case 'java.lang.Integer':
      case 'long':
      case 'java.lang.Long':
      case 'short':
      case 'java.lang.Short':
      case 'byte':
      case 'java.lang.Byte':
      case TableUtils.dataType.INT:
        return TableUtils.dataType.INT;
      default:
        return null;
    }
  }

  static isLongType(columnType) {
    switch (columnType) {
      case 'long':
      case 'java.lang.Long':
        return true;
      default:
        return false;
    }
  }

  static isDateType(columnType) {
    switch (columnType) {
      case 'io.deephaven.db.tables.utils.DBDateTime':
      case 'com.illumon.iris.db.tables.utils.DBDateTime':
        return true;
      default:
        return false;
    }
  }

  static isNumberType(columnType) {
    return (
      TableUtils.isIntegerType(columnType) ||
      TableUtils.isDecimalType(columnType)
    );
  }

  static isIntegerType(columnType) {
    switch (columnType) {
      case 'int':
      case 'java.lang.Integer':
      case 'java.math.BigInteger':
      case 'long':
      case 'java.lang.Long':
      case 'short':
      case 'java.lang.Short':
      case 'byte':
      case 'java.lang.Byte':
        return true;
      default:
        return false;
    }
  }

  static isDecimalType(columnType) {
    switch (columnType) {
      case 'double':
      case 'java.lang.Double':
      case 'java.math.BigDecimal':
      case 'float':
      case 'java.lang.Float':
        return true;
      default:
        return false;
    }
  }

  static isBooleanType(columnType) {
    switch (columnType) {
      case 'boolean':
      case 'java.lang.Boolean':
        return true;
      default:
        return false;
    }
  }

  static isTextType(columnType) {
    switch (columnType) {
      case 'char':
      case 'java.lang.Character':
      case 'java.lang.String':
        return true;
      default:
        return false;
    }
  }

  /**
   * Get base column type
   * @param {string} columnType Column type
   * @returns {string} Element type for array columns, original type for non-array columns
   */
  static getBaseType(columnType) {
    return columnType.split('[]')[0];
  }

  /**
   * Check if the column types are compatible
   * @param {string} type1 Column type to check
   * @param {string} type2 Column type to check
   * @returns {boolean} True, if types are compatible
   */
  static isCompatibleType(type1, type2) {
    return (
      TableUtils.getNormalizedType(type1) ===
      TableUtils.getNormalizedType(type2)
    );
  }

  /**
   * Create filter with the provided column and text. Handles multiple filters joined with && or ||
   * @param {dh.Column} column The column to set the filter on
   * @param {string} text The text string to create the filter from
   * @param {string} timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns {dh.FilterCondition} Returns the created filter, null if text could not be parsed
   */
  static makeQuickFilter(column, text, timeZone) {
    const orComponents = text.split('||');
    let orFilter = null;
    for (let i = 0; i < orComponents.length; i += 1) {
      const orComponent = orComponents[i];
      const andComponents = orComponent.split('&&');
      let andFilter = null;
      for (let j = 0; j < andComponents.length; j += 1) {
        const andComponent = andComponents[j].trim();
        if (andComponent.length > 0) {
          const filter = TableUtils.makeQuickFilterFromComponent(
            column,
            andComponent,
            timeZone
          );
          if (filter) {
            if (andFilter) {
              andFilter = andFilter.and(filter);
            } else {
              andFilter = filter;
            }
          } else {
            throw new Error(`Unable to parse quick filter from text ${text}`);
          }
        }
      }

      if (orFilter) {
        orFilter = orFilter.or(andFilter);
      } else {
        orFilter = andFilter;
      }
    }

    return orFilter;
  }

  /**
   * Create filter with the provided column and text of one component (no multiple conditions)
   * @param {dh.Column} column The column to set the filter on
   * @param {string} text The text string to create the filter from
   * @param {string} timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns {dh.FilterCondition} Returns the created filter, null if text could not be parsed
   */
  static makeQuickFilterFromComponent(column, text, timeZone) {
    const { type } = column;
    if (TableUtils.isNumberType(type)) {
      return this.makeQuickNumberFilter(column, text);
    }
    if (TableUtils.isBooleanType(type)) {
      return this.makeQuickBooleanFilter(column, text);
    }
    if (TableUtils.isDateType(type)) {
      return this.makeQuickDateFilter(column, text, timeZone);
    }
    return this.makeQuickTextFilter(column, text);
  }

  static makeQuickNumberFilter(column, text) {
    if (text == null) {
      return null;
    }

    const columnFilter = column.filter();
    let filter = null;

    const regex = /\s*(>=|<=|=>|=<|>|<|!=|=|!)?(\s*-\s*)?(\s*\d*(?:,\d{3})*(?:\.\d*)?\s*)?(null|nan|infinity|inf|\u221E)?(.*)/i;
    const result = regex.exec(text);

    let operation = null;
    let negativeSign = null;
    let value = null;
    let abnormalValue = null; // includes nan, null and infinity(positive & negative)
    let overflow = null;

    if (result.length > 3) {
      [, operation, negativeSign, value, abnormalValue, overflow] = result;
    }

    if (overflow != null && overflow.trim().length > 0) {
      // Some bad characters after the number, bail out!
      return null;
    }

    if (operation == null) {
      operation = '=';
    }

    if (value == null && abnormalValue == null) {
      return null;
    }

    if (abnormalValue != null) {
      if (!(operation === '=' || operation === '!' || operation === '!=')) {
        // only equal and not equal operations are supported for abnormal value filter
        return null;
      }
      abnormalValue = abnormalValue.trim().toLowerCase();
      switch (abnormalValue) {
        case 'null':
          filter = columnFilter.isNull();
          break;
        case 'nan':
          filter = dh.FilterCondition.invoke('isNaN', columnFilter);
          break;
        case 'infinity':
        case 'inf':
        case '\u221E':
          if (negativeSign != null) {
            filter = dh.FilterCondition.invoke('isInf', columnFilter).and(
              columnFilter.lessThan(dh.FilterValue.ofNumber(0))
            );
          } else {
            filter = dh.FilterCondition.invoke('isInf', columnFilter).and(
              columnFilter.greaterThan(dh.FilterValue.ofNumber(0))
            );
          }
          break;
        default:
          break;
      }
      if (operation === '!' || operation === '!=') {
        filter = filter.not();
      }
      return filter;
    }

    value = TableUtils.removeCommas(value);
    if (TableUtils.isLongType(column.type)) {
      try {
        value = dh.FilterValue.ofNumber(
          dh.LongWrapper.ofString(`${negativeSign != null ? '-' : ''}${value}`)
        );
      } catch (error) {
        log.warn('Unable to create long filter', error);
        return null;
      }
    } else {
      value = parseFloat(value);
      if (value == null || Number.isNaN(value)) {
        return null;
      }

      value = dh.FilterValue.ofNumber(negativeSign != null ? 0 - value : value);
    }

    filter = column.filter();

    switch (operation) {
      case '=':
        return filter.eq(value);
      case '<':
        return filter.lessThan(value);
      case '<=':
      case '=<':
        return filter.lessThanOrEqualTo(value);
      case '>':
        return filter.greaterThan(value);
      case '>=':
      case '=>':
        return filter.greaterThanOrEqualTo(value);
      case '!=':
      case '!':
        return filter.notEq(value);
      default:
        return null;
    }
  }

  static makeQuickTextFilter(column, text) {
    if (text == null) {
      return null;
    }

    const cleanText = `${text}`.trim();
    const regex = /^(!~|!=|~|=|!)?(.*)/;
    const result = regex.exec(cleanText);

    let operation = null;
    let value = null;
    if (result.length > 2) {
      [, operation, value] = result;
      if (value != null) {
        value = value.trim();
      }
    }

    if (value == null || value.length === 0) {
      return null;
    }

    if (operation == null) {
      operation = '=';
    }

    const filter = column.filter();
    if (value.toLowerCase() === 'null') {
      // Null is a special case!
      switch (operation) {
        case '=':
          return filter.isNull();
        case '!=':
        case '!':
          return filter.isNull().not();
        default:
          return null;
      }
    }

    let prefix = null;
    let suffix = null;
    if (value.startsWith('*')) {
      prefix = '*';
      value = value.substring(1);
    } else if (value.endsWith('*') && !value.endsWith('\\*')) {
      suffix = '*';
      value = value.substring(0, value.length - 1);
    }

    value = value.replace('\\', '');

    switch (operation) {
      case '~': {
        return filter
          .isNull()
          .not()
          .and(
            filter.invoke(
              'matches',
              dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E.*`)
            )
          );
      }
      case '!~':
        return filter
          .isNull()
          .or(
            filter
              .invoke(
                'matches',
                dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E.*`)
              )
              .not()
          );
      case '!=':
        if (prefix === '*') {
          // Does not end with
          return filter
            .isNull()
            .or(
              filter
                .invoke(
                  'matches',
                  dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E$`)
                )
                .not()
            );
        }
        if (suffix === '*') {
          // Does not start with
          return filter
            .isNull()
            .or(
              filter
                .invoke(
                  'matches',
                  dh.FilterValue.ofString(`(?s)(?i)^\\Q${value}\\E.*`)
                )
                .not()
            );
        }
        return filter.notEqIgnoreCase(
          dh.FilterValue.ofString(value.toLowerCase())
        );

      case '=':
        if (prefix === '*') {
          // Ends with
          return filter
            .isNull()
            .not()
            .and(
              filter.invoke(
                'matches',
                dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E$`)
              )
            );
        }
        if (suffix === '*') {
          // Starts with
          return filter
            .isNull()
            .not()
            .and(
              filter.invoke(
                'matches',
                dh.FilterValue.ofString(`(?s)(?i)^\\Q${value}\\E.*`)
              )
            );
        }
        return filter.eqIgnoreCase(
          dh.FilterValue.ofString(value.toLowerCase())
        );

      default:
        break;
    }

    return null;
  }

  static makeQuickBooleanFilter(column, text) {
    if (text == null) {
      return null;
    }

    const regex = /^(!=|=|!)?(.*)/;
    const result = regex.exec(`${text}`.trim());
    const [, operation, value] = result;
    const notEqual = operation === '!' || operation === '!=';
    const cleanValue = value.trim().toLowerCase();

    let filter = column.filter();

    try {
      const boolValue = TableUtils.makeBooleanValue(cleanValue);
      if (boolValue) {
        filter = filter.isTrue();
      } else if (boolValue === null) {
        filter = filter.isNull();
      } else {
        filter = filter.isFalse();
      }

      return notEqual ? filter.not() : filter;
    } catch (e) {
      return null;
    }
  }

  /**
   * Builds a date filter parsed from the text string which may or may not include an operator.
   * @param {Column} column The column to build the filter from, with or without a leading operator.
   * @param {string} text The date string text to parse.
   */
  static makeQuickDateFilter(column, text, timeZone) {
    const cleanText = text.trim();
    const regex = /\s*(>=|<=|=>|=<|>|<|!=|!|=)?(.*)/;
    const result = regex.exec(cleanText);
    if (result == null || result.length <= 2) {
      throw new Error(`Unable to parse date filter: ${text}`);
    }

    let operation = null;
    let dateText = null;

    [, operation, dateText] = result;

    let filterOperation = FilterType.eq;
    switch (operation) {
      case '<':
        filterOperation = FilterType.lessThan;
        break;
      case '<=':
      case '=<':
        filterOperation = FilterType.lessThanOrEqualTo;
        break;
      case '>':
        filterOperation = FilterType.greaterThan;
        break;
      case '>=':
      case '=>':
        filterOperation = FilterType.greaterThanOrEqualTo;
        break;
      case '!=':
      case '!':
        filterOperation = FilterType.notEq;
        break;
      case '=':
      case '==':
      default:
        filterOperation = FilterType.eq;
        break;
    }

    return TableUtils.makeQuickDateFilterWithOperation(
      column,
      dateText,
      filterOperation,
      timeZone
    );
  }

  /**
   * Builds a date filter parsed from the text string with the provided filter.
   * @param {Column} column The column to build the filter from.
   * @param {string} text The date string text to parse, without an operator.
   * @param {FilterType} operation The filter operation to use.
   * @param {string} timeZone The time zone to make this filter with. E.g. America/New_York
   */
  static makeQuickDateFilterWithOperation(
    column,
    text,
    operation = FilterType.eq,
    timeZone
  ) {
    if (column == null) {
      throw new Error('Column is null');
    }

    const [startDate, endDate] = DateUtils.parseDateRange(text, timeZone);

    const startValue =
      startDate != null ? dh.FilterValue.ofNumber(startDate) : null;
    const endValue = endDate != null ? dh.FilterValue.ofNumber(endDate) : null;

    const filter = column.filter();
    if (startValue == null && endValue == null) {
      return operation === FilterType.notEq
        ? filter.isNull().not()
        : filter.isNull();
    }

    switch (operation) {
      case FilterType.eq: {
        if (endValue != null) {
          const startFilter = filter.greaterThanOrEqualTo(startValue);
          const endFilter = filter.lessThan(endValue);
          return startFilter.and(endFilter);
        }
        return filter.eq(startValue);
      }
      case FilterType.lessThan: {
        return filter.lessThan(startValue);
      }
      case FilterType.lessThanOrEqualTo: {
        if (endValue != null) {
          return filter.lessThan(endValue);
        }
        return filter.lessThanOrEqualTo(startValue);
      }
      case FilterType.greaterThan: {
        if (endValue != null) {
          return filter.greaterThanOrEqualTo(endValue);
        }
        return filter.greaterThan(startValue);
      }
      case FilterType.greaterThanOrEqualTo:
        return filter.greaterThanOrEqualTo(startValue);
      case FilterType.notEq: {
        if (endValue != null) {
          const startFilter = filter.lessThan(startValue);
          const endFilter = filter.greaterThanOrEqualTo(endValue);
          return startFilter.or(endFilter);
        }
        return filter.notEq(startValue);
      }

      default:
        throw new Error(`Invalid operator: ${operation}`);
    }
  }

  /**
   * Wraps a table promise in a cancelable promise that will close the table if the promise is cancelled.
   * Use in a component that loads a table, and call cancel when unmounting.
   * @param {Promise<dh.Table> | dh.Table} table The table promise to wrap
   */
  static makeCancelableTablePromise(table) {
    return PromiseUtils.makeCancelable(table, resolved => {
      resolved.close();
    });
  }

  /**
   * Make a cancelable promise for a one-shot table event with a timeout.
   * @param {dh.Table|dh.TreeTable} table Table to listen for events on
   * @param {string} eventName Event to listen for
   * @param {number} timeout Event timeout in milliseconds, defaults to 0
   * @param {function} matcher Optional function to determine if the promise can be resolved or stays pending
   * @returns {Promise} Resolves with the event data
   */
  static makeCancelableTableEventPromise(
    table,
    eventName,
    timeout = 0,
    matcher = null
  ) {
    let eventCleanup = null;
    let timeoutId = null;
    let isPending = true;
    const wrappedPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        eventCleanup();
        isPending = false;
        reject(new TimeoutError(`Event "${eventName}" timed out.`));
      }, timeout);
      eventCleanup = table.addEventListener(eventName, event => {
        if (matcher != null && !matcher(event)) {
          log.debug2('Event triggered, but matcher returned false.');
          return;
        }
        log.debug2('Event triggered, resolving.');
        eventCleanup();
        clearTimeout(timeoutId);
        isPending = false;
        resolve(event);
      });
    });
    wrappedPromise.cancel = () => {
      if (isPending) {
        log.debug2('Pending promise cleanup.');
        eventCleanup();
        clearTimeout(timeoutId);
        isPending = false;
        return;
      }
      log.debug2('Ignoring non-pending promise cancel.');
    };
    return wrappedPromise;
  }

  static makeAdvancedFilter(column, options, timeZone) {
    const {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues,
    } = options;
    let filter = null;
    for (let i = 0; i < filterItems.length; i += 1) {
      const filterItem = filterItems[i];
      const { selectedType, value } = filterItem;
      if (
        selectedType != null &&
        selectedType.length > 0 &&
        value != null &&
        value.length > 0
      ) {
        try {
          const newFilter = TableUtils.makeAdvancedValueFilter(
            column,
            selectedType,
            value,
            timeZone
          );
          if (newFilter != null) {
            if (i === 0) {
              filter = newFilter;
            } else if (filter !== null && i - 1 < filterOperators.length) {
              const filterOperator = filterOperators[i - 1];
              if (filterOperator === FilterOperator.and) {
                filter = filter.and(newFilter);
              } else if (filterOperator === FilterOperator.or) {
                filter = filter.or(newFilter);
              } else {
                log.error(
                  'Unexpected filter operator',
                  filterOperator,
                  newFilter
                );
                filter = null;
                break;
              }
            }
          } else {
            log.debug2('Empty filter ignored for', selectedType, value);
          }
        } catch (err) {
          log.error('Unable to create filter', err);
          filter = null;
          break;
        }
      }
    }

    const selectValueFilter = TableUtils.makeSelectValueFilter(
      column,
      selectedValues,
      invertSelection
    );
    if (selectValueFilter != null) {
      if (filter != null) {
        filter = filter.and(selectValueFilter);
      } else {
        filter = selectValueFilter;
      }
    }
    return filter;
  }

  static removeCommas(value) {
    return value.replace(/[\s|,]/g, '');
  }

  /**
   * @param {String} columnType The column type to make the filter value from.
   * @param {String} value The value to make the filter value from.
   * @returns {dh.FilterValue} The FilterValue item for this column/value combination
   */
  static makeFilterValue(columnType, value) {
    const type = TableUtils.getBaseType(columnType);
    if (TableUtils.isTextType(type)) {
      return dh.FilterValue.ofString(value);
    }
    if (TableUtils.isLongType(type)) {
      return dh.FilterValue.ofNumber(
        dh.LongWrapper.ofString(TableUtils.removeCommas(value))
      );
    }

    return dh.FilterValue.ofNumber(TableUtils.removeCommas(value));
  }

  /**
   * Takes a value and converts it to an `dh.FilterValue`
   *
   * @param {String} columnType The column type to make the filter value from.
   * @param {unknown} value The value to actually set
   * @returns {dh.FilterValue} The FilterValue item for this column/value combination
   */
  static makeFilterRawValue(columnType, rawValue) {
    if (TableUtils.isTextType(columnType)) {
      return dh.FilterValue.ofString(rawValue);
    }

    if (TableUtils.isBooleanType(columnType)) {
      return dh.FilterValue.ofBoolean(rawValue);
    }

    return dh.FilterValue.ofNumber(rawValue);
  }

  /**
   * Converts a string value to a value appropriate for the column
   * @param {string} columnType The column type to make the value for
   * @param {string} text The string value to make a type for
   * @param {string} timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   */
  static makeValue(columnType, text, timeZone) {
    if (text == null || text === 'null') {
      return null;
    }
    if (TableUtils.isTextType(columnType)) {
      return text;
    }
    if (TableUtils.isLongType(columnType)) {
      return dh.LongWrapper.ofString(TableUtils.removeCommas(text));
    }
    if (TableUtils.isBooleanType(columnType)) {
      return TableUtils.makeBooleanValue(text, true);
    }
    if (TableUtils.isDateType(columnType)) {
      const [date] = DateUtils.parseDateRange(text, timeZone);
      return date;
    }

    if (TableUtils.isNumberType(columnType)) {
      return TableUtils.makeNumberValue(text);
    }

    log.error('Unexpected column type', columnType);
    return null;
  }

  static makeBooleanValue(text, allowEmpty = false) {
    if (text === '' && allowEmpty) {
      return null;
    }

    switch (text?.toLowerCase()) {
      case 'null':
        return null;
      case '0':
      case 'f':
      case 'fa':
      case 'fal':
      case 'fals':
      case 'false':
      case 'n':
      case 'no':
        return false;
      case '1':
      case 't':
      case 'tr':
      case 'tru':
      case 'true':
      case 'y':
      case 'ye':
      case 'yes':
        return true;
      default:
        throw new Error(`Invalid boolean '${text}'`);
    }
  }

  static makeNumberValue(text) {
    if (text == null || text === 'null' || text === '') {
      return null;
    }

    const cleanText = text.toLowerCase().trim();
    if (cleanText === '∞' || cleanText === 'infinity' || cleanText === 'inf') {
      return Number.POSITIVE_INFINITY;
    }
    if (
      cleanText === '-∞' ||
      cleanText === '-infinity' ||
      cleanText === '-inf'
    ) {
      return Number.NEGATIVE_INFINITY;
    }

    const numberText = TableUtils.removeCommas(cleanText);
    if (TableUtils.NUMBER_REGEX.test(numberText)) {
      return parseFloat(numberText);
    }

    throw new Error(`Invalid number '${text}'`);
  }

  static makeAdvancedValueFilter(column, operation, value, timeZone) {
    if (TableUtils.isDateType(column.type)) {
      return TableUtils.makeQuickDateFilterWithOperation(
        column,
        value,
        operation,
        timeZone
      );
    }

    const filterValue = TableUtils.makeFilterValue(column.type, value);
    const filter = column.filter();
    switch (operation) {
      case FilterType.eq:
        return filter.eq(filterValue);
      case FilterType.eqIgnoreCase:
        return filter.eqIgnoreCase(filterValue);
      case FilterType.notEq:
        return filter.notEq(filterValue);
      case FilterType.notEqIgnoreCase:
        return filter.notEqIgnoreCase(filterValue);
      case FilterType.greaterThan:
        return filter.greaterThan(filterValue);
      case FilterType.greaterThanOrEqualTo:
        return filter.greaterThanOrEqualTo(filterValue);
      case FilterType.lessThan:
        return filter.lessThan(filterValue);
      case FilterType.lessThanOrEqualTo:
        return filter.lessThanOrEqualTo(filterValue);
      case FilterType.isTrue:
        return filter.isTrue();
      case FilterType.isFalse:
        return filter.isFalse();
      case FilterType.isNull:
        return filter.isNull();
      case FilterType.contains:
        return filter
          .isNull()
          .not()
          .and(
            filter.invoke(
              'matches',
              dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E.*`)
            )
          );
      case FilterType.notContains:
        return filter
          .isNull()
          .or(
            filter
              .invoke(
                'matches',
                dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E.*`)
              )
              .not()
          );
      case FilterType.startsWith:
        return filter
          .isNull()
          .not()
          .and(
            filter.invoke(
              'matches',
              dh.FilterValue.ofString(`(?s)(?i)^\\Q${value}\\E.*`)
            )
          );
      case FilterType.endsWith:
        return filter
          .isNull()
          .not()
          .and(
            filter.invoke(
              'matches',
              dh.FilterValue.ofString(`(?s)(?i).*\\Q${value}\\E$`)
            )
          );
      case FilterType.in:
      case FilterType.inIgnoreCase:
      case FilterType.notIn:
      case FilterType.notInIgnoreCase:
      case FilterType.invoke:
      default:
        throw new Error(`Unexpected filter operation: ${operation}`);
    }
  }

  /**
   * Create a filter using the selected items
   * Has a flag for invertSelection as we start from a "Select All" state and a user just deselects items.
   * Since there may be millions of distinct items, it's easier to build an inverse filter.
   * @param {String[]} selectedValues The values that are selected
   * @param {boolean} invertSelection Invert the selection (eg. All items are selected, then you deselect items)
   * @returns dh.FilterCondition Returns a `in` or `notIn` FilterCondition as necessary, or null if no filtering should be applied (everything selected)
   */
  static makeSelectValueFilter(column, selectedValues, invertSelection) {
    if (selectedValues.length === 0) {
      if (invertSelection) {
        // No filter means select everything
        return null;
      }

      // KLUDGE: Return a conflicting filter to show no results.
      // Could recognize this situation at a higher or lower level and pause updates on the
      // table, but this situation should be rare and that wouldn't be much gains for some added complexity
      let value = null;

      if (TableUtils.isTextType(column.type)) {
        value = dh.FilterValue.ofString('');
      } else if (TableUtils.isBooleanType(column.type)) {
        value = dh.FilterValue.ofBoolean(true);
      } else if (TableUtils.isDateType(column.type)) {
        value = dh.FilterValue.ofNumber(dh.DateWrapper.ofJsDate(new Date()));
      } else {
        value = dh.FilterValue.ofNumber(0);
      }

      const eqFilter = column.filter().eq(value);
      const notEqFilter = column.filter().notEq(value);
      return eqFilter.and(notEqFilter);
    }

    const values = [];
    let isNullSelected = false;
    for (let i = 0; i < selectedValues.length; i += 1) {
      const value = selectedValues[i];
      if (value == null) {
        isNullSelected = true;
      } else if (TableUtils.isTextType(column.type)) {
        values.push(dh.FilterValue.ofString(value));
      } else if (TableUtils.isBooleanType(column.type)) {
        values.push(dh.FilterValue.ofBoolean(!!value));
      } else {
        values.push(dh.FilterValue.ofNumber(value));
      }
    }

    if (isNullSelected) {
      if (values.length > 0) {
        if (invertSelection) {
          return column
            .filter()
            .isNull()
            .not()
            .and(column.filter().notIn(values));
        }
        return column.filter().isNull().or(column.filter().in(values));
      }
      if (invertSelection) {
        return column.filter().isNull().not();
      }

      return column.filter().isNull();
    }

    if (invertSelection) {
      return column.filter().notIn(values);
    }

    return column.filter().in(values);
  }

  static isTreeTable(table) {
    return table && table.expand && table.collapse;
  }

  /**
   * Copies the provided array, sorts by column name case insensitive, and returns the sorted array.
   * @param {Array<dh.Column>}} columns The columns to sort
   * @param {boolean} isAscending Whether to sort ascending
   */
  static sortColumns(columns, isAscending = true) {
    return [...columns].sort((a, b) => {
      const aName = a.name.toUpperCase();
      const bName = b.name.toUpperCase();
      return TextUtils.sort(aName, bName, isAscending);
    });
  }
}

export default TableUtils;
