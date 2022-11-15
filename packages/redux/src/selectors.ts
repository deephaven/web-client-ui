import type {
  RootState,
  User,
  Storage,
  Workspace,
  WorkspaceSettings,
} from './store';

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_MAP: ReadonlyMap<unknown, unknown> = new Map();

type Selector<R> = (state: RootState) => R;

// User
export const getUser: Selector<User> = store => store.user;

export const getUserName: Selector<User['name']> = store => getUser(store).name;

export const getUserGroups: Selector<User['groups']> = store =>
  getUser(store).groups;

// Storage
export const getStorage: Selector<Storage> = store => store.storage;

export const getCommandHistoryStorage: Selector<
  Storage['commandHistoryStorage']
> = store => getStorage(store).commandHistoryStorage;

export const getFileStorage: Selector<Storage['fileStorage']> = store =>
  getStorage(store).fileStorage;

export const getWorkspaceStorage: Selector<
  Storage['workspaceStorage']
> = store => getStorage(store).workspaceStorage;

// Workspace
export const getWorkspace: Selector<Workspace> = store => store.workspace;

// Settings
export const getSettings: Selector<WorkspaceSettings> = store =>
  getWorkspace(store).data.settings;

export const getDefaultDateTimeFormat: Selector<
  WorkspaceSettings['defaultDateTimeFormat']
> = store => getSettings(store).defaultDateTimeFormat;

export const getDefaultDecimalFormatOptions: Selector<
  WorkspaceSettings['defaultDecimalFormatOptions']
> = store => getSettings(store).defaultDecimalFormatOptions ?? EMPTY_OBJECT;

export const getDefaultIntegerFormatOptions: Selector<
  WorkspaceSettings['defaultIntegerFormatOptions']
> = store => getSettings(store).defaultIntegerFormatOptions ?? EMPTY_OBJECT;

export const getFormatter: Selector<WorkspaceSettings['formatter']> = store =>
  getSettings(store).formatter;

export const getTimeZone: Selector<WorkspaceSettings['timeZone']> = store =>
  getSettings(store).timeZone;

export const getShowTimeZone: Selector<
  WorkspaceSettings['showTimeZone']
> = store => getSettings(store).showTimeZone;

export const getShowTSeparator: Selector<
  WorkspaceSettings['showTSeparator']
> = store => getSettings(store).showTSeparator;

export const getTruncateNumbersWithPound: Selector<
  WorkspaceSettings['truncateNumbersWithPound']
> = store => getSettings(store).truncateNumbersWithPound;

export const getDisableMoveConfirmation: Selector<
  WorkspaceSettings['disableMoveConfirmation']
> = store => getSettings(store).disableMoveConfirmation || false;

export const getShortcutOverrides: Selector<
  WorkspaceSettings['shortcutOverrides']
> = store => getSettings(store).shortcutOverrides;

export const getDefaultNotebookSettings: Selector<
  WorkspaceSettings['defaultNotebookSettings']
> = store => getSettings(store).defaultNotebookSettings ?? EMPTY_OBJECT;

export const getActiveTool: Selector<RootState['activeTool']> = store =>
  store.activeTool;

export const getPlugins: Selector<RootState['plugins']> = store =>
  store.plugins ?? EMPTY_MAP;
