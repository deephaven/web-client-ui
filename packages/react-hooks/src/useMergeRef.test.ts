import React from 'react';
import { renderHook } from '@testing-library/react';
import { useMergeRef, mergeRefs } from './useMergeRef';

describe('mergeRefs', () => {
  it('merges ref objects', () => {
    const refA = React.createRef();
    const refB = React.createRef();
    const mergedRef = mergeRefs(refA, refB);

    const refValue = {};
    mergedRef(refValue);
    expect(refA.current).toBe(refValue);
    expect(refB.current).toBe(refValue);
  });

  it('merges ref callbacks', () => {
    const refA: React.RefCallback<unknown> = jest.fn();
    const refB: React.RefCallback<unknown> = jest.fn();
    const mergedRef = mergeRefs(refA, refB);

    const refValue = {};
    mergedRef(refValue);
    expect(refA).toHaveBeenCalledWith(refValue);
    expect(refB).toHaveBeenCalledWith(refValue);
  });

  it('ignores null/undefined refs', () => {
    const refA = React.createRef();
    const refB: React.RefCallback<unknown> = jest.fn();
    const refC = null;
    const refD = undefined;
    const mergedRef = mergeRefs(refA, refB, refC, refD);

    const refValue = {};
    mergedRef(refValue);
    expect(refA.current).toBe(refValue);
    expect(refB).toHaveBeenCalledWith(refValue);
    expect(refC).toBe(null);
    expect(refD).toBe(undefined);
  });
});

describe('useMergeRef', () => {
  it('should assign the ref to all refs passed in', () => {
    const ref1 = jest.fn();
    const ref2 = jest.fn();
    const ref3 = jest.fn();
    const { result } = renderHook(() => useMergeRef(ref1, ref2, ref3));
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
    const { result } = renderHook(() => useMergeRef(ref1, ref2, ref3));
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
      useMergeRef<HTMLDivElement | null>(ref1, ref2, ref3)
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
      useMergeRef<HTMLDivElement | null>(ref1, ref2, ref3)
    );
    const multiRef = result.current;
    const element = document.createElement('div');
    multiRef(element);
    expect(ref1).toHaveBeenCalledWith(element);
    expect(ref2.current).toBe(element);
    expect(ref3).toHaveBeenCalledWith(element);
  });
});
