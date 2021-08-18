/**
 * Retrieve the current session and it's config
 * @param {Store} store The redux store that is used
 * @returns {SessionWrapper} The wrapper for the active session and it's config
 */
export const getSessionWrapper = store => store.sessionWrapper;

/**
 * Get the layout storage used by the app
 * @param {Store} store The redux store
 * @returns {LayoutStorage} The layout storage instance
 */
export const getLayoutStorage = store => store.layoutStorage;
