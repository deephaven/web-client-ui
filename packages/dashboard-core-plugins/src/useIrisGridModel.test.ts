import { IrisGridModel } from '@deephaven/iris-grid';
import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-test-renderer';
import {
  IrisGridModelFetchErrorResult,
  IrisGridModelFetchSuccessResult,
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
  const { result, waitForNextUpdate } = renderHook(() =>
    useIrisGridModel(fetch)
  );
  await waitForNextUpdate();
  const fetchResult = result.current;
  expect(fetchResult.status).toBe('error');
  expect((fetchResult as IrisGridModelFetchErrorResult).error).toBe(error);
});

it('should return success status on fetch success', async () => {
  const table = TestUtils.createMockProxy<dh.Table>();
  const fetch = jest.fn(() => Promise.resolve(table));
  const { result, waitForNextUpdate } = renderHook(() =>
    useIrisGridModel(fetch)
  );
  await waitForNextUpdate();
  const fetchResult = result.current;
  expect(fetchResult.status).toBe('success');
  expect((fetchResult as IrisGridModelFetchSuccessResult).model).toBeDefined();
});

it('should reload the model on reload', async () => {
  const table = TestUtils.createMockProxy<dh.Table>();
  const fetch = jest.fn(() => Promise.resolve(table));
  const { result, waitForNextUpdate } = renderHook(() =>
    useIrisGridModel(fetch)
  );
  await waitForNextUpdate();
  const fetchResult = result.current;
  expect(fetchResult.status).toBe('success');
  fetch.mockClear();
  await act(async () => {
    fetchResult.reload();
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
