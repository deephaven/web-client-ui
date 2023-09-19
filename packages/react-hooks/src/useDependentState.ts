import { useEffect, useState } from 'react';

/**
 * Returns a stateful value, and a function to update it. The value will also
 * be updated if the input value changes.
 * @param inputValue This will be used as the initial state value and will also
 * update the state if it changes.
 */
export function useDependentState<D>(inputValue: D): [D, (data: D) => void] {
  const [state, setState] = useState<D>(inputValue);

  useEffect(() => {
    setState(inputValue);
  }, [inputValue]);

  return [state, setState];
}

export default useDependentState;
