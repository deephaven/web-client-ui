export type WorkspaceFormattingRule = {
  columnType: string;
  columnName: string;
  format: string;
};

export type WorkspaceSettings = {
  defaultDateTimeFormat: string;
  formatter: WorkspaceFormattingRule[];
  timeZone: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  disableMoveConfirmation: boolean;
};

export type WorkspaceData = {
  settings: WorkspaceSettings;
};

export type Workspace = {
  data: WorkspaceData;
};

/**
 * Store the users workspace settings data.
 */
export interface WorkspaceStorage {
  load(): Promise<Workspace>;
  save(workspace: Workspace): Promise<Workspace>;
}

export default WorkspaceStorage;
