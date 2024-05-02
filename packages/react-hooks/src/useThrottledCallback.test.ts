import { renderHook } from '@testing-library/react-hooks';
import useThrottledCallback from './useThrottledCallback';

const callback = jest.fn((text: string) => undefined);
const arg = 'mock.arg';
const arg2 = 'mock.arg2';
const throttleMs = 400;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
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

it('should cancel throttle if callback reference changes', () => {
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

  rerender(jest.fn());

  jest.advanceTimersByTime(5);

  expect(callback).not.toHaveBeenCalled();
});
