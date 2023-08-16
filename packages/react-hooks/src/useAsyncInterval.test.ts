import { renderHook, act } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import useAsyncInterval from './useAsyncInterval';

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
  function createCallback(ms: number) {
    return jest.fn(
      async (): Promise<void> =>
        new Promise(resolve => {
          setTimeout(resolve, ms);
        })
    );
  }

  const targetIntervalMs = 1000;

  it('should call the callback function after the target interval', async () => {
    const callback = createCallback(50);

    renderHook(() => useAsyncInterval(callback, targetIntervalMs));

    // First tick should be scheduled for target interval
    expect(callback).not.toHaveBeenCalled();
    expect(window.setTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      targetIntervalMs
    );

    // Callback should be called after target interval
    act(() => jest.advanceTimersByTime(targetIntervalMs));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should adjust the target interval based on how long async call takes', async () => {
    const callbackDelayMs = 50;
    const callback = createCallback(callbackDelayMs);

    renderHook(() => useAsyncInterval(callback, targetIntervalMs));

    // Callback should be called after target interval
    expect(callback).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(targetIntervalMs));
    expect(callback).toHaveBeenCalledTimes(1);

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

    // Callback should be called after target interval
    expect(callback).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(targetIntervalMs));
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
    const callback = createCallback(50);

    const { unmount } = renderHook(() =>
      useAsyncInterval(callback, targetIntervalMs)
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(targetIntervalMs);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
