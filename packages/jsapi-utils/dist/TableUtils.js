function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { Type as FilterType, Operator as FilterOperator } from '@deephaven/filters';
import Log from '@deephaven/log';
import dh from '@deephaven/jsapi-shim';
import { PromiseUtils, TextUtils, TimeoutError } from '@deephaven/utils';
import DateUtils from "./DateUtils.js";
var log = Log.module('TableUtils');

/** Utility class to provide some functions for working with tables */
export class TableUtils {
  // Regex looking for a negative or positive integer or decimal number
  static getSortIndex(sort, columnIndex) {
    for (var i = 0; i < sort.length; i += 1) {
      var _s$column;

      var s = sort[i];

      if (((_s$column = s.column) === null || _s$column === void 0 ? void 0 : _s$column.index) === columnIndex) {
        return i;
      }
    }

    return null;
  }
  /**
   * @param tableSort The sorts from the table to get the sort from
   * @param columnIndex The index of the column to get the sort for
   * @return The sort for the column, or null if it's not sorted
   */


  static getSortForColumn(tableSort, columnIndex) {
    var sortIndex = TableUtils.getSortIndex(tableSort, columnIndex);

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
    } // TODO (DH-11799): In Bard (and beyond), we should use the same types as numbers
    // It should just work after the merge for DH-11040: https://gitlab.eng.illumon.com/illumon/iris/merge_requests/5801
    // In Powell though, just support equals/not equals


    if (TableUtils.isCharType(columnType)) {
      return [FilterType.eq, FilterType.notEq];
    }

    if (TableUtils.isNumberType(columnType) || TableUtils.isDateType(columnType)) {
      return [FilterType.eq, FilterType.notEq, FilterType.greaterThan, FilterType.greaterThanOrEqualTo, FilterType.lessThan, FilterType.lessThanOrEqualTo];
    }

    if (TableUtils.isTextType(columnType)) {
      return [FilterType.eq, FilterType.eqIgnoreCase, FilterType.notEq, FilterType.notEqIgnoreCase, FilterType.contains, FilterType.notContains, FilterType.startsWith, FilterType.endsWith];
    }

    return [];
  }

  static getNextSort(table, columnIndex) {
    if (!table || !table.columns || columnIndex < 0 || columnIndex >= table.columns.length) {
      return null;
    }

    var sort = TableUtils.getSortForColumn(table.sort, columnIndex);

    if (sort === null) {
      return table.columns[columnIndex].sort().asc();
    }

    if (sort.direction === TableUtils.sortDirection.ascending) {
      return sort.desc();
    }

    return null;
  }

  static makeColumnSort(table, columnIndex, direction, isAbs) {
    if (!table || !table.columns || columnIndex < 0 || columnIndex >= table.columns.length) {
      return null;
    }

    if (direction === TableUtils.sortDirection.none) {
      return null;
    }

    var sort = table.columns[columnIndex].sort();

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
   * @param sorts The current sorts from IrisGrid.state
   * @param table The table to apply the sort to
   * @param columnIndex The column index to apply the sort to
   * @param addToExisting Add this sort to the existing sort
   */


  static toggleSortForColumn(sorts, table, columnIndex) {
    var addToExisting = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    if (!table || columnIndex < 0 || columnIndex >= table.columns.length) {
      return [];
    }

    var newSort = TableUtils.getNextSort(table, columnIndex);
    return TableUtils.setSortForColumn(sorts, columnIndex, newSort, addToExisting);
  }

  static sortColumn(table, modelColumn, direction, isAbs, addToExisting) {
    if (!table || modelColumn < 0 || modelColumn >= table.columns.length) {
      return [];
    }

    var newSort = TableUtils.makeColumnSort(table, modelColumn, direction, isAbs);
    return TableUtils.setSortForColumn(table.sort, modelColumn, newSort, addToExisting);
  }
  /**
   * Sets the sort for the given column *and* removes any reverses
   * @param tableSort The current sorts from IrisGrid.state
   * @param columnIndex The column index to apply the sort to
   * @param sort The sort object to add
   * @param addToExisting Add this sort to the existing sort
   * @returns Returns the modified array of sorts - removing reverses
   */


  static setSortForColumn(tableSort, columnIndex, sort) {
    var addToExisting = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var sortIndex = TableUtils.getSortIndex(tableSort, columnIndex);
    var sorts = [];

    if (addToExisting) {
      sorts = sorts.concat(tableSort.filter(_ref => {
        var {
          direction
        } = _ref;
        return direction !== TableUtils.sortDirection.reverse;
      }));

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
      case 'io.deephaven.time.DateTime':
      case 'com.illumon.iris.db.tables.utils.DBDateTime':
      case TableUtils.dataType.DATETIME:
        return TableUtils.dataType.DATETIME;

      case 'double':
      case 'java.lang.Double':
      case 'float':
      case 'java.lang.Float':
      case 'java.math.BigDecimal':
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
      case 'java.math.BigInteger':
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
      case 'io.deephaven.time.DateTime':
      case 'com.illumon.iris.db.tables.utils.DBDateTime':
        return true;

      default:
        return false;
    }
  }

  static isNumberType(columnType) {
    return TableUtils.isIntegerType(columnType) || TableUtils.isDecimalType(columnType);
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

  static isCharType(columnType) {
    switch (columnType) {
      case 'char':
      case 'java.lang.Character':
        return true;

      default:
        return false;
    }
  }

  static isStringType(columnType) {
    switch (columnType) {
      case 'java.lang.String':
        return true;

      default:
        return false;
    }
  }

  static isTextType(columnType) {
    return this.isStringType(columnType) || this.isCharType(columnType);
  }
  /**
   * Get base column type
   * @param columnType Column type
   * @returns Element type for array columns, original type for non-array columns
   */


  static getBaseType(columnType) {
    return columnType.split('[]')[0];
  }
  /**
   * Check if the column types are compatible
   * @param type1 Column type to check
   * @param type2 Column type to check
   * @returns True, if types are compatible
   */


  static isCompatibleType(type1, type2) {
    return TableUtils.getNormalizedType(type1) === TableUtils.getNormalizedType(type2);
  }
  /**
   * Create filter with the provided column and text. Handles multiple filters joined with && or ||
   * @param column The column to set the filter on
   * @param text The text string to create the filter from
   * @param timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns Returns the created filter, null if text could not be parsed
   */


  static makeQuickFilter(column, text, timeZone) {
    var orComponents = text.split('||');
    var orFilter = null;

    for (var i = 0; i < orComponents.length; i += 1) {
      var orComponent = orComponents[i];
      var andComponents = orComponent.split('&&');
      var andFilter = null;

      for (var j = 0; j < andComponents.length; j += 1) {
        var andComponent = andComponents[j].trim();

        if (andComponent.length > 0) {
          var filter = TableUtils.makeQuickFilterFromComponent(column, andComponent, timeZone);

          if (filter) {
            if (andFilter) {
              andFilter = andFilter.and(filter);
            } else {
              andFilter = filter;
            }
          } else {
            throw new Error("Unable to parse quick filter from text ".concat(text));
          }
        }
      }

      if (orFilter && andFilter) {
        orFilter = orFilter.or(andFilter);
      } else {
        orFilter = andFilter;
      }
    }

    return orFilter;
  }
  /**
   * Create filter with the provided column and text of one component (no multiple conditions)
   * @param column The column to set the filter on
   * @param text The text string to create the filter from
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns Returns the created filter, null if text could not be parsed
   */


  static makeQuickFilterFromComponent(column, text, timeZone) {
    var {
      type
    } = column;

    if (TableUtils.isNumberType(type)) {
      return this.makeQuickNumberFilter(column, text);
    }

    if (TableUtils.isBooleanType(type)) {
      return this.makeQuickBooleanFilter(column, text);
    }

    if (TableUtils.isDateType(type)) {
      return this.makeQuickDateFilter(column, text, timeZone);
    }

    if (TableUtils.isCharType(type)) {
      return this.makeQuickCharFilter(column, text);
    }

    return this.makeQuickTextFilter(column, text);
  }

  static makeQuickNumberFilter(column, text) {
    if (text == null) {
      return null;
    }

    var columnFilter = column.filter();
    var filter = null;
    var regex = /\s*(>=|<=|=>|=<|>|<|!=|=|!)?(\s*-\s*)?(\s*\d*(?:,\d{3})*(?:\.\d*)?\s*)?(null|nan|infinity|inf|\u221E)?(.*)/i;
    var result = regex.exec(text);
    var operation = null;
    var negativeSign = null;
    var value = null;
    var abnormalValue = null; // includes nan, null and infinity(positive & negative)

    var overflow = null;

    if (result !== null && result.length > 3) {
      [, operation, negativeSign, value, abnormalValue, overflow] = result;
    }

    if (overflow != null && overflow.trim().length > 0) {
      // Some bad characters after the number, bail out!
      return null;
    }

    if (operation == null) {
      operation = '=';
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
            filter = dh.FilterCondition.invoke('isInf', columnFilter).and(columnFilter.lessThan(dh.FilterValue.ofNumber(0)));
          } else {
            filter = dh.FilterCondition.invoke('isInf', columnFilter).and(columnFilter.greaterThan(dh.FilterValue.ofNumber(0)));
          }

          break;

        default:
          break;
      }

      if (filter !== null && (operation === '!' || operation === '!=')) {
        filter = filter.not();
      }

      return filter;
    }

    if (value == null) {
      return null;
    }

    value = TableUtils.removeCommas(value);

    if (TableUtils.isLongType(column.type)) {
      try {
        value = dh.FilterValue.ofNumber(dh.LongWrapper.ofString("".concat(negativeSign != null ? '-' : '').concat(value)));
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
    return TableUtils.makeRangeFilterWithOperation(filter, operation, value);
  }

  static makeQuickTextFilter(column, text) {
    if (text == null) {
      return null;
    }

    var cleanText = "".concat(text).trim();
    var regex = /^(!~|!=|~|=|!)?(.*)/;
    var result = regex.exec(cleanText);
    var operation = null;
    var value = null;

    if (result !== null && result.length > 2) {
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

    var filter = column.filter();

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

    var prefix = null;
    var suffix = null;

    if (value.startsWith('*')) {
      prefix = '*';
      value = value.substring(1);
    } else if (value.endsWith('*') && !value.endsWith('\\*')) {
      suffix = '*';
      value = value.substring(0, value.length - 1);
    }

    value = value.replace('\\', '');

    switch (operation) {
      case '~':
        {
          return filter.isNull().not().and(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E.*"))));
        }

      case '!~':
        return filter.isNull().or(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E.*"))).not());

      case '!=':
        if (prefix === '*') {
          // Does not end with
          return filter.isNull().or(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E$"))).not());
        }

        if (suffix === '*') {
          // Does not start with
          return filter.isNull().or(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i)^\\Q".concat(value, "\\E.*"))).not());
        }

        return filter.notEqIgnoreCase(dh.FilterValue.ofString(value.toLowerCase()));

      case '=':
        if (prefix === '*') {
          // Ends with
          return filter.isNull().not().and(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E$"))));
        }

        if (suffix === '*') {
          // Starts with
          return filter.isNull().not().and(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i)^\\Q".concat(value, "\\E.*"))));
        }

        return filter.eqIgnoreCase(dh.FilterValue.ofString(value.toLowerCase()));

      default:
        break;
    }

    return null;
  }

  static makeQuickBooleanFilter(column, text) {
    if (text == null) {
      return null;
    }

    var regex = /^(!=|=|!)?(.*)/;
    var result = regex.exec("".concat(text).trim());

    if (result === null) {
      return null;
    }

    var [, operation, value] = result;
    var notEqual = operation === '!' || operation === '!=';
    var cleanValue = value.trim().toLowerCase();
    var filter = column.filter();

    try {
      var boolValue = TableUtils.makeBooleanValue(cleanValue);

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
   * @param column The column to build the filter from, with or without a leading operator.
   * @param text The date string text to parse.
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   */


  static makeQuickDateFilter(column, text, timeZone) {
    var cleanText = text.trim();
    var regex = /\s*(>=|<=|=>|=<|>|<|!=|!|=)?(.*)/;
    var result = regex.exec(cleanText);

    if (result == null || result.length <= 2) {
      throw new Error("Unable to parse date filter: ".concat(text));
    }

    var operation = null;
    var dateText = null;
    [, operation, dateText] = result;
    var filterOperation = FilterType.eq;

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

    return TableUtils.makeQuickDateFilterWithOperation(column, dateText, filterOperation, timeZone);
  }
  /**
   * Builds a date filter parsed from the text string with the provided filter.
   * @param column The column to build the filter from.
   * @param text The date string text to parse, without an operator.
   * @param operation The filter operation to use.
   * @param timeZone The time zone to make this filter with. E.g. America/New_York
   */


  static makeQuickDateFilterWithOperation(column, text) {
    var operation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : FilterType.eq;
    var timeZone = arguments.length > 3 ? arguments[3] : undefined;

    if (column == null) {
      throw new Error('Column is null');
    }

    var [startDate, endDate] = DateUtils.parseDateRange(text, timeZone);
    var startValue = startDate != null ? dh.FilterValue.ofNumber(startDate) : null;
    var endValue = endDate != null ? dh.FilterValue.ofNumber(endDate) : null;
    var filter = column.filter();

    if (startValue == null) {
      return operation === FilterType.notEq ? filter.isNull().not() : filter.isNull();
    }

    switch (operation) {
      case FilterType.eq:
        {
          if (endValue != null) {
            var startFilter = filter.greaterThanOrEqualTo(startValue);
            var endFilter = filter.lessThan(endValue);
            return startFilter.and(endFilter);
          }

          return filter.eq(startValue);
        }

      case FilterType.lessThan:
        {
          return filter.lessThan(startValue);
        }

      case FilterType.lessThanOrEqualTo:
        {
          if (endValue != null) {
            return filter.lessThan(endValue);
          }

          return filter.lessThanOrEqualTo(startValue);
        }

      case FilterType.greaterThan:
        {
          if (endValue != null) {
            return filter.greaterThanOrEqualTo(endValue);
          }

          return filter.greaterThan(startValue);
        }

      case FilterType.greaterThanOrEqualTo:
        return filter.greaterThanOrEqualTo(startValue);

      case FilterType.notEq:
        {
          if (endValue != null) {
            var _startFilter = filter.lessThan(startValue);

            var _endFilter = filter.greaterThanOrEqualTo(endValue);

            return _startFilter.or(_endFilter);
          }

          return filter.notEq(startValue);
        }

      default:
        throw new Error("Invalid operator: ".concat(operation));
    }
  }

  static makeQuickCharFilter(column, text) {
    if (text == null) {
      return null;
    }

    var cleanText = "".concat(text).trim();
    var regex = /^(!=|=|!)?(null|.)?(.*)/;
    var result = regex.exec(cleanText);
    var operation = null;
    var value = null;
    var overflow = null;

    if (result !== null && result.length > 3) {
      [, operation, value, overflow] = result;
    }

    if (overflow != null && overflow.trim().length > 0) {
      // Some bad characters after the number, bail out!
      return null;
    }

    if (value == null || value.length === 0) {
      return null;
    }

    if (operation == null) {
      operation = '=';
    }

    var filter = column.filter();

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

    return TableUtils.makeRangeFilterWithOperation(filter, operation, dh.FilterValue.ofString(value));
  }
  /**
   * @param filter The column filter to apply the range operation to
   * @param operation The range operation to run
   * @param value The value to use for the operation
   * @returns The condition with the specified operation
   */


  static makeRangeFilterWithOperation(filter, operation, value) {
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
  /**
   * Wraps a table promise in a cancelable promise that will close the table if the promise is cancelled.
   * Use in a component that loads a table, and call cancel when unmounting.
   * @param table The table promise to wrap
   */


  static makeCancelableTablePromise(table) {
    return PromiseUtils.makeCancelable(table, resolved => {
      resolved.close();
    });
  }
  /**
   * Make a cancelable promise for a one-shot table event with a timeout.
   * @param table Table to listen for events on
   * @param eventName Event to listen for
   * @param timeout Event timeout in milliseconds, defaults to 0
   * @param matcher Optional function to determine if the promise can be resolved or stays pending
   * @returns Resolves with the event data
   */


  static makeCancelableTableEventPromise(table, eventName) {
    var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var matcher = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var eventCleanup;
    var timeoutId;
    var isPending = true;
    var wrappedPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        eventCleanup();
        isPending = false;
        reject(new TimeoutError("Event \"".concat(eventName, "\" timed out.")));
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
    var {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues
    } = options;
    var filter = null;

    for (var i = 0; i < filterItems.length; i += 1) {
      var filterItem = filterItems[i];
      var {
        selectedType,
        value
      } = filterItem;

      if (selectedType != null && selectedType.length > 0 && value != null && value.length > 0) {
        try {
          var newFilter = TableUtils.makeAdvancedValueFilter(column, selectedType, value, timeZone);

          if (newFilter != null) {
            if (i === 0) {
              filter = newFilter;
            } else if (filter !== null && i - 1 < filterOperators.length) {
              var filterOperator = filterOperators[i - 1];

              if (filterOperator === FilterOperator.and) {
                filter = filter.and(newFilter);
              } else if (filterOperator === FilterOperator.or) {
                filter = filter.or(newFilter);
              } else {
                log.error('Unexpected filter operator', filterOperator, newFilter);
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

    var selectValueFilter = TableUtils.makeSelectValueFilter(column, selectedValues, invertSelection);

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
   * @param columnType The column type to make the filter value from.
   * @param value The value to make the filter value from.
   * @returns The FilterValue item for this column/value combination
   */


  static makeFilterValue(columnType, value) {
    var type = TableUtils.getBaseType(columnType);

    if (TableUtils.isTextType(type)) {
      return dh.FilterValue.ofString(value);
    }

    if (TableUtils.isLongType(type)) {
      return dh.FilterValue.ofNumber(dh.LongWrapper.ofString(TableUtils.removeCommas(value)));
    }

    return dh.FilterValue.ofNumber(TableUtils.removeCommas(value));
  }
  /**
   * Takes a value and converts it to an `dh.FilterValue`
   *
   * @param columnType The column type to make the filter value from.
   * @param value The value to actually set
   * @returns The FilterValue item for this column/value combination
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
   * @param columnType The column type to make the value for
   * @param text The string value to make a type for
   * @param timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
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
      var [date] = DateUtils.parseDateRange(text, timeZone);
      return date;
    }

    if (TableUtils.isNumberType(columnType)) {
      return TableUtils.makeNumberValue(text);
    }

    log.error('Unexpected column type', columnType);
    return null;
  }

  static makeBooleanValue(text) {
    var allowEmpty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (text === '' && allowEmpty) {
      return null;
    }

    switch (text === null || text === void 0 ? void 0 : text.toLowerCase()) {
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
        throw new Error("Invalid boolean '".concat(text, "'"));
    }
  }

  static makeNumberValue(text) {
    if (text == null || text === 'null' || text === '') {
      return null;
    }

    var cleanText = text.toLowerCase().trim();

    if (cleanText === '∞' || cleanText === 'infinity' || cleanText === 'inf') {
      return Number.POSITIVE_INFINITY;
    }

    if (cleanText === '-∞' || cleanText === '-infinity' || cleanText === '-inf') {
      return Number.NEGATIVE_INFINITY;
    }

    var numberText = TableUtils.removeCommas(cleanText);

    if (TableUtils.NUMBER_REGEX.test(numberText)) {
      return parseFloat(numberText);
    }

    throw new Error("Invalid number '".concat(text, "'"));
  }

  static makeAdvancedValueFilter(column, operation, value, timeZone) {
    if (TableUtils.isDateType(column.type)) {
      return TableUtils.makeQuickDateFilterWithOperation(column, value, operation, timeZone);
    }

    var filterValue = TableUtils.makeFilterValue(column.type, value);
    var filter = column.filter();

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
        return filter.isNull().not().and(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E.*"))));

      case FilterType.notContains:
        return filter.isNull().or(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E.*"))).not());

      case FilterType.startsWith:
        return filter.isNull().not().and(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i)^\\Q".concat(value, "\\E.*"))));

      case FilterType.endsWith:
        return filter.isNull().not().and(filter.invoke('matches', dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value, "\\E$"))));

      case FilterType.in:
      case FilterType.inIgnoreCase:
      case FilterType.notIn:
      case FilterType.notInIgnoreCase:
      case FilterType.invoke:
      default:
        throw new Error("Unexpected filter operation: ".concat(operation));
    }
  }
  /**
   * Create a filter using the selected items
   * Has a flag for invertSelection as we start from a "Select All" state and a user just deselects items.
   * Since there may be millions of distinct items, it's easier to build an inverse filter.
   * @param column The column to set the filter on
   * @param selectedValues The values that are selected
   * @param invertSelection Invert the selection (eg. All items are selected, then you deselect items)
   * @returns Returns a `in` or `notIn` FilterCondition as necessary, or null if no filtering should be applied (everything selected)
   */


  static makeSelectValueFilter(column, selectedValues, invertSelection) {
    if (selectedValues.length === 0) {
      if (invertSelection) {
        // No filter means select everything
        return null;
      } // KLUDGE: Return a conflicting filter to show no results.
      // Could recognize this situation at a higher or lower level and pause updates on the
      // table, but this situation should be rare and that wouldn't be much gains for some added complexity


      var value = null;

      if (TableUtils.isTextType(column.type)) {
        // Use 'a' so that it can work for String or Character types
        value = dh.FilterValue.ofString('a');
      } else if (TableUtils.isBooleanType(column.type)) {
        value = dh.FilterValue.ofBoolean(true);
      } else if (TableUtils.isDateType(column.type)) {
        value = dh.FilterValue.ofNumber(dh.DateWrapper.ofJsDate(new Date()));
      } else {
        value = dh.FilterValue.ofNumber(0);
      }

      var eqFilter = column.filter().eq(value);
      var notEqFilter = column.filter().notEq(value);
      return eqFilter.and(notEqFilter);
    }

    var values = [];
    var isNullSelected = false;

    for (var i = 0; i < selectedValues.length; i += 1) {
      var _value = selectedValues[i];

      if (_value == null) {
        isNullSelected = true;
      } else if (TableUtils.isTextType(column.type)) {
        values.push(dh.FilterValue.ofString(typeof _value === 'number' ? String.fromCharCode(_value) : _value));
      } else if (TableUtils.isBooleanType(column.type)) {
        values.push(dh.FilterValue.ofBoolean(!!_value));
      } else {
        values.push(dh.FilterValue.ofNumber(_value));
      }
    }

    if (isNullSelected) {
      if (values.length > 0) {
        if (invertSelection) {
          return column.filter().isNull().not().and(column.filter().notIn(values));
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
    return table != null && table.expand !== undefined && table.collapse !== undefined;
  }
  /**
   * Copies the provided array, sorts by column name case insensitive, and returns the sorted array.
   * @param columns The columns to sort
   * @param isAscending Whether to sort ascending
   */


  static sortColumns(columns) {
    var isAscending = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    return [...columns].sort((a, b) => {
      var aName = a.name.toUpperCase();
      var bName = b.name.toUpperCase();
      return TextUtils.sort(aName, bName, isAscending);
    });
  }

}

_defineProperty(TableUtils, "dataType", {
  BOOLEAN: 'boolean',
  CHAR: 'char',
  DATETIME: 'datetime',
  DECIMAL: 'decimal',
  INT: 'int',
  STRING: 'string'
});

_defineProperty(TableUtils, "sortDirection", {
  ascending: 'ASC',
  descending: 'DESC',
  reverse: 'REVERSE',
  none: null
});

_defineProperty(TableUtils, "REVERSE_TYPE", Object.freeze({
  NONE: 'none',
  PRE_SORT: 'pre-sort',
  POST_SORT: 'post-sort'
}));

_defineProperty(TableUtils, "NUMBER_REGEX", /^-?\d+(\.\d+)?$/);

export default TableUtils;
//# sourceMappingURL=TableUtils.js.map