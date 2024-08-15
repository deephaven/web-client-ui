import { renderHook } from '@testing-library/react-hooks';
import useOnChange from './useOnChange';
import usePrevious from './usePrevious';

// Mock usePrevious to control its return value
jest.mock('./usePrevious');

describe('useOnChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the callback when dependencies change', () => {
    const callback = jest.fn();
    let deps = [1, 2];

    (usePrevious as jest.Mock).mockReturnValueOnce(undefined);

    const { rerender } = renderHook(() => useOnChange(callback, deps));

    // Initial render, callback should be called
    expect(callback).toHaveBeenCalledTimes(1);

    // Change dependencies
    deps = [2, 3];
    (usePrevious as jest.Mock).mockReturnValueOnce([1, 2]);

    rerender();

    // Callback should be called again
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not call the callback when dependencies do not change', () => {
    const callback = jest.fn();
    const deps = [1, 2];

    (usePrevious as jest.Mock).mockReturnValueOnce(undefined);

    const { rerender } = renderHook(() => useOnChange(callback, deps));

    // Initial render, callback should be called
    expect(callback).toHaveBeenCalledTimes(1);

    // Rerender with the same dependencies
    (usePrevious as jest.Mock).mockReturnValueOnce([1, 2]);

    rerender();

    // Callback should not be called again
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls the callback immediately on the first render', () => {
    const callback = jest.fn();
    const deps = [1, 2];

    (usePrevious as jest.Mock).mockReturnValueOnce(undefined);

    renderHook(() => useOnChange(callback, deps));

    // Callback should be called immediately on the first render
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
