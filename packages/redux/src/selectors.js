// User
export const getUser = store => store.user;

export const getUserName = store => getUser(store).name;

export const getUserGroups = store => getUserGroups(store).groups;

// Storage
export const getStorage = store => store.storage;

export const getCommandHistoryStorage = store =>
  getStorage(store).commandHistoryStorage;

export const getFileStorage = store => getStorage(store).fileStorage;

export const getWorkspaceStorage = store => getStorage(store).workspaceStorage;

// Workspace
export const getWorkspace = store => store.workspace;

// Settings
export const getSettings = store => getWorkspace(store).data.settings;

export const getDefaultDateTimeFormat = store =>
  getSettings(store).defaultDateTimeFormat;

export const getFormatter = store => getSettings(store).formatter;

export const getTimeZone = store => getSettings(store).timeZone;

export const getShowTimeZone = store => getSettings(store).showTimeZone;

export const getShowTSeparator = store => getSettings(store).showTSeparator;

export const getDisableMoveConfirmation = store =>
  getSettings(store).disableMoveConfirmation || false;

export const getShowSystemBadge = store => getSettings(store).showSystemBadge;

export const getActiveTool = store => store.activeTool;
