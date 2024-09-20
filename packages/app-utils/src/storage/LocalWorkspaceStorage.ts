import Log from '@deephaven/log';
import {
  type WorkspaceStorage,
  type WorkspaceStorageLoadOptions,
  type CustomizableWorkspaceData,
  type CustomizableWorkspace,
  type WorkspaceSettings,
  type ServerConfigValues,
} from '@deephaven/redux';
import {
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
import merge from 'lodash.merge';
import UserLayoutUtils from './UserLayoutUtils';
import type LayoutStorage from './LayoutStorage';

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

  static getJSONServerConfig(
    serverConfigValues: Map<string, string> | undefined,
    key: string
  ): Record<string, unknown> | undefined {
    const value = serverConfigValues?.get(key);

    if (value == null) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch (e) {
      log.error(
        `Unable to parse JSON server config for key ${key}. Value: ${value}`
      );
      return undefined;
    }
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
      showEmptyStrings: true,
      showNullStrings: true,
      showExtraGroupColumn: true,
      notebookSettings: {
        isMinimapEnabled: false,
        formatOnSave: false,
        python: {
          linter: {
            isEnabled: true,
            // Omit default config so default settings are used if the user never changes them
          },
        },
      },
      webgl: true,
      webglEditable: true,
      gridDensity: 'regular',
    } satisfies WorkspaceSettings;
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
      showEmptyStrings: LocalWorkspaceStorage.getBooleanServerConfig(
        serverConfigValues,
        'showEmptyStrings'
      ),
      showNullStrings: LocalWorkspaceStorage.getBooleanServerConfig(
        serverConfigValues,
        'showNullStrings'
      ),
      showExtraGroupColumn: LocalWorkspaceStorage.getBooleanServerConfig(
        serverConfigValues,
        'showExtraGroupColumn'
      ),
      notebookSettings: {
        isMinimapEnabled: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'web.user.notebookSettings.isMinimapEnabled'
        ),
        formatOnSave: LocalWorkspaceStorage.getBooleanServerConfig(
          serverConfigValues,
          'web.user.notebookSettings.formatOnSave'
        ),
        python: {
          linter: {
            isEnabled: LocalWorkspaceStorage.getBooleanServerConfig(
              serverConfigValues,
              'web.user.notebookSettings.python.linter.isEnabled'
            ),
            config: LocalWorkspaceStorage.getJSONServerConfig(
              serverConfigValues,
              'web.user.notebookSettings.python.linter.config'
            ),
          },
        },
      },
      webgl: LocalWorkspaceStorage.getBooleanServerConfig(
        serverConfigValues,
        'web.webgl'
      ),
      webglEditable: LocalWorkspaceStorage.getBooleanServerConfig(
        serverConfigValues,
        'web.webgl.editable'
      ),
    } satisfies Partial<WorkspaceSettings>;

    return merge({}, settings, serverSettings);
  }

  static async makeWorkspaceData(
    layoutStorage: LayoutStorage,
    options?: WorkspaceStorageLoadOptions
  ): Promise<CustomizableWorkspaceData> {
    const {
      filterSets,
      links,
      layoutConfig,
      pluginDataMap = {},
    } = await UserLayoutUtils.getDefaultLayout(
      layoutStorage,
      options?.isConsoleAvailable
    );
    return {
      settings: {},
      layoutConfig,
      closed: [{}],
      links,
      filterSets,
      pluginDataMap,
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
