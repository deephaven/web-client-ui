import { renderHook } from '@testing-library/react-hooks';
import type { Column, FilterCondition } from '@deephaven/jsapi-types';
import {
  createFilterConditionFactory,
  createNotNullOrEmptyFilterCondition,
  FilterConditionFactory,
  TableUtils,
} from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useNotNullOrEmptyFilter from './useNotNullOrEmptyFilter';
import useTableUtils from './useTableUtils';

const { asMock, createMockProxy } = TestUtils;

jest.mock('./useTableUtils');
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createFilterConditionFactory: jest.fn(),
  createNotNullOrEmptyFilterCondition: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useNotNullOrEmptyFilter', () => {
  const columnNames = ['column1', 'column2'];
  const tableUtils = createMockProxy<TableUtils>();

  const mockResult = {
    createNotNullOrEmptyFilterCondition: jest.fn() as (
      column: Column
    ) => FilterCondition,
    createFilterConditionFactory: jest.fn() as FilterConditionFactory,
  };

  beforeEach(() => {
    asMock(useTableUtils).mockName('useTableUtils').mockReturnValue(tableUtils);

    asMock(createNotNullOrEmptyFilterCondition)
      .mockName('createNotNullOrEmptyFilterCondition')
      .mockReturnValue(mockResult.createNotNullOrEmptyFilterCondition);

    asMock(createFilterConditionFactory)
      .mockName('createFilterConditionFactory')
      .mockReturnValue(mockResult.createFilterConditionFactory);
  });

  it.each([undefined, 'and', 'or'] as const)(
    'should return a filter function',
    operator => {
      const { result } = renderHook(() =>
        useNotNullOrEmptyFilter(columnNames, operator)
      );

      expect(createNotNullOrEmptyFilterCondition).toHaveBeenCalledWith(
        tableUtils
      );

      expect(createFilterConditionFactory).toHaveBeenCalledWith(
        columnNames,
        mockResult.createNotNullOrEmptyFilterCondition,
        operator ?? 'or'
      );

      expect(result.current).toBe(mockResult.createFilterConditionFactory);
    }
  );
});
