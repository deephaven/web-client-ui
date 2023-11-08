import type {
  CustomizableWorkspace,
  RootState,
  WorkspaceSettings,
} from './store';

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_MAP: ReadonlyMap<unknown, unknown> = new Map();

export type Selector<State extends RootState, R> = (store: State) => R;

type Settings<State extends RootState> = State['defaultWorkspaceSettings'];

export const getApi = <State extends RootState>(store: State): State['api'] =>
  store.api;

// User
export const getUser = <State extends RootState>(store: State): State['user'] =>
  store.user;

export const getUserName = <State extends RootState>(
  store: State
): State['user']['name'] => getUser(store).name;

export const getUserGroups = <State extends RootState>(
  store: State
): State['user']['groups'] => getUser(store).groups;

// Storage
export const getStorage = <State extends RootState>(
  store: State
): State['storage'] => store.storage;

export const getCommandHistoryStorage = <State extends RootState>(
  store: State
): State['storage']['commandHistoryStorage'] =>
  getStorage(store).commandHistoryStorage;

export const getFileStorage = <State extends RootState>(
  store: State
): State['storage']['fileStorage'] => getStorage(store).fileStorage;

export const getWorkspaceStorage = <State extends RootState>(
  store: State
): State['storage']['workspaceStorage'] => getStorage(store).workspaceStorage;

export const getDefaultWorkspaceSettings = <State extends RootState>(
  store: State
): State['defaultWorkspaceSettings'] => store.defaultWorkspaceSettings;

// Workspace
export const getWorkspace = <State extends RootState>(
  store: State
): CustomizableWorkspace => {
  const { workspace } = store;
  return workspace;
};

// Settings
export const getSettings = <State extends RootState>(
  store: State
): WorkspaceSettings => {
  const customizedSettings = getWorkspace(store).data.settings;

  const settings = { ...getDefaultWorkspaceSettings(store) };
  const keys = Object.keys(customizedSettings) as (keyof WorkspaceSettings)[];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (customizedSettings[key] !== undefined) {
      // @ts-expect-error assign non-undefined customized settings to settings
      settings[key] = customizedSettings[key];
    }
  }
  return settings;
};

export const getDefaultDateTimeFormat = <State extends RootState>(
  store: State
): Settings<State>['defaultDateTimeFormat'] =>
  getSettings(store)?.defaultDateTimeFormat;

export const getDefaultDecimalFormatOptions = <
  State extends RootState = RootState,
>(
  store: State
): Settings<State>['defaultDecimalFormatOptions'] =>
  getSettings(store)?.defaultDecimalFormatOptions ?? EMPTY_OBJECT;

export const getDefaultIntegerFormatOptions = <
  State extends RootState = RootState,
>(
  store: State
): Settings<State>['defaultIntegerFormatOptions'] =>
  getSettings(store)?.defaultIntegerFormatOptions ?? EMPTY_OBJECT;

export const getFormatter = <State extends RootState>(
  store: State
): Settings<State>['formatter'] => getSettings(store)?.formatter ?? [];

export const getTimeZone = <State extends RootState>(
  store: State
): Settings<State>['timeZone'] => getSettings(store).timeZone;

export const getShowTimeZone = <State extends RootState>(
  store: State
): Settings<State>['showTimeZone'] => getSettings(store).showTimeZone;

export const getShowTSeparator = <State extends RootState>(
  store: State
): Settings<State>['showTSeparator'] => getSettings(store).showTSeparator;

export const getTruncateNumbersWithPound = <
  State extends RootState = RootState,
>(
  store: State
): Settings<State>['truncateNumbersWithPound'] =>
  getSettings(store).truncateNumbersWithPound;

export const getDisableMoveConfirmation = <State extends RootState>(
  store: State
): Settings<State>['disableMoveConfirmation'] =>
  getSettings(store).disableMoveConfirmation === true;

export const getShortcutOverrides = <State extends RootState>(
  store: State
): Settings<State>['shortcutOverrides'] => getSettings(store).shortcutOverrides;

export const getDefaultNotebookSettings = <State extends RootState>(
  store: State
): Settings<State>['defaultNotebookSettings'] =>
  getSettings(store).defaultNotebookSettings ?? EMPTY_OBJECT;

export const getActiveTool = <State extends RootState>(
  store: State
): State['activeTool'] => store.activeTool;

/**
 * @deprecated Use `usePlugins` hook instead or `PluginsContext` directly
 * @param store Redux store
 * @returns Plugins map
 */
export const getPlugins = <State extends RootState>(
  store: State
): State['plugins'] => store.plugins ?? EMPTY_MAP;
