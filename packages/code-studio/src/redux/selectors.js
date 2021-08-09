// Session
/**
 * Retrieve the current session and it's config
 * @param {Store} store The redux store that is used
 * @returns {{ session: dh.IdeSession, config: { type: string }}} The active session and it's options
 */
// eslint-disable-next-line import/prefer-default-export
export const getSession = store => store.session;
