import { useCallback } from 'react';

/**
 * Returns a callback function that calls the given callback with the `target.value` of
 * an input change event.
 * @param callback the callback to call with the `target.value`
 * @returns a callback function that calls the given callback with the `target.value`
 * @example
 * const [value, setValue] = useState('');
 * const onChange = useChangeEventValueCallback(setValue);
 * <input value={value} onChange={onChange} />
 */
export function useChangeEventValueCallback<TInput extends HTMLInputElement>(
  callback: (value: string) => void
): (event: React.ChangeEvent<TInput>) => void {
  return useCallback(
    (event: React.ChangeEvent<TInput>) => {
      callback(event.target.value);
    },
    [callback]
  );
}

export default useChangeEventValueCallback;
