import { renderHook } from '@testing-library/react-hooks';
import useMultiRef from './useMultiRef';

describe('useMultiRef', () => {
  it('should assign the ref to all refs passed in', () => {
    const ref1 = jest.fn();
    const ref2 = jest.fn();
    const ref3 = jest.fn();
    const { result } = renderHook(() => useMultiRef(ref1, ref2, ref3));
    const multiRef = result.current;
    const element = document.createElement('div');
    multiRef(element);
    expect(ref1).toHaveBeenCalledWith(element);
    expect(ref2).toHaveBeenCalledWith(element);
    expect(ref3).toHaveBeenCalledWith(element);
  });

  it('should assign the ref to all refs passed in with null', () => {
    const ref1 = jest.fn();
    const ref2 = jest.fn();
    const ref3 = jest.fn();
    const { result } = renderHook(() => useMultiRef(ref1, ref2, ref3));
    const multiRef = result.current;
    multiRef(null);
    expect(ref1).toHaveBeenCalledWith(null);
    expect(ref2).toHaveBeenCalledWith(null);
    expect(ref3).toHaveBeenCalledWith(null);
  });

  it('should work with non-function refs', () => {
    const ref1 = { current: null };
    const ref2 = { current: null };
    const ref3 = { current: null };
    const { result } = renderHook(() =>
      useMultiRef<HTMLDivElement | null>(ref1, ref2, ref3)
    );
    const multiRef = result.current;
    const element = document.createElement('div');
    multiRef(element);
    expect(ref1.current).toBe(element);
    expect(ref2.current).toBe(element);
    expect(ref3.current).toBe(element);
  });

  it('should handle a mix of function and non-function refs', () => {
    const ref1 = jest.fn();
    const ref2 = { current: null };
    const ref3 = jest.fn();
    const { result } = renderHook(() =>
      useMultiRef<HTMLDivElement | null>(ref1, ref2, ref3)
    );
    const multiRef = result.current;
    const element = document.createElement('div');
    multiRef(element);
    expect(ref1).toHaveBeenCalledWith(element);
    expect(ref2.current).toBe(element);
    expect(ref3).toHaveBeenCalledWith(element);
  });
});
