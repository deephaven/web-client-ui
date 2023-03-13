import type { RootState, Storage, WorkspaceSettings } from './store';

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_MAP: ReadonlyMap<unknown, unknown> = new Map();

export type Selector<State extends RootState, R> = (store: State) => R;
// User
export const getUser = <State extends RootState = RootState>(
  store: State
): State['user'] => store.user;

export const getUserName = <State extends RootState = RootState>(
  store: State
): State['user']['name'] => getUser(store).name;

export const getUserGroups = <State extends RootState = RootState>(
  store: State
): State['user']['groups'] => getUser(store).groups;

// Storage
export const getStorage = <State extends RootState = RootState>(
  store: State
): State['storage'] => store.storage;

export const getCommandHistoryStorage = <State extends RootState = RootState>(
  store: State
): State['storage']['commandHistoryStorage'] =>
  getStorage(store).commandHistoryStorage;

export const getFileStorage = <State extends RootState = RootState>(
  store: State
): State['storage']['fileStorage'] => getStorage(store).fileStorage;

export const getWorkspaceStorage = <State extends RootState = RootState>(
  store: State
): Storage['workspaceStorage'] => getStorage(store).workspaceStorage;

// Workspace
export const getWorkspace = <State extends RootState = RootState>(
  store: State
): RootState['workspace'] => store.workspace;

// Settings
export const getSettings = <State extends RootState = RootState>(
  store: State
): RootState['workspace']['data']['settings'] =>
  getWorkspace(store).data.settings;

export const getDefaultDateTimeFormat = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['defaultDateTimeFormat'] =>
  getSettings(store).defaultDateTimeFormat;

export const getDefaultDecimalFormatOptions = <
  State extends RootState = RootState
>(
  store: State
): WorkspaceSettings['defaultDecimalFormatOptions'] =>
  getSettings(store).defaultDecimalFormatOptions ?? EMPTY_OBJECT;

export const getDefaultIntegerFormatOptions = <
  State extends RootState = RootState
>(
  store: State
): WorkspaceSettings['defaultIntegerFormatOptions'] =>
  getSettings(store).defaultIntegerFormatOptions ?? EMPTY_OBJECT;

export const getFormatter = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['formatter'] => getSettings(store).formatter;

export const getTimeZone = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['timeZone'] => getSettings(store).timeZone;

export const getShowTimeZone = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['showTimeZone'] => getSettings(store).showTimeZone;

export const getShowTSeparator = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['showTSeparator'] => getSettings(store).showTSeparator;

export const getTruncateNumbersWithPound = <
  State extends RootState = RootState
>(
  store: State
): WorkspaceSettings['truncateNumbersWithPound'] =>
  getSettings(store).truncateNumbersWithPound;

export const getDisableMoveConfirmation = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['disableMoveConfirmation'] =>
  getSettings(store).disableMoveConfirmation || false;

export const getShortcutOverrides = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['shortcutOverrides'] =>
  getSettings(store).shortcutOverrides;

export const getDefaultNotebookSettings = <State extends RootState = RootState>(
  store: State
): WorkspaceSettings['defaultNotebookSettings'] =>
  getSettings(store).defaultNotebookSettings ?? EMPTY_OBJECT;

export const getActiveTool = <State extends RootState = RootState>(
  store: State
): RootState['activeTool'] => store.activeTool;

export const getPlugins = <State extends RootState = RootState>(
  store: State
): RootState['plugins'] => store.plugins ?? EMPTY_MAP;
