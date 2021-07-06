import Log from '@deephaven/log';
import { Formatter } from '@deephaven/iris-grid';
import { DateTimeColumnFormatter } from '@deephaven/iris-grid/dist/formatters';
import WorkspaceStorage, { Workspace, WorkspaceData } from './WorkspaceStorage';

const log = Log.module('LocalWorkspaceStorage');

/**
 * Implementation of WorkspaceStorage that just storage the workspace data in localStorage
 */
export class LocalWorkspaceStorage implements WorkspaceStorage {
  static readonly STORAGE_KEY = 'deephaven.WorkspaceStorage';

  static makeDefaultWorkspaceData(): WorkspaceData {
    return {
      settings: {
        defaultDateTimeFormat:
          DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING,
        formatter: Formatter.getDefaultFormattingRules(),
        timeZone: DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID,
        showTimeZone: false,
        showTSeparator: true,
        disableMoveConfirmation: false,
      },
    };
  }

  static makeDefaultWorkspace(): Workspace {
    return { data: LocalWorkspaceStorage.makeDefaultWorkspaceData() };
  }

  // eslint-disable-next-line class-methods-use-this
  async load(): Promise<Workspace> {
    try {
      return JSON.parse(
        localStorage.getItem(LocalWorkspaceStorage.STORAGE_KEY) ?? ''
      );
    } catch (e) {
      log.info('Unable to load workspace data, initializing to default data');
      return LocalWorkspaceStorage.makeDefaultWorkspace();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async save(workspace: Workspace): Promise<Workspace> {
    localStorage.setItem(
      LocalWorkspaceStorage.STORAGE_KEY,
      JSON.stringify(workspace)
    );
    return workspace;
  }
}

export default LocalWorkspaceStorage;
