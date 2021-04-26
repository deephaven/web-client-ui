/**
 * Setup a replace reducer for a specific action type.
 * Will take the payload passed in and replace the previous state
 * @param {string} type The action type
 * @param {any} initialState The initial state
 */
export default (type, initialState) => (state = initialState, action) => {
  switch (action.type) {
    case type: {
      return action.payload;
    }
    default:
      return state;
  }
};
