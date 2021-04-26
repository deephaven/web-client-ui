/**
 * Setup a merge reducer for a specific action type.
 * Will take the payload passed in and merge it with the previous state to update.
 * @param {string} type The action type
 * @param {any} initialState The initial state
 */
export default (type, initialState) => (state = initialState, action) => {
  switch (action.type) {
    case type: {
      const newState = action.payload;
      if (newState == null) {
        return null;
      }

      if (state != null) {
        return {
          ...state,
          ...newState,
        };
      }

      return { ...newState };
    }
    default:
      return state;
  }
};
