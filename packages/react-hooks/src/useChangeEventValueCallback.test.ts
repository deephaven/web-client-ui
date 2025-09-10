import { renderHook } from '@testing-library/react';
import { useChangeEventValueCallback } from './useChangeEventValueCallback';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useChangeEventValueCallback', () => {
  const callback = jest.fn<void, [string]>();

  it('should return a callback function', () => {
    const { result } = renderHook(() => useChangeEventValueCallback(callback));
    expect(typeof result.current).toBe('function');
  });

  it('should call the callback with the target value', () => {
    const { result } = renderHook(() => useChangeEventValueCallback(callback));
    const event = {
      target: { value: 'test' },
    } as React.ChangeEvent<HTMLInputElement>;

    result.current(event);
    expect(callback).toHaveBeenCalledWith('test');
  });
});
