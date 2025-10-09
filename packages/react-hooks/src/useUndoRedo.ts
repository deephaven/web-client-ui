import { useCallback, useState } from 'react';

type UseUndoRedoReturn<T> = {
  state: T;
  set: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
};

/**
 * A hook that provides undo/redo functionality for a state value.
 * @param initialState The initial state value.
 * @param limit The maximum number of states to keep in the undo/redo history.
 * @returns An object containing the current state, functions to update the state,
 *          and flags indicating whether undo/redo actions are possible.
 */
export function useUndoRedo<T>(
  initialState: T,
  limit = 100
): UseUndoRedoReturn<T> {
  const [value, setValue] = useState({
    state: initialState,
    undoStack: [] as T[],
    redoStack: [] as T[],
  });

  const set = useCallback(
    (newState: T) => {
      setValue(prevValue => {
        const { undoStack, state } = prevValue;
        if (newState === state) {
          return prevValue;
        }

        undoStack.push(state);

        if (undoStack.length > limit) {
          undoStack.shift();
        }

        return {
          state: newState,
          undoStack,
          redoStack: [],
        };
      });
    },
    [limit]
  );

  const undo = useCallback(() => {
    setValue(prevValue => {
      if (prevValue.undoStack.length === 0) {
        return prevValue;
      }

      const { undoStack, redoStack, state } = prevValue;

      const newValue = undoStack.pop() as T;
      redoStack.push(state);

      return {
        state: newValue,
        undoStack,
        redoStack,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setValue(prevValue => {
      if (prevValue.redoStack.length === 0) {
        return prevValue;
      }

      const { undoStack, redoStack, state } = prevValue;

      const newValue = redoStack.pop() as T;
      undoStack.push(state);

      return {
        state: newValue,
        undoStack,
        redoStack,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setValue(prevValue => ({ ...prevValue, undoStack: [], redoStack: [] }));
  }, []);

  return {
    state: value.state,
    set,
    undo,
    redo,
    canUndo: value.undoStack.length > 0,
    canRedo: value.redoStack.length > 0,
    clear,
  };
}

export default useUndoRedo;
