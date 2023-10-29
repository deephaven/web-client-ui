import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import type { FileStorage } from '@deephaven/file-explorer';
import type { ValidKeyState } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { FormattingRule } from '@deephaven/jsapi-utils';
import type { PluginModuleMap } from '@deephaven/plugin';
import type { PayloadAction } from './actions';
import rootMiddleware from './middleware';
import reducers from './reducers';
import reducerRegistry from './reducerRegistry';

export interface UserPermissions {
  canUsePanels: boolean;
  canCopy: boolean;
  canDownloadCsv: boolean;
  canLogout: boolean;
}

export interface User {
  permissions: UserPermissions;
  name: string;
  operateAs?: string;
  groups: string[];
  displayName?: string;
  fullName?: string;
  image?: string;
}

export type ServerConfigValues = Map<string, string>;

export interface Storage {
  commandHistoryStorage: unknown;
  fileStorage: FileStorage;
  workspaceStorage: WorkspaceStorage;
}

export interface WorkspaceSettings {
  defaultDateTimeFormat?: string;
  defaultDecimalFormatOptions: {
    defaultFormatString?: string;
  };
  defaultIntegerFormatOptions: {
    defaultFormatString?: string;
  };
  formatter: FormattingRule[];
  timeZone?: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  truncateNumbersWithPound?: boolean;
  disableMoveConfirmation: boolean;
  shortcutOverrides?: {
    windows?: { [id: string]: ValidKeyState };
    mac?: { [id: string]: ValidKeyState };
  };
  defaultNotebookSettings: {
    isMinimapEnabled?: boolean;
  };
}

export interface WorkspaceData {
  closed: unknown[];
  filterSets: unknown[];
  layoutConfig: unknown[];
  links: unknown;
  settings: WorkspaceSettings;
}

export interface CustomzableWorkspaceData
  extends Omit<WorkspaceData, 'settings'> {
  settings: Partial<WorkspaceData['settings']>;
}

export interface CustomizableWorkspace {
  data: CustomzableWorkspaceData;
}

export interface Workspace {
  data: WorkspaceData;
}
export type DashboardData = Record<string, unknown>;

export type WorkspaceStorageLoadOptions = {
  isConsoleAvailable: boolean;
};

export interface WorkspaceStorage {
  load(options?: WorkspaceStorageLoadOptions): Promise<CustomizableWorkspace>;
  save(workspace: CustomizableWorkspace): Promise<CustomizableWorkspace>;
}

export type RootState = {
  api: DhType;
  activeTool: string;
  plugins: PluginModuleMap;
  storage: Storage;
  user: User;
  workspace: Workspace;
  defaultWorkspaceSettings: WorkspaceSettings;
  dashboardData: Record<string, DashboardData>;
  layoutStorage: unknown;
  serverConfigValues: ServerConfigValues;
};

Object.entries(reducers).map(([name, reducer]) =>
  reducerRegistry.register(name, reducer)
);

const composeEnhancers: typeof compose =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?? compose;

const store = createStore<RootState, PayloadAction, unknown, unknown>(
  combineReducers(reducerRegistry.reducers),
  composeEnhancers(applyMiddleware(...rootMiddleware))
);

reducerRegistry.setListener(newReducers => {
  store.replaceReducer(combineReducers(newReducers));
});

export default store;

export type RootDispatch = typeof store.dispatch;
