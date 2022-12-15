import deepEqual from 'deep-equal';
import type { Reducer } from 'redux';

/**
 * Setup a replace reducer for a specific action type.
 * Will take the payload passed in and replace the entity at the id with the payload
 * @param type The action type
 */
export default function replaceByIdReducer<S extends Record<string, unknown>>(
  type: string,
  initialState: S = {} as never,
  checkIfChanged = true
): Reducer<S> {
  return (state = initialState, action?) => {
    switch (action.type) {
      case type: {
        const { id, payload } = action;
        if (checkIfChanged && deepEqual({ payload }, { payload: state[id] })) {
          return state;
        }
        return {
          ...state,
          [id]: payload,
        };
      }
      default:
        return state;
    }
  };
}
