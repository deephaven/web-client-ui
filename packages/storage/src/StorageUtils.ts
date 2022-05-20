import { Operator as FilterOperator } from '@deephaven/filters';
import {
  FilterConfig,
  FilterConfigItem,
  FilterValue,
  SortConfig,
  SortDirection,
} from './Storage';

export class StorageUtils {
  static makeSortConfig(
    columnName: string,
    direction: SortDirection
  ): SortConfig {
    return { column: columnName, direction };
  }

  static makeFilterConfig(filters: FilterConfigItem[]): FilterConfig {
    const filterItems: FilterConfigItem[] = [];
    const filterOperators: string[] = [];
    filters.forEach((filterItem, i) => {
      filterItems.push(filterItem);
      if (i > 0) {
        filterOperators.push(FilterOperator.and);
      }
    });
    return {
      filterItems,
      filterOperators,
    };
  }

  static combineFilterConfigs(
    config1: FilterConfig,
    config2: FilterConfig,
    operator = FilterOperator.and
  ): FilterConfig {
    return {
      filterItems: [...config1.filterItems, ...config2.filterItems],
      filterOperators: [
        ...config1.filterOperators,
        operator,
        ...config2.filterOperators,
      ],
    };
  }

  static makeFilterItem(
    columnName: string,
    type: string,
    value: FilterValue
  ): FilterConfigItem {
    return { columnName, type, value };
  }
}

export default StorageUtils;
