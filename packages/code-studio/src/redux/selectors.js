// Session
/**
 * Retrieve the current session and it's config
 * @param {Store} store The redux store that is used
 * @returns {{ session: dh.IdeSession, config: { type: string }}} The active session and it's options
 */
export const getSession = store => store.session;

/**
 * Get the layout storage used by the app
 * @param {Store} store The redux store
 * @returns {LayoutStorage} The layout storage instance
 */
export const getLayoutStorage = store => store.layoutStorage;
