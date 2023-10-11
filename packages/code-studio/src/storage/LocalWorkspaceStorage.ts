import Log from '@deephaven/log';
import {
  WorkspaceStorage,
  Workspace,
  WorkspaceData,
  WorkspaceStorageLoadOptions,
} from '@deephaven/redux';
import UserLayoutUtils from '../main/UserLayoutUtils';
import LayoutStorage from './LayoutStorage';

const log = Log.module('LocalWorkspaceStorage');

/**
 * Implementation of WorkspaceStorage that just stores the workspace data in localStorage
 */
export class LocalWorkspaceStorage implements WorkspaceStorage {
  static readonly STORAGE_KEY = 'deephaven.WorkspaceStorage';

  static getBooleanServerConfig(
    serverConfigValues: Map<string, string> | undefined,
    key: string
  ): boolean | undefined {
    if (serverConfigValues?.get(key)?.toLowerCase() === 'true') {
      return true;
    }
    if (serverConfigValues?.get(key)?.toLowerCase() === 'false') {
      return false;
    }
    return undefined;
  }

  static async makeDefaultWorkspaceData(
    layoutStorage: LayoutStorage,
    options?: WorkspaceStorageLoadOptions,
    serverConfigValues?: Map<string, string>
  ): Promise<WorkspaceData> {
    const { filterSets, links, layoutConfig } =
      await UserLayoutUtils.getDefaultLayout(
        layoutStorage,
        options?.isConsoleAvailable
      );
    return {
      settings: {
        defaultDateTimeFormat: serverConfigValues?.get('dateTimeFormat'),
        formatter: [],
        timeZone: serverConfigValues?.get('timeZone'),
        showTimeZone: false,
        showTSeparator: true,
        disableMoveConfirmation: false,
        defaultDecimalFormatOptions: {
          defaultFormatString: serverConfigValues?.get('decimalFormat'),
        },
        defaultIntegerFormatOptions: {
          defaultFormatString: serverConfigValues?.get('integerFormat'),
        },
        truncateNumbersWithPound: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'truncateNumbersWithPound'
        ),
        defaultNotebookSettings: {
          isMinimapEnabled: LocalWorkspaceStorage.getBooleanServerConfig(
            serverConfigValues,
            'isMinimapEnabled'
          ),
        },
      },
      layoutConfig,
      closed: [{}],
      links,
      filterSets,
    };
  }

  static async makeDefaultWorkspace(
    layoutStorage: LayoutStorage,
    options?: WorkspaceStorageLoadOptions,
    serverConfigValues?: Map<string, string>
  ): Promise<Workspace> {
    return {
      data: await LocalWorkspaceStorage.makeDefaultWorkspaceData(
        layoutStorage,
        options,
        serverConfigValues
      ),
    };
  }

  private layoutStorage: LayoutStorage;

  constructor(layoutStorage: LayoutStorage) {
    this.layoutStorage = layoutStorage;
  }

  // eslint-disable-next-line class-methods-use-this
  async load(
    options?: WorkspaceStorageLoadOptions,
    serverConfigValues?: Map<string, string>
  ): Promise<Workspace> {
    try {
      const workspace = JSON.parse(
        localStorage.getItem(LocalWorkspaceStorage.STORAGE_KEY) ?? ''
      );
      if (workspace.settings.timeZone === undefined) {
        workspace.settings.timeZone = serverConfigValues?.get('timeZone');
      }
      if (workspace.settings.defaultDateTimeFormat === undefined) {
        workspace.settings.defaultDateTimeFormat =
          serverConfigValues?.get('dateTimeFormat');
      }
      if (
        workspace.settings.defaultDecimalFormatOptions.defaultFormatString ===
        undefined
      ) {
        workspace.settings.defaultDecimalFormatOptions = {
          defaultFormatString: serverConfigValues?.get('decimalFormat'),
        };
      }
      if (
        workspace.settings.defaultIntegerFormatOptions.defaultFormatString ===
        undefined
      ) {
        workspace.settings.defaultIntegerFormatOptions = {
          defaultFormatString: serverConfigValues?.get('integerFormat'),
        };
      }
      if (workspace.settings.truncateNumbersWithPound === undefined) {
        workspace.settings.truncateNumbersWithPound =
          LocalWorkspaceStorage.getBooleanServerConfig(
            serverConfigValues,
            'truncateNumbersWithPound'
          );
      }
      if (
        workspace.settings.defaultNotebookSettings.isMinimapEnabled ===
        undefined
      ) {
        workspace.settings.defaultNotebookSettings = {
          isMinimapEnabled: LocalWorkspaceStorage.getBooleanServerConfig(
            serverConfigValues,
            'isMinimapEnabled'
          ),
        };
      }
      return workspace;
    } catch (e) {
      log.info('Unable to load workspace data, initializing to default data');
      return LocalWorkspaceStorage.makeDefaultWorkspace(
        this.layoutStorage,
        options,
        serverConfigValues
      );
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
