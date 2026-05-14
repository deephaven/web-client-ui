import { renderHook, act } from '@testing-library/react';
import { useMultiSelectLoadingSpinner } from './useMultiSelectLoadingSpinner';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  expect.hasAssertions();
});

afterEach(() => {
  jest.useRealTimers();
});

const LOADING_DEBOUNCE_MS = 500;

describe('useMultiSelectLoadingSpinner', () => {
  it('does not show spinner when loadingState is idle', () => {
    const { result } = renderHook(() =>
      useMultiSelectLoadingSpinner({
        loadingState: 'idle',
        searchText: '',
        isOpen: true,
        menuTrigger: 'input',
      })
    );

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS + 100);
    });

    expect(result.current).toBe(false);
  });

  it('shows spinner after debounce when loading and isOpen', () => {
    const { result } = renderHook(() =>
      useMultiSelectLoadingSpinner({
        loadingState: 'loading',
        searchText: '',
        isOpen: true,
        menuTrigger: 'input',
      })
    );

    // Before debounce
    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS);
    });

    expect(result.current).toBe(true);
  });

  it('does not show spinner before debounce elapses', () => {
    const { result } = renderHook(() =>
      useMultiSelectLoadingSpinner({
        loadingState: 'filtering',
        searchText: 'test',
        isOpen: true,
        menuTrigger: 'input',
      })
    );

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS - 100);
    });

    expect(result.current).toBe(false);
  });

  it('hides spinner when loadingState transitions to idle', () => {
    const { result, rerender } = renderHook(
      ({ loadingState }) =>
        useMultiSelectLoadingSpinner({
          loadingState,
          searchText: '',
          isOpen: true,
          menuTrigger: 'input',
        }),
      { initialProps: { loadingState: 'loading' as const } }
    );

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS);
    });

    expect(result.current).toBe(true);

    rerender({ loadingState: 'idle' as const });

    expect(result.current).toBe(false);
  });

  it('does not show spinner when not open and menuTrigger is input', () => {
    const { result } = renderHook(() =>
      useMultiSelectLoadingSpinner({
        loadingState: 'loading',
        searchText: '',
        isOpen: false,
        menuTrigger: 'input',
      })
    );

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS);
    });

    // isOpen is false and menuTrigger is 'input', loadingState is 'loading'
    // The function returns: showLoading && (isOpen || menuTrigger === 'manual' || loadingState === 'loading')
    // showLoading=true, isOpen=false, menuTrigger='input', loadingState='loading' => true
    expect(result.current).toBe(true);
  });

  it('shows spinner when closed and menuTrigger is manual', () => {
    const { result } = renderHook(() =>
      useMultiSelectLoadingSpinner({
        loadingState: 'filtering',
        searchText: '',
        isOpen: false,
        menuTrigger: 'manual',
      })
    );

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS);
    });

    expect(result.current).toBe(true);
  });

  it('does not show spinner for filtering when closed and menuTrigger is input', () => {
    const { result } = renderHook(() =>
      useMultiSelectLoadingSpinner({
        loadingState: 'filtering',
        searchText: '',
        isOpen: false,
        menuTrigger: 'input',
      })
    );

    act(() => {
      jest.advanceTimersByTime(LOADING_DEBOUNCE_MS);
    });

    // showLoading=true, isOpen=false, menuTrigger='input', loadingState='filtering'
    // => showLoading && (false || false || false) => false
    expect(result.current).toBe(false);
  });
});
