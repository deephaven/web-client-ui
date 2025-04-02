import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { nanoid } from 'nanoid';
import { PersistentStateContext } from './PersistentStateContext';

export default function usePersistentState<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
  // We use this id to track if the component re-renders due to calling setState in its render function.
  // Otherwise, usePersistentState might be called twice by the same component in the same render cycle before flushing in the provider.
  const [id] = useState(() => nanoid());
  const context = useContext(PersistentStateContext);
  const { value: initialPersistedState, done } = context?.getInitialState(
    id
  ) ?? {
    value: undefined,
    done: true,
  };
  // If not done, then we can use the persisted state
  // Otherwise, we have exhausted the persisted state
  // By checking done, we are able to explicitly save undefined as a state value
  const [state, setState] = useState(
    !done ? (initialPersistedState as S) : initialState
  );

  context?.addState(id, state);

  const setter = useCallback(
    (newState: SetStateAction<S>) => {
      setState(newState);
      context?.trigger();
    },
    [context]
  );

  useEffect(
    () => () => {
      context?.trigger();
    },
    [context]
  );

  return [state, setter];
}
