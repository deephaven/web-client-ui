import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

export type PersistentStateContextType = {
  addState: (id: string, state: unknown) => void;
  trigger: () => void;
  getInitialState: (id: string) => { value: unknown; done: boolean };
};

/**
 * Context that holds the ID of the panel that we are currently in.
 */
export const PersistentStateContext =
  createContext<PersistentStateContextType | null>(null);

export type PersistentStateProviderProps = React.PropsWithChildren<{
  /**
   * The initial state of all calls to usePersistentState.
   * If there are more calls to usePersistentState than there are elements in this array,
   * the state initializer of the usePersistentState call will be used for the rest.
   */
  initialState: unknown[];

  /**
   * Called when the state changes.
   * The state is passed as an array of the values of all calls to usePersistentState.
   * The order of the values is the same as the order of the calls to usePersistentState.
   * @param state The state of all calls to usePersistentState.
   */
  onChange: (state: unknown[]) => void;
}>;

/**
 * Tracks all calls to the usePersistentState hook below this provider.
 * Keeps track of the state in call order so and calls onChange when the state changes.
 */
export function PersistentStateProvider(
  props: PersistentStateProviderProps
): JSX.Element {
  const { initialState, onChange, children } = props;
  const [triggerCount, setTriggerCount] = React.useState(0);

  // We store the previous and next state in a map in case a component calls setState in its render function.
  // This would cause an immediate re-render and usePersistentState may be called multiple times from 1 component
  // before the render finishes and we run the effect to persist the state.
  // JS Maps iterate based on insertion order, so if a component renders multiple times its original position will be maintained
  // while updating its state if it changed in that re-render.
  const persistentData = useRef({
    initial: initialState,
    initialStateMap: new Map<string, { value: unknown; done: boolean }>(),
    state: new Map<string, unknown>(),
    isTracking: true, // We want to start tracking on the first render
  });

  const addState = useCallback((id: string, state: unknown) => {
    if (persistentData.current.isTracking) {
      persistentData.current.state.set(id, state);
    }
  }, []);

  const trigger = useCallback(() => {
    // Don't trigger again if we are already tracking a render
    if (!persistentData.current.isTracking) {
      persistentData.current.isTracking = true;
      persistentData.current.state = new Map<string, unknown>();
      setTriggerCount(prev => prev + 1);
    }
  }, []);

  const initialStateIterator = useRef(
    persistentData.current.initial[Symbol.iterator]()
  );

  const getInitialState = useCallback((id: string) => {
    // Prevents a component re-rendering multiple times in the same render cycle from taking multiple values from the iterator
    const initialStateForId = persistentData.current.initialStateMap.get(id);
    if (initialStateForId) {
      return initialStateForId;
    }
    const { value, done } = initialStateIterator.current.next();
    const stateVal = { value, done: done ?? false };
    persistentData.current.initialStateMap.set(id, stateVal);
    return stateVal;
  }, []);

  useEffect(
    function persistState() {
      if (persistentData.current.isTracking) {
        onChange([...persistentData.current.state.values()]);
        persistentData.current.isTracking = false;
      }
    },
    [triggerCount, onChange]
  );

  const contextValue = useMemo(
    () => ({
      addState,
      trigger,
      getInitialState,
      triggerCount,
    }),
    [addState, getInitialState, trigger, triggerCount]
  );

  return (
    <PersistentStateContext.Provider value={contextValue}>
      {children}
    </PersistentStateContext.Provider>
  );
}
