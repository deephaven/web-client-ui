import type { Reducer } from 'redux';

/**
 * Setup a replace reducer for a specific action type.
 * Will take the payload passed in and replace the previous state
 * @param type The action type
 * @param initialState The initial state
 */
export default function replaceReducer<S>(
  type: string,
  initialState: S
): Reducer<S> {
  return (state = initialState, action) => {
    switch (action.type) {
      case type: {
        return action.payload;
      }
      default:
        return state;
    }
  };
}
