/**
 * Retrieve the current session and it's config
 * @param {Store} store The redux store that is used
 * @returns {SessionWrapper} The wrapper for the active session and it's config
 */
// eslint-disable-next-line import/prefer-default-export
export const getSessionWrapper = store => store.sessionWrapper;
