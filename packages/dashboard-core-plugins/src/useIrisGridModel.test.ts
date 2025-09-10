import { type IrisGridModel } from '@deephaven/iris-grid';
import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  type IrisGridModelFetchErrorResult,
  type IrisGridModelFetchSuccessResult,
  useIrisGridModel,
} from './useIrisGridModel';

const mockApi = TestUtils.createMockProxy<typeof dh>();
// Mock out the useApi hook to just return the API
jest.mock('@deephaven/jsapi-bootstrap', () => ({
  useApi: () => mockApi,
}));

const mockModel = TestUtils.createMockProxy<IrisGridModel>();
// Mock out the IrisGridModelFactory as well
jest.mock('@deephaven/iris-grid', () => ({
  ...jest.requireActual('@deephaven/iris-grid'),
  IrisGridModelFactory: {
    makeModel: jest.fn(() => mockModel),
  },
}));

it('should return loading status while fetching', () => {
  const fetch = jest.fn(
    () =>
      new Promise<dh.Table>(() => {
        // Do nothing
      })
  );
  const { result } = renderHook(() => useIrisGridModel(fetch));
  expect(result.current.status).toBe('loading');
});

it('should return error status on fetch error', async () => {
  const error = new Error('Test error');
  const fetch = jest.fn(() => Promise.reject(error));
  const { result } = renderHook(() => useIrisGridModel(fetch));
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect((result.current as IrisGridModelFetchErrorResult).error).toBe(error);
});

it('should return success status on fetch success', async () => {
  const table = TestUtils.createMockProxy<dh.Table>();
  const fetch = jest.fn(() => Promise.resolve(table));
  const { result } = renderHook(() => useIrisGridModel(fetch));
  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(
    (result.current as IrisGridModelFetchSuccessResult).model
  ).toBeDefined();
});

it('should reload the model on reload', async () => {
  const table = TestUtils.createMockProxy<dh.Table>();
  let fetchResolve;
  const fetch = jest.fn(
    () =>
      new Promise<dh.Table>(resolve => {
        fetchResolve = resolve;
      })
  );
  const { result } = renderHook(() => useIrisGridModel(fetch));
  expect(result.current.status).toBe('loading');
  fetchResolve(table);
  await waitFor(() => expect(result.current.status).toBe('success'));
  // Check that it will reload, transitioning to loading then to success again

  fetch.mockClear();
  fetch.mockReturnValue(
    new Promise(resolve => {
      fetchResolve = resolve;
    })
  );
  await act(async () => {
    result.current.reload();
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe('loading');
  fetchResolve(table);
  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(
    (result.current as IrisGridModelFetchSuccessResult).model
  ).toBeDefined();

  // Now check that it will handle a failure on reload, transitioning from loading to failure
  fetch.mockClear();

  let fetchReject;
  fetch.mockReturnValue(
    new Promise((resolve, reject) => {
      fetchReject = reject;
    })
  );
  await act(async () => {
    result.current.reload();
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe('loading');
  const error = new Error('Test error');
  fetchReject(error);
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect((result.current as IrisGridModelFetchErrorResult).error).toBe(error);

  // Check that it will reload again after an error
  fetch.mockClear();
  fetch.mockReturnValue(
    new Promise(resolve => {
      fetchResolve = resolve;
    })
  );
  await act(async () => {
    result.current.reload();
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe('loading');
  fetchResolve(table);
  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(
    (result.current as IrisGridModelFetchSuccessResult).model
  ).toBeDefined();
});

it('should return a memoized object for repeated calls', async () => {
  const table = TestUtils.createMockProxy<dh.Table>();
  const fetch = jest.fn(() => Promise.resolve(table));
  const { rerender, result } = renderHook(() => useIrisGridModel(fetch));
  await waitFor(() => expect(result.current.status).toBe('success'));
  const fetchResult = result.current;
  rerender(fetch);
  expect(result.current).toBe(fetchResult);
});
