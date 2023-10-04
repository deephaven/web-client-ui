import Log from '@deephaven/log';
import {
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
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

  static getServerConfigValueOrUseDefault<T>(
    serverConfigValues: Map<string, string> | undefined,
    key: string,
    defaultValue: T
  ): string | T {
    if (serverConfigValues && serverConfigValues.has(key)) {
      return serverConfigValues.get(key) ?? defaultValue;
    }
    return defaultValue;
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
        defaultDateTimeFormat:
          LocalWorkspaceStorage.getServerConfigValueOrUseDefault(
            serverConfigValues,
            'dateTimeFormat',
            DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING
          ),
        formatter: [],
        timeZone: LocalWorkspaceStorage.getServerConfigValueOrUseDefault(
          serverConfigValues,
          'timeZone',
          DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID
        ),
        showTimeZone: false,
        showTSeparator: true,
        disableMoveConfirmation: false,
        defaultDecimalFormatOptions: {
          defaultFormatString:
            LocalWorkspaceStorage.getServerConfigValueOrUseDefault(
              serverConfigValues,
              'decimalFormat',
              DecimalColumnFormatter.DEFAULT_FORMAT_STRING
            ),
        },
        defaultIntegerFormatOptions: {
          defaultFormatString:
            LocalWorkspaceStorage.getServerConfigValueOrUseDefault(
              serverConfigValues,
              'integerFormat',
              IntegerColumnFormatter.DEFAULT_FORMAT_STRING
            ),
        },
        truncateNumbersWithPound:
          serverConfigValues?.get('truncateNumbersWithPound') === 'true' ??
          false,
        defaultNotebookSettings: {
          isMinimapEnabled:
            serverConfigValues?.get('isMinimapEnabled') === 'true' ?? false,
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
      return JSON.parse(
        localStorage.getItem(LocalWorkspaceStorage.STORAGE_KEY) ?? ''
      );
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
