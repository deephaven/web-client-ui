import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import type { FileStorage } from '@deephaven/file-explorer';
import type { PayloadAction } from './actions';
import rootMiddleware from './middleware';
import reducers from './reducers';
import reducerRegistry from './reducerRegistry';

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

interface WorkspaceFormattingRule {
  columnType: string;
  columnName: string;
  format: {
    label: string;
    formatString: string;
    type: string;
  };
}

export interface WorkspaceSettings {
  defaultDateTimeFormat: string;
  formatter: WorkspaceFormattingRule[];
  timeZone: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  disableMoveConfirmation: boolean;
  showSystemBadge: boolean;
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

export interface RootState {
  user: User;
  storage: Storage;
  workspace: Workspace;
  activeTool: string;
}

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
