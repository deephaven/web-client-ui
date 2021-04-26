import deepEqual from 'deep-equal';

/**
 * Setup a replace reducer for a specific action type.
 * Will take the payload passed in and replace the entity at the id with the payload
 * @param {string} type The action type
 */
export default (type, initialState = {}, checkIfChanged = true) => (
  state = initialState,
  action
) => {
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
