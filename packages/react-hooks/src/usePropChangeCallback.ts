import { useCallback } from 'react';

/**
 * Returns a callback that can update a prop on an object. The update is done
 * by making a copy of the original object with an updated version of the prop
 * and passing the copy to a callback function.
 *
 * e.g.
 * const [value, setValue] = useState({
 *   first: 'John',
 *   last: 'Doe'
 * });
 *
 * const onLastNameChange = usePropChangeCallback(
 *   value,
 *   'last',
 *   setValue
 * );
 *
 * // This will create a new object { first: 'John', last: 'Smith' } and pass it to `setValue`
 * onLastNameChange('Smith');
 *
 * The optional `defaultValue` controls the callback signature. If provided, the
 * callback will support passing in null or undefined values.
 *
 * e.g.
 *
 * const onLastNameChange = usePropChangeCallback(
 *   value,
 *   'last',
 *   setValue,
 *   ''
 * );
 *
 * onLastNameChange('Smith');   // { first: 'John', last: 'Smith' }
 * onLastNameChange(null);      // { first: 'John', last: '' }
 * onLastNameChange(undefined); // { first: 'John', last: '' }
 *
 * @param value The object to update
 * @param propName The prop name to update
 * @param onChange A callback to pass the newly created object with updated prop value
 * @param defaultValue Optional default value. If provided, the returned callback
 * signature will allow null or undefined values to be passed in.
 */
export function usePropChangeCallback<T, K extends keyof T>(
  value: T,
  propName: K,
  onChange: (value: T) => void
): (propValue: T[K]) => void;
export function usePropChangeCallback<T, K extends keyof T>(
  value: T,
  propName: K,
  onChange: (value: T) => void,
  defaultValue: T[K]
): (propValue: T[K] | null | undefined) => void;
export function usePropChangeCallback<T, K extends keyof T>(
  value: T,
  propName: K,
  onChange: (value: T) => void,
  defaultValue?: T[K]
): (propValue: T[K] | null | undefined) => void {
  const hasDefault = arguments.length === 4;

  return useCallback(
    (propValue: T[K] | null | undefined) => {
      const newValue = hasDefault ? propValue ?? defaultValue : propValue;

      onChange({
        ...value,
        [propName]: newValue,
      });
    },
    [onChange, value, propName, hasDefault, defaultValue]
  );
}

export default usePropChangeCallback;
