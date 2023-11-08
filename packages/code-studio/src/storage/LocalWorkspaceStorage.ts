import Log from '@deephaven/log';
import {
  WorkspaceStorage,
  WorkspaceStorageLoadOptions,
  CustomizableWorkspaceData,
  CustomizableWorkspace,
  WorkspaceSettings,
  ServerConfigValues,
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

  static makeDefaultWorkspaceSettings(
    serverConfigValues: ServerConfigValues
  ): WorkspaceSettings {
    const settings = {
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
    const serverSettings = {
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
              ) as boolean,
            }
          : undefined,
    };

    const keys = Object.keys(serverSettings) as Array<keyof typeof settings>;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (serverSettings[key] !== undefined) {
        // @ts-expect-error override default for defined server settings
        settings[key] = serverSettings[key];
      }
    }
    return settings;
  }

  static async makeWorkspaceData(
    layoutStorage: LayoutStorage,
    options?: WorkspaceStorageLoadOptions
  ): Promise<CustomizableWorkspaceData> {
    const { filterSets, links, layoutConfig } =
      await UserLayoutUtils.getDefaultLayout(
        layoutStorage,
        options?.isConsoleAvailable
      );
    return {
      settings: {},
      layoutConfig,
      closed: [{}],
      links,
      filterSets,
    };
  }

  static async makeDefaultWorkspace(
    layoutStorage: LayoutStorage,
    options?: WorkspaceStorageLoadOptions
  ): Promise<CustomizableWorkspace> {
    return {
      data: await LocalWorkspaceStorage.makeWorkspaceData(
        layoutStorage,
        options
      ),
    };
  }

  private layoutStorage: LayoutStorage;

  constructor(layoutStorage: LayoutStorage) {
    this.layoutStorage = layoutStorage;
  }

  // eslint-disable-next-line class-methods-use-this
  async load(
    options?: WorkspaceStorageLoadOptions
  ): Promise<CustomizableWorkspace> {
    try {
      const workspace = JSON.parse(
        localStorage.getItem(LocalWorkspaceStorage.STORAGE_KEY) ?? ''
      );
      return workspace;
    } catch (e) {
      log.info('Unable to load workspace data, initializing to default data');

      return LocalWorkspaceStorage.makeDefaultWorkspace(
        this.layoutStorage,
        options
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
