import { useMemo } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import {
  createValueFilter,
  FilterConditionFactory,
  TableUtils,
} from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useValueFilter from './useValueFilter';
import useTableUtils from './useTableUtils';

jest.mock('./useTableUtils');
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createValueFilter: jest.fn(),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: jest.fn(),
}));

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useValueFilter', () => {
  const columnName = 'mock.column';
  const value = 'mock.value';
  const operators = ['contains', 'eq', 'notEq'] as const;

  const mock = {
    result: {
      useTableUtils: createMockProxy<TableUtils>(),
      createValueFilter1: jest.fn() as FilterConditionFactory,
      createValueFilter2: jest.fn() as FilterConditionFactory,
    },
  };

  beforeEach(() => {
    asMock(useMemo)
      .mockName('useMemo')
      // passthrough result of memoization function
      .mockImplementation(factory => factory());

    asMock(useTableUtils)
      .mockName('useTableUtils')
      .mockReturnValue(mock.result.useTableUtils);

    const results = [
      mock.result.createValueFilter1,
      mock.result.createValueFilter2,
    ];

    asMock(createValueFilter)
      .mockName('createValueFilter')
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .mockImplementation(() => results.shift()!);
  });

  it.each(operators)('should create a memoized value filter: %s', operator => {
    const { result } = renderHook(() =>
      useValueFilter(columnName, value, operator)
    );

    expect(result.current).toBe(mock.result.createValueFilter1);
    expect(useMemo).toHaveBeenCalledWith(expect.any(Function), [
      columnName,
      operator,
      mock.result.useTableUtils,
      value,
    ]);
  });
});
