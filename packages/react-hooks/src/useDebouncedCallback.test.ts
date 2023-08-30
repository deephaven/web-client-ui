import { renderHook } from '@testing-library/react-hooks';
import useDebouncedCallback from './useDebouncedCallback';

const callback: (text: string) => void = jest.fn();
const arg = 'mock.arg';
const debounceMs = 400;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

it('should debounce a given callback', () => {
  const { result } = renderHook(() =>
    useDebouncedCallback(callback, debounceMs)
  );

  result.current(arg);

  jest.advanceTimersByTime(debounceMs - 1);

  expect(callback).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1);

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
