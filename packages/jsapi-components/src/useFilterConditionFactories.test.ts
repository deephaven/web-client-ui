import { renderHook } from '@testing-library/react-hooks';
import type { FilterCondition, Table } from '@deephaven/jsapi-types';
import { FilterConditionFactory } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useFilterConditionFactories from './useFilterConditionFactories';

const { asMock, createMockProxy } = TestUtils;

const table = createMockProxy<Table>();

const filterCondition = {
  a: createMockProxy<FilterCondition>(),
  b: createMockProxy<FilterCondition>(),
};

const filterConditionFactory = {
  a: jest.fn() as FilterConditionFactory,
  b: jest.fn() as FilterConditionFactory,
  null: jest.fn() as FilterConditionFactory,
};

beforeEach(() => {
  jest.clearAllMocks();

  asMock(filterConditionFactory.a).mockReturnValue(filterCondition.a);
  asMock(filterConditionFactory.b).mockReturnValue(filterCondition.b);
  asMock(filterConditionFactory.null).mockReturnValue(null);
});

it.each([
  [
    [filterConditionFactory.a, filterConditionFactory.b],
    [filterCondition.a, filterCondition.b],
  ],
  [
    [
      filterConditionFactory.null,
      filterConditionFactory.a,
      filterConditionFactory.null,
    ],
    [filterCondition.a],
  ],
] as const)(
  'should map filter condition factories over given table and return resulting filter conditions',
  (factories, expected) => {
    const { result } = renderHook(() =>
      useFilterConditionFactories(table, ...factories)
    );
    expect(result.current).toEqual(expected);
  }
);
