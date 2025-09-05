import { act, renderHook } from '@testing-library/react';
import { useDelay } from './useDelay';

describe('useDelay', () => {
  const delay500 = 500;
  const delay1000 = 1000;
  const delay2000 = 2000;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return true while delay is active and false when done', () => {
    const { result } = renderHook(() => useDelay(delay1000));
    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(delay1000));

    expect(result.current).toBe(false);
  });

  it('should cancel setter when unmounted', () => {
    const { result, unmount } = renderHook(() => useDelay(delay1000));
    unmount();

    act(() => jest.advanceTimersByTime(delay1000));

    expect(result.current).toBe(true);
  });

  it('should reset when delayMs is changed', () => {
    const { result, rerender } = renderHook(
      ({ delayMs }) => useDelay(delayMs),
      {
        initialProps: { delayMs: delay1000 },
      }
    );

    act(() => jest.advanceTimersByTime(delay500));

    rerender({ delayMs: delay2000 });

    act(() => jest.advanceTimersByTime(delay1000));

    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(delay1000));

    expect(result.current).toBe(false);
  });
});
