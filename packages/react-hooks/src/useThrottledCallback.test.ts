import { renderHook } from '@testing-library/react';
import useThrottledCallback from './useThrottledCallback';

const callback = jest.fn((text: string) => undefined);
const arg = 'mock.arg';
const arg2 = 'mock.arg2';
const throttleMs = 400;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should throttle a given callback', () => {
  const { result } = renderHook(() =>
    useThrottledCallback(callback, throttleMs)
  );

  result.current(arg);
  result.current(arg);

  jest.advanceTimersByTime(5);

  result.current(arg);

  result.current(arg2);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg);

  jest.clearAllMocks();

  jest.advanceTimersByTime(throttleMs);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg2);
});

it('should cancel throttle if component unmounts', () => {
  const { result, unmount } = renderHook(() =>
    useThrottledCallback(callback, throttleMs)
  );

  result.current(arg);
  result.current(arg2);

  jest.advanceTimersByTime(throttleMs - 1);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg);
  callback.mockClear();

  jest.spyOn(result.current, 'cancel');

  unmount();

  expect(result.current.cancel).toHaveBeenCalled();

  jest.advanceTimersByTime(5);

  expect(callback).not.toHaveBeenCalled();
});

it('should call the updated callback if the ref changes', () => {
  const { rerender, result } = renderHook(
    fn => useThrottledCallback(fn, throttleMs),
    {
      initialProps: callback,
    }
  );

  result.current(arg);
  result.current(arg2);

  // Leading is always called
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg);
  callback.mockClear();

  jest.advanceTimersByTime(throttleMs - 1);

  const newCallback = jest.fn();
  rerender(newCallback);

  jest.advanceTimersByTime(1);

  expect(callback).not.toHaveBeenCalled();
  expect(newCallback).toHaveBeenCalledTimes(1);
  expect(newCallback).toHaveBeenCalledWith(arg2);
});

it('should flush on unmount if that option is set', () => {
  const { result, unmount } = renderHook(() =>
    useThrottledCallback(callback, throttleMs, { flushOnUnmount: true })
  );

  result.current(arg);
  result.current(arg2);

  jest.advanceTimersByTime(throttleMs - 1);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg);
  callback.mockClear();

  jest.spyOn(result.current, 'flush');

  unmount();

  expect(result.current.flush).toHaveBeenCalled();

  jest.advanceTimersByTime(1);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg2);
});
