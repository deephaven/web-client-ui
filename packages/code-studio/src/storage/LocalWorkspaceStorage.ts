import Log from '@deephaven/log';
import {
  DateTimeColumnFormatter,
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
import { WorkspaceStorage, Workspace, WorkspaceData } from '@deephaven/redux';
import { createClient } from 'webdav/web';
import UserLayoutUtils from '../main/UserLayoutUtils';
import WebdavLayoutStorage from './WebdavLayoutStorage';

const log = Log.module('LocalWorkspaceStorage');

export const LAYOUT_STORAGE = new WebdavLayoutStorage(
  createClient(import.meta.env.VITE_LAYOUTS_URL ?? '')
);

/**
 * Implementation of WorkspaceStorage that just stores the workspace data in localStorage
 */
export class LocalWorkspaceStorage implements WorkspaceStorage {
  static readonly STORAGE_KEY = 'deephaven.WorkspaceStorage';

  static async makeDefaultWorkspaceData(): Promise<WorkspaceData> {
    const {
      filterSets,
      links,
      layoutConfig,
    } = await UserLayoutUtils.getDefaultLayout(LAYOUT_STORAGE);

    return {
      settings: {
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
      },
      layoutConfig,
      closed: [{}],
      links,
      filterSets,
    };
  }

  static async makeDefaultWorkspace(): Promise<Workspace> {
    return { data: await LocalWorkspaceStorage.makeDefaultWorkspaceData() };
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
