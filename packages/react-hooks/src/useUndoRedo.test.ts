import { renderHook, act, waitFor } from '@testing-library/react';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
  it('should initialize with initial state', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    expect(result.current.state).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should set new state and allow undo', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.set(1));
    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo state change', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.set(1));
    act(() => result.current.undo());
    expect(result.current.state).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo state change', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.set(1));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should not undo if undoStack is empty', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.undo());
    expect(result.current.state).toBe(0);
    expect(result.current.canUndo).toBe(false);
  });

  it('should not redo if redoStack is empty', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.redo());
    expect(result.current.state).toBe(0);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear undo and redo stacks', async () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.set(1));
    act(() => result.current.set(2));
    act(() => result.current.clear());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toBe(2);
    act(() => result.current.undo());
    expect(result.current.state).toBe(2);
    expect(() => result.current.redo());
    expect(result.current.state).toBe(2);
  });

  it('should respect the limit of undo stack', () => {
    const { result } = renderHook(() => useUndoRedo(0, 2));
    act(() => result.current.set(1));
    act(() => result.current.set(2));
    act(() => result.current.set(3));
    // Only last 2 states should be in undoStack
    act(() => result.current.undo());
    expect(result.current.state).toBe(2);
    act(() => result.current.undo());
    expect(result.current.state).toBe(1);
    act(() => result.current.undo());
    // Should not undo beyond limit
    expect(result.current.state).toBe(1);
  });

  it('should not push to undoStack if newState is same as current', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    act(() => result.current.set(0));
    expect(result.current.canUndo).toBe(false);
  });
});
