import { renderHook } from '@testing-library/react';
import useDebouncedCallback from './useDebouncedCallback';

const callback: (text: string) => void = jest.fn();
const arg = 'mock.arg';
const debounceMs = 400;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should debounce a given callback', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs)
  );

  result.current(arg);

  jest.advanceTimersByTime(debounceMs - 1);

  result.current(arg);

  jest.advanceTimersByTime(debounceMs - 1);

  expect(callback).not.toHaveBeenCalled();

  jest.advanceTimersByTime(debounceMs * 2);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(arg);
});

it('should cancel debounce if component unmounts', () => {
  const { result, unmount } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs)
  );

  result.current(arg);

  jest.advanceTimersByTime(debounceMs - 1);

  jest.spyOn(result.current, 'cancel');

  unmount();

  expect(result.current.cancel).toHaveBeenCalled();

  jest.advanceTimersByTime(1);

  expect(callback).not.toHaveBeenCalled();
});

it('should cancel debounce if callback reference changes', () => {
  const { rerender, result } = renderHook(
    fn => useDebouncedCallback(fn, debounceMs),
    {
      initialProps: callback,
    }
  );

  result.current(arg);

  jest.advanceTimersByTime(debounceMs - 1);

  const debouncedCallback = result.current;
  jest.spyOn(debouncedCallback, 'cancel');

  rerender(jest.fn());

  expect(debouncedCallback.cancel).toHaveBeenCalled();

  jest.advanceTimersByTime(1);

  expect(callback).not.toHaveBeenCalled();
});

it('should call immediately if given the leading option', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs, { leading: true })
  );

  result.current(arg);

  jest.advanceTimersByTime(1);

  expect(callback).toHaveBeenCalledWith(arg);

  result.current('arg2');

  jest.advanceTimersByTime(debounceMs);

  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith('arg2');
});

it('should call immediately if given the leading option', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs, { leading: true })
  );

  result.current(arg);

  jest.advanceTimersByTime(1);

  expect(callback).toHaveBeenCalledWith(arg);

  result.current('arg2');

  jest.advanceTimersByTime(debounceMs);

  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith('arg2');
});

it('should only call immediately for one call with leading true', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs, {
      leading: true,
    })
  );

  result.current(arg);

  jest.advanceTimersByTime(1);

  expect(callback).toHaveBeenCalledWith(arg);

  jest.advanceTimersByTime(debounceMs);

  expect(callback).toHaveBeenCalledTimes(1);
});

it('should not call at end if trailing is false', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs, {
      trailing: false,
    })
  );

  result.current(arg);

  jest.advanceTimersByTime(debounceMs * 0.5);

  result.current(arg);

  jest.advanceTimersByTime(debounceMs);

  expect(callback).not.toHaveBeenCalled();
});

it('should call after maxWait', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs, {
      maxWait: debounceMs,
    })
  );

  result.current(arg);

  jest.advanceTimersByTime(debounceMs * 0.5);

  result.current(arg);

  jest.advanceTimersByTime(debounceMs * 0.5);

  expect(callback).toHaveBeenCalledWith(arg);

  result.current(arg);

  jest.advanceTimersByTime(debounceMs);

  expect(callback).toHaveBeenCalledTimes(2);
});
