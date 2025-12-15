import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type PersistentStateContextType = {
  /**
   * Adds state to be persisted.
   * @param hookId Unique ID for this hook instance
   * @param dhId The dhId of the component/panel.
   * @param state The state to persist. Needs to be JSON serializable.
   */
  addState: (hookId: string, dhId: string, state: PersistentState) => void;

  /**
   * Removes persisted state.
   * @param hookId Unique ID for this hook instance
   * @param dhId The dhId of the component/panel
   * @param type The state type to remove
   */
  removeState: (hookId: string, dhId: string, type: string) => void;

  /**
   * Deregisters a hook instance so it no longer owns any state.
   * This way we can accurately warn about multiple hooks trying to use the same (dhId, type) pair.
   * @param hookId Unique ID for this hook instance
   * @param dhId The dhId of the component/panel to deregister for
   * @param type The state type to deregister for
   */
  deregisterHook: (hookId: string, dhId: string, type: string) => void;

  /**
   * Gets the state for the given dhId and type.
   * Prepopulated with the initial state passed to the PersistentStateProvider.
   * @param dhId The dhId of the component/panel
   * @returns The iterator result containing the initial state value (state, version, type) if it exists.
   */
  getState: <S>(dhId: string, type: string) => PersistentState<S> | undefined;
};

/**
 * Context that holds methods to track the state of all calls to usePersistentState below this provider.
 */
export const PersistentStateContext =
  createContext<PersistentStateContextType | null>(null);
PersistentStateContext.displayName = 'PersistentStateContext';

export type PersistentState<S = unknown> = {
  state: S;
  version: number;
  type: string;
};

export type PersistentStateProviderProps = React.PropsWithChildren<{
  /**
   * The initial state of all calls to usePersistentState.
   * If there are more calls to usePersistentState than there are elements in this array,
   * the state initializer of the usePersistentState call will be used for the rest.
   */
  initialState: [PersistentStateKey, PersistentState][] | PersistentState[];

  /**
   * Called when the state changes.
   * The state is passed as an array of the values of all calls to usePersistentState.
   * The order of the values is the same as the order of the calls to usePersistentState.
   * @param state The state of all calls to usePersistentState.
   */
  onChange: (state: [PersistentStateKey, PersistentState][]) => void;
}>;

function makeKey(dhId: string, type: string): PersistentStateKey {
  return `${dhId}::${type}`;
}

type PersistentStateKey = string;

/**
 * Tracks all calls to the usePersistentState hook below this provider.
 * Keeps track of the state based on dhId and state type, and calls onChange when the state changes.
 * Limit to one state per (dhId, type) pair.
 */
export function PersistentStateProvider(
  props: PersistentStateProviderProps
): JSX.Element {
  const { initialState, onChange, children } = props;

  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  const needsMigrationToMap = useRef(false);

  const [stateMap] = useState(() => {
    if (
      Array.isArray(initialState) &&
      initialState.flat().length === 2 * initialState.length
    ) {
      return new Map<string, PersistentState>(
        initialState as [string, PersistentState][]
      );
    }
    needsMigrationToMap.current = true;
    // Used to migrate from array to map
    return new Map<string, PersistentState>();
  });

  // Track which hookId currently owns each (dhId, type) pair
  const hookOwnership = useRef(new Map<PersistentStateKey, string>());

  const addState = useCallback(
    (hookId: string, dhId: string, state: PersistentState) => {
      const { type } = state;
      const key = makeKey(dhId, type);
      const currentOwner = hookOwnership.current.get(key);

      if (currentOwner != null && currentOwner !== hookId) {
        throw new Error(
          `Detected multiple persistent states of type ${type} for dhId ${dhId}. Only one state per (dhId, type) pair is allowed.`
        );
      }

      hookOwnership.current.set(key, hookId);

      if (isMounted.current && stateMap.get(key) !== state) {
        stateMap.set(key, state);
        onChange([...stateMap.entries()]);
      }
    },
    [isMounted, onChange, stateMap]
  );

  const initialStateIterator = useRef(initialState[Symbol.iterator]());

  const getState = useCallback(
    <S,>(id: string, type: string): PersistentState<S> | undefined => {
      const key = makeKey(id, type);
      const state = stateMap.get(key);
      if (state == null && needsMigrationToMap.current) {
        const { value } = initialStateIterator.current.next();
        const stateVal = value as PersistentState<S> | undefined;
        stateMap.set(key, stateVal as PersistentState);
        return stateVal;
      }

      return state as PersistentState<S> | undefined;
    },
    [stateMap]
  );

  const removeState = useCallback(
    (hookId: string, dhId: string, type: string) => {
      const key = makeKey(dhId, type);
      const currentOwner = hookOwnership.current.get(key);

      // Only remove if this hookId is the current owner
      if (currentOwner === hookId) {
        stateMap.delete(key);
        hookOwnership.current.delete(key);
        if (isMounted.current) {
          onChange([...stateMap.entries()]);
        }
      }
    },
    [isMounted, onChange, stateMap]
  );

  const deregisterHook = useCallback(
    (hookId: string, dhId: string, type: string) => {
      const key = makeKey(dhId, type);
      const currentOwner = hookOwnership.current.get(key);

      // Only remove if this hookId is the current owner
      if (currentOwner === hookId) {
        hookOwnership.current.delete(key);
      }
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      addState,
      removeState,
      deregisterHook,
      getState,
    }),
    [addState, getState, removeState, deregisterHook]
  );

  return (
    <PersistentStateContext.Provider value={contextValue}>
      {children}
    </PersistentStateContext.Provider>
  );
}
