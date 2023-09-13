import { renderHook } from '@testing-library/react-hooks';
import type { FilterCondition, Table } from '@deephaven/jsapi-types';
import useViewportFilter from './useViewportFilter';
import { UseViewportDataResult } from './useViewportData';

beforeEach(() => {
  jest.clearAllMocks();
});

const applyFiltersAndRefresh = {
  a: jest.fn(),
  b: jest.fn(),
};

const filter = {
  a: [] as FilterCondition[],
  b: [] as FilterCondition[],
};

it('should apply given filter when applyFiltersAndRefresh or filter changes', () => {
  const { rerender } = renderHook(
    props =>
      useViewportFilter(
        {
          applyFiltersAndRefresh: props[0],
        } as unknown as UseViewportDataResult<unknown, Table>,
        props[1]
      ),
    {
      initialProps: [applyFiltersAndRefresh.a, filter.a] as const,
    }
  );

  expect(applyFiltersAndRefresh.a).toHaveBeenCalledWith(filter.a);

  jest.resetAllMocks();
  rerender([applyFiltersAndRefresh.a, filter.a]);
  expect(applyFiltersAndRefresh.a).not.toHaveBeenCalled();

  jest.resetAllMocks();
  rerender([applyFiltersAndRefresh.b, filter.a]);
  expect(applyFiltersAndRefresh.a).not.toHaveBeenCalled();
  expect(applyFiltersAndRefresh.b).toHaveBeenCalledWith(filter.a);

  jest.resetAllMocks();
  rerender([applyFiltersAndRefresh.b, filter.b]);
  expect(applyFiltersAndRefresh.a).not.toHaveBeenCalled();
  expect(applyFiltersAndRefresh.b).toHaveBeenCalledWith(filter.b);
});
