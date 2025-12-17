import type { UndoPartial } from '@deephaven/utils';
import { memoize } from 'proxy-memoize';
import type { RootState, WorkspaceSettings } from './store';
import { dhPython } from 'packages/icons/dist';
import { set } from 'node_modules/@types/lodash';

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
): State['workspace'] => {
  const { workspace } = store;
  return workspace;
};

/**
 * Helpter function to replace settings values
 * Any nested objects under workspace settings need to be handled here
 * @param key the key of the setting to replace
 * @param settings current settings object
 * @param customizedSettings customized settings to apply
 */
const replaceSettings = (
  key: keyof WorkspaceSettings,
  settings: WorkspaceSettings,
  customizedSettings: UndoPartial<WorkspaceSettings>
): void => {
  let newSettings = customizedSettings[key];
  if (key === 'notebookSettings') {
    const customizedLinter =
      customizedSettings.notebookSettings?.python?.linter;
    const settingsLinter = settings.notebookSettings?.python?.linter;
    newSettings = {
      ...settings.notebookSettings,
      ...customizedSettings.notebookSettings,
      python: {
        linter: {
          isEnabled: customizedLinter?.isEnabled ?? settingsLinter?.isEnabled,
          config: customizedLinter?.config ?? settingsLinter?.config,
        },
      },
    };
  }
  // @ts-expect-error assign non-undefined customized settings to settings
  settings[key] = newSettings;
};

// Settings
export const getSettings = memoize(
  <State extends RootState>(
    store: State
  ): UndoPartial<State['workspace']['data']['settings']> => {
    const customizedSettings = getWorkspace(store)?.data.settings ?? {};

    const settings = { ...getDefaultWorkspaceSettings(store) };
    const keys = Object.keys(customizedSettings) as (keyof WorkspaceSettings)[];
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (customizedSettings[key] !== undefined) {
        replaceSettings(
          key,
          settings,
          customizedSettings as UndoPartial<WorkspaceSettings>
        );
      }
    }
    return settings as UndoPartial<State['workspace']['data']['settings']>;
  }
);

export const getDefaultSettings = <State extends RootState>(
  store: State
): Settings<State> => store.defaultWorkspaceSettings;

export const getDefaultDateTimeFormat = <State extends RootState>(
  store: State
): Settings<State>['defaultDateTimeFormat'] =>
  getSettings(store).defaultDateTimeFormat;

export const getDefaultDecimalFormatOptions = <
  State extends RootState = RootState,
>(
  store: State
): Settings<State>['defaultDecimalFormatOptions'] =>
  getSettings(store).defaultDecimalFormatOptions ?? EMPTY_OBJECT;

export const getDefaultIntegerFormatOptions = <
  State extends RootState = RootState,
>(
  store: State
): Settings<State>['defaultIntegerFormatOptions'] =>
  getSettings(store).defaultIntegerFormatOptions ?? EMPTY_OBJECT;

export const getFormatter = <State extends RootState>(
  store: State
): Settings<State>['formatter'] => getSettings(store).formatter ?? [];

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

export const getShowEmptyStrings = <State extends RootState = RootState>(
  store: State
): Settings<State>['showEmptyStrings'] => getSettings(store).showEmptyStrings;

export const getShowNullStrings = <State extends RootState = RootState>(
  store: State
): Settings<State>['showNullStrings'] => getSettings(store).showNullStrings;

export const getShowExtraGroupColumn = <State extends RootState = RootState>(
  store: State
): Settings<State>['showExtraGroupColumn'] =>
  getSettings(store).showExtraGroupColumn;

export const getDisableMoveConfirmation = <State extends RootState>(
  store: State
): Settings<State>['disableMoveConfirmation'] =>
  getSettings(store).disableMoveConfirmation === true;

export const getShortcutOverrides = <State extends RootState>(
  store: State
): Settings<State>['shortcutOverrides'] => getSettings(store).shortcutOverrides;

export const getWebGL = <State extends RootState>(
  store: State
): Settings<State>['webgl'] => getSettings(store).webgl;

export const getWebGLEditable = <State extends RootState>(
  store: State
): Settings<State>['webglEditable'] => getSettings(store).webglEditable;

export const getNotebookSettings = <State extends RootState>(
  store: State
): Settings<State>['notebookSettings'] =>
  getSettings(store).notebookSettings ?? EMPTY_OBJECT;

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
