import { act, renderHook } from '@testing-library/react-hooks';
import usePromiseFactory, {
  UsePromiseFactoryResult,
} from './usePromiseFactory';

const defaultState: UsePromiseFactoryResult<string> = {
  data: null,
  error: null,
  isError: false,
  isLoading: false,
  reload: expect.any(Function),
};

const resolvedData = 'resolved';
const rejectionError = new Error('mock error');

const expected = {
  defaultState,
  loadingState: {
    ...defaultState,
    isLoading: true,
  },
  resolvedState: {
    ...defaultState,
    data: resolvedData,
  },
  reloadingState: {
    ...defaultState,
    data: resolvedData,
    isLoading: true,
  },
  errorState: {
    ...defaultState,
    error: rejectionError,
    isError: true,
  },
};

const promiseFactory = jest.fn<Promise<string>, [number, string]>();
const args: Parameters<typeof promiseFactory> = [999, 'Mickey'];

beforeEach(() => {
  jest.clearAllMocks();
  promiseFactory.mockResolvedValue(resolvedData);
});

it('should return loading state while loading and data if promise resolves', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    usePromiseFactory(promiseFactory, args)
  );

  // While loading
  expect(promiseFactory).toHaveBeenCalledWith(...args);
  expect(result.current).toEqual(expected.loadingState);

  await waitForNextUpdate();

  // After promise resolves
  expect(result.current).toEqual(expected.resolvedState);
});

it('should return loading state while loading and error if promise fails', async () => {
  promiseFactory.mockRejectedValue(rejectionError);

  const { result, waitForNextUpdate } = renderHook(() =>
    usePromiseFactory(promiseFactory, args)
  );

  // While loading
  expect(promiseFactory).toHaveBeenCalledWith(...args);
  expect(result.current).toEqual(expected.loadingState);

  await waitForNextUpdate();

  // After promise resolves
  expect(result.current).toEqual(expected.errorState);
});

it('should not auto load promise if autoLoad is false', () => {
  const { result } = renderHook(() =>
    usePromiseFactory(promiseFactory, args, { autoLoad: false })
  );

  expect(promiseFactory).not.toHaveBeenCalled();
  expect(result.current).toEqual(expected.defaultState);
});

it.each([true, false])(
  'should support explicit loading via reload function: %s',
  async autoLoad => {
    const { result, waitForNextUpdate } = renderHook(() =>
      usePromiseFactory(promiseFactory, args, { autoLoad })
    );

    if (autoLoad) {
      await waitForNextUpdate();
    }

    // Reset any auto load mock data
    jest.clearAllMocks();

    act(() => {
      result.current.reload();
    });

    // While loading
    expect(promiseFactory).toHaveBeenCalledWith(...args);
    expect(result.current).toEqual(
      autoLoad ? expected.reloadingState : expected.loadingState
    );

    await waitForNextUpdate();

    // After promise resolves
    expect(result.current).toEqual(expected.resolvedState);
  }
);
