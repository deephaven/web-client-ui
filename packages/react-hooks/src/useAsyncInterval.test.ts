import { renderHook, act } from '@testing-library/react-hooks';
import Log from '@deephaven/log';
import { TestUtils } from '@deephaven/utils';
import useAsyncInterval from './useAsyncInterval';

jest.mock('@deephaven/log', () => {
  const logger = {
    error: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      module: jest.fn(() => logger),
    },
  };
});

const { asMock } = TestUtils;

const mockLoggerInstance = Log.module('mock.logger');

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
  jest.useFakeTimers();
  jest.spyOn(window, 'setTimeout').mockName('setTimeout');
});

afterAll(() => {
  jest.useRealTimers();
});

describe('useAsyncInterval', () => {
  /**
   * Creates a callback function that resolves after the given number of
   * milliseconds. Accepts an optional array of Error | undefined. They are
   * mapped by index to the order in which the callback is called. An Error
   * instance will cause a rejection, undefined will cause a resolution.
   */
  function createCallback(ms: number, rejectWith: (Error | undefined)[] = []) {
    return jest
      .fn(
        async (): Promise<void> =>
          new Promise((resolve, reject) => {
            const rejectArg = rejectWith.shift();
            setTimeout(
              rejectArg == null ? resolve : () => reject(rejectArg),
              ms
            );

            // Don't track the above call to `setTimeout`
            asMock(setTimeout).mock.calls.pop();
          })
      )
      .mockName('callback');
  }

  const targetIntervalMs = 1000;

  it('should call the callback function immediately any time the callback or target interval changes', () => {
    const callbackA = createCallback(50);
    const callbackB = createCallback(50);

    const { rerender } = renderHook(
      ([cb, target]: [() => Promise<void>, number]) =>
        useAsyncInterval(cb, target),
      {
        initialProps: [callbackA, targetIntervalMs],
      }
    );

    expect(callbackA).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    // Should not call callback if depedencies don't change
    rerender([callbackA, targetIntervalMs]);
    expect(callbackA).not.toHaveBeenCalled();
    jest.clearAllMocks();

    // Callback change
    rerender([callbackB, targetIntervalMs]);
    expect(callbackA).not.toHaveBeenCalled();
    expect(callbackB).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    // Interval change
    rerender([callbackB, targetIntervalMs + 20]);
    expect(callbackB).toHaveBeenCalledTimes(1);
  });

  it('should adjust the target interval based on how long async call takes', async () => {
    const callbackDelayMs = 50;
    const callback = createCallback(callbackDelayMs);

    renderHook(() => useAsyncInterval(callback, targetIntervalMs));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).not.toHaveBeenCalled();
    jest.clearAllMocks();

    // Mimick the callback Promise resolving
    act(() => jest.advanceTimersByTime(callbackDelayMs));
    await TestUtils.flushPromises();

    // Next target interval should be adjusted based on how long the callback took
    const nextTargetIntervalMs = targetIntervalMs - callbackDelayMs;

    expect(callback).not.toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      nextTargetIntervalMs
    );

    act(() => jest.advanceTimersByTime(nextTargetIntervalMs));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should schedule the next callback immediately if the callback takes longer than the target interval', async () => {
    const callbackDelayMs = targetIntervalMs + 50;
    const callback = createCallback(callbackDelayMs);

    renderHook(() => useAsyncInterval(callback, targetIntervalMs));

    expect(callback).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    // Mimick the callback Promise resolving
    act(() => jest.advanceTimersByTime(callbackDelayMs));
    await TestUtils.flushPromises();

    expect(callback).not.toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledTimes(1);
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);

    act(() => jest.advanceTimersByTime(0));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should stop calling the callback function after unmounting', async () => {
    const callbackDelayMs = 50;
    const callback = createCallback(callbackDelayMs);

    const { unmount } = renderHook(() =>
      useAsyncInterval(callback, targetIntervalMs)
    );

    expect(callback).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    // Mimick the callback Promise resolving
    act(() => jest.advanceTimersByTime(callbackDelayMs));
    await TestUtils.flushPromises();

    expect(window.setTimeout).toHaveBeenCalledTimes(1);

    unmount();

    act(() => jest.advanceTimersByTime(targetIntervalMs));

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not re-schedule callback if callback resolves after unmounting', async () => {
    const callbackDelayMs = 50;
    const callback = createCallback(callbackDelayMs);

    const { unmount } = renderHook(() =>
      useAsyncInterval(callback, targetIntervalMs)
    );

    expect(callback).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    unmount();

    // Mimick the callback Promise resolving
    act(() => jest.advanceTimersByTime(callbackDelayMs));
    await TestUtils.flushPromises();

    expect(window.setTimeout).not.toHaveBeenCalled();
  });

  it('should handle tick errors', async () => {
    const callbackDelayMs = 50;
    const mockError = new Error('mock.error');
    const callback = createCallback(callbackDelayMs, [mockError, undefined]);

    renderHook(() => useAsyncInterval(callback, targetIntervalMs));

    // First callback fires immediately
    expect(callback).toHaveBeenCalledTimes(1);

    // Mimick the callback Promise rejecting
    act(() => jest.advanceTimersByTime(callbackDelayMs));
    await TestUtils.flushPromises();

    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      'A tick error occurred:',
      mockError
    );

    // Advance to next interval
    act(() => jest.advanceTimersByTime(targetIntervalMs));

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
