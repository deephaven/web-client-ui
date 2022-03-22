import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import type { FileStorage } from '@deephaven/file-explorer';
import type { ValidKeyState } from '@deephaven/components';
import type { FormattingRule } from '@deephaven/iris-grid';
import type { PayloadAction } from './actions';
import rootMiddleware from './middleware';
import reducers from './reducers';
import reducerRegistry from './reducerRegistry';

// A DeephavenPluginModule. This interface should have new fields added to it from different levels of plugins.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeephavenPluginModule {}

export type DeephavenPluginModuleMap = Map<string, DeephavenPluginModule>;

export interface User {
  name: string;
  operateAs: string;
  groups: string[];
}

export interface Storage {
  commandHistoryStorage: unknown;
  fileStorage: FileStorage;
  workspaceStorage: WorkspaceStorage;
}

export interface WorkspaceSettings {
  defaultDateTimeFormat: string;
  defaultDecimalFormatOptions?: {
    defaultFormatString?: string;
  };
  defaultIntegerFormatOptions?: {
    defaultFormatString?: string;
  };
  formatter: FormattingRule[];
  timeZone: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  truncateNumbersWithPound: boolean;
  disableMoveConfirmation: boolean;
  showSystemBadge: boolean;
  shortcutOverrides?: {
    windows?: { [id: string]: ValidKeyState };
    mac?: { [id: string]: ValidKeyState };
  };
}

export interface WorkspaceData {
  settings: WorkspaceSettings;
  data: Record<string, unknown>;
  layoutConfig: Record<string, unknown>[];
  closed: Record<string, unknown>[];
}

export interface Workspace {
  data: WorkspaceData;
}

export interface WorkspaceStorage {
  load(): Promise<Workspace>;
  save(workspace: Workspace): Promise<Workspace>;
}

export type RootState = {
  activeTool: string;
  plugins: DeephavenPluginModuleMap;
  storage: Storage;
  user: User;
  workspace: Workspace;
};

Object.entries(reducers).map(([name, reducer]) =>
  reducerRegistry.register(name, reducer)
);

const composeEnhancers: typeof compose =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore<RootState, PayloadAction, unknown, unknown>(
  combineReducers(reducerRegistry.reducers),
  composeEnhancers(applyMiddleware(...rootMiddleware))
);

reducerRegistry.setListener(newReducers => {
  store.replaceReducer(combineReducers(newReducers));
});

export default store;

export type RootDispatch = typeof store.dispatch;
