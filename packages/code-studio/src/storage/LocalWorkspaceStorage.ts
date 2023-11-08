import Log from '@deephaven/log';
import {
  WorkspaceStorage,
  WorkspaceStorageLoadOptions,
  CustomzableWorkspaceData,
  CustomizableWorkspace,
  WorkspaceSettings,
} from '@deephaven/redux';
import {
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
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

  static makeDefaultWorkspaceSettings(): WorkspaceSettings {
    return {
      defaultDateTimeFormat:
        DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING,
      formatter: [],
      timeZone: DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID,
      showTimeZone: false,
      showTSeparator: true,
      disableMoveConfirmation: false,
      defaultDecimalFormatOptions: {
        defaultFormatString: DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
      },
      defaultIntegerFormatOptions: {
        defaultFormatString: IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
      },
      truncateNumbersWithPound: false,
      defaultNotebookSettings: {
        isMinimapEnabled: false,
      },
    };
  }

  static async makeWorkspaceData(
    layoutStorage: LayoutStorage,
    options?: WorkspaceStorageLoadOptions,
    serverConfigValues?: Map<string, string>
  ): Promise<CustomzableWorkspaceData> {
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
        showTimeZone: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'showTimeZone'
        ),
        showTSeparator: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'showTSeparator'
        ),
        disableMoveConfirmation: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'disableMoveConfirmation'
        ),
        defaultDecimalFormatOptions:
          serverConfigValues?.get('decimalFormat') !== undefined
            ? {
                defaultFormatString: serverConfigValues?.get('decimalFormat'),
              }
            : undefined,
        defaultIntegerFormatOptions:
          serverConfigValues?.get('integerFormat') !== undefined
            ? {
                defaultFormatString: serverConfigValues?.get('integerFormat'),
              }
            : undefined,
        truncateNumbersWithPound: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'truncateNumbersWithPound'
        ),
        defaultNotebookSettings:
          serverConfigValues?.get('isMinimapEnabled') !== undefined
            ? {
                isMinimapEnabled: LocalWorkspaceStorage.getBooleanServerConfig(
                  serverConfigValues,
                  'isMinimapEnabled'
                ),
              }
            : undefined,
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
  ): Promise<CustomizableWorkspace> {
    return {
      data: await LocalWorkspaceStorage.makeWorkspaceData(
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
  ): Promise<CustomizableWorkspace> {
    try {
      const workspace = JSON.parse(
        localStorage.getItem(LocalWorkspaceStorage.STORAGE_KEY) ?? ''
      );
      if (workspace.data.settings.timeZone === undefined) {
        workspace.data.settings.timeZone = serverConfigValues?.get('timeZone');
      }
      if (workspace.data.settings.defaultDateTimeFormat === undefined) {
        workspace.data.settings.defaultDateTimeFormat =
          serverConfigValues?.get('dateTimeFormat');
      }
      if (
        workspace.data.settings.defaultDecimalFormatOptions === undefined &&
        serverConfigValues?.get('decimalFormat') !== undefined
      ) {
        workspace.data.settings.defaultDecimalFormatOptions = {
          defaultFormatString: serverConfigValues?.get('decimalFormat'),
        };
      }
      if (
        workspace.data.settings.defaultIntegerFormatOptions === undefined &&
        serverConfigValues?.get('integerFormat') !== undefined
      ) {
        workspace.data.settings.defaultIntegerFormatOptions = {
          defaultFormatString: serverConfigValues?.get('integerFormat'),
        };
      }
      if (workspace.data.settings.truncateNumbersWithPound === undefined) {
        workspace.data.settings.truncateNumbersWithPound =
          LocalWorkspaceStorage.getBooleanServerConfig(
            serverConfigValues,
            'truncateNumbersWithPound'
          );
      }
      if (
        workspace.data.settings.defaultNotebookSettings === undefined &&
        serverConfigValues?.get('isMinimapEnabled') !== undefined
      ) {
        workspace.data.settings.defaultNotebookSettings = {
          isMinimapEnabled: LocalWorkspaceStorage.getBooleanServerConfig(
            serverConfigValues,
            'isMinimapEnabled'
          ),
        };
      }
      return workspace;
    } catch (e) {
      console.log(e);
      log.info('Unable to load workspace data, initializing to default data');

      return LocalWorkspaceStorage.makeDefaultWorkspace(
        this.layoutStorage,
        options,
        serverConfigValues
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async save(workspace: CustomizableWorkspace): Promise<CustomizableWorkspace> {
    localStorage.setItem(
      LocalWorkspaceStorage.STORAGE_KEY,
      JSON.stringify(workspace)
    );
    return workspace;
  }
}

export default LocalWorkspaceStorage;
