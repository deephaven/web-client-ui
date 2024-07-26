import React from 'react';
import { mergeRefs } from './mergeRefs';

describe('mergeRefs', () => {
  test('merges ref objects', () => {
    const refA = React.createRef();
    const refB = React.createRef();
    const mergedRef = mergeRefs(refA, refB);

    const refValue = {};
    mergedRef(refValue);
    expect(refA.current).toBe(refValue);
    expect(refB.current).toBe(refValue);
  });

  test('merges ref callbacks', () => {
    const refA: React.RefCallback<unknown> = jest.fn();
    const refB: React.RefCallback<unknown> = jest.fn();
    const mergedRef = mergeRefs(refA, refB);

    const refValue = {};
    mergedRef(refValue);
    expect(refA).toHaveBeenCalledWith(refValue);
    expect(refB).toHaveBeenCalledWith(refValue);
  });

  test('ignores null/undefined refs', () => {
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
