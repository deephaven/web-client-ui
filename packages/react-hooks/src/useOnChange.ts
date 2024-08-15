import { DependencyList } from 'react';
import usePrevious from './usePrevious';

/**
 * Custom hook that triggers a callback function immediately when any of the dependencies change.
 *
 * @param callback - The function to be called when the dependencies change.
 * @param deps - The list of dependencies to watch for changes.
 */
export function useOnChange(callback: () => void, deps: DependencyList): void {
  const prevDeps = usePrevious(deps);
  if (prevDeps === undefined || !deps.every((dep, i) => dep === prevDeps[i])) {
    callback();
  }
}

export default useOnChange;
