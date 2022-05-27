import { FormattingRule } from '@deephaven/iris-grid';

export type WorkspaceSettings = {
  defaultDateTimeFormat: string;
  formatter: FormattingRule[];
  timeZone: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  disableMoveConfirmation: boolean;
  defaultDecimalFormatOptions: {
    defaultFormatString: string;
  };
  defaultIntegerFormatOptions: {
    defaultFormatString: string;
  };
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
