import { renderHook } from '@testing-library/react-hooks';
import type { FilterCondition } from '@deephaven/jsapi-types';
import {
  createFilterConditionFactory,
  createShowOnlyEmptyFilterCondition,
  TableUtils,
} from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useShowOnlyEmptyFilter from './useShowOnlyEmptyFilter';
import useTableUtils from './useTableUtils';

const { asMock, createMockProxy } = TestUtils;

jest.mock('./useTableUtils');
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createFilterConditionFactory: jest.fn(),
  createShowOnlyEmptyFilterCondition: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useShowOnlyEmptyFilter', () => {
  const columnNames = ['column1', 'column2'];

  const showOnlyEmptyFilterCondition = jest.fn();

  const mockResult = {
    createFilterConditionFactory: jest.fn(),
    createShowOnlyEmptyFilterCondition: showOnlyEmptyFilterCondition,
    showOnlyEmptyFilterCondition: createMockProxy<FilterCondition>(),
    useTableUtils: createMockProxy<TableUtils>(),
  };

  beforeEach(() => {
    showOnlyEmptyFilterCondition
      .mockName('showOnlyFilterCondition')
      .mockReturnValue(mockResult.showOnlyEmptyFilterCondition);

    asMock(createShowOnlyEmptyFilterCondition)
      .mockName('createShowOnlyEmptyFilterCondition')
      .mockReturnValue(mockResult.createShowOnlyEmptyFilterCondition);

    asMock(useTableUtils)
      .mockName('useTableUtils')
      .mockReturnValue(mockResult.useTableUtils);

    asMock(createFilterConditionFactory)
      .mockName('createFilterConditionFactory')
      .mockReturnValue(mockResult.createFilterConditionFactory);
  });

  it.each([true, false])(
    'should create a filter condition factory from column names and whether is on: %s',
    isOn => {
      const { result } = renderHook(() =>
        useShowOnlyEmptyFilter(isOn, columnNames)
      );

      expect(createShowOnlyEmptyFilterCondition).toHaveBeenCalledWith(
        mockResult.useTableUtils,
        isOn
      );

      expect(createFilterConditionFactory).toHaveBeenCalledWith(
        columnNames,
        mockResult.createShowOnlyEmptyFilterCondition
      );

      expect(result.current).toBe(mockResult.createFilterConditionFactory);
    }
  );
});
