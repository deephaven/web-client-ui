import { ChartModel, ChartModelFactory } from '@deephaven/chart';
import {
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { DhSession } from './SessionUtils';

export type ChartPanelMetadata = {
  settings: Record<string, unknown>;
  tableSettings: Record<string, unknown>;
  table: string;
};

export type ChartPanelPanelState = Partial<ChartPanelMetadata>;

export type GridPanelMetadata = {
  table: string;
};

export const createChartModel = async (
  session: DhSession,
  metadata: ChartPanelMetadata,
  panelState?: ChartPanelPanelState
): Promise<ChartModel> => {
  let { settings = {}, table: tableName, tableSettings = {} } = metadata;
  if (panelState) {
    if (panelState.tableSettings) {
      tableSettings = panelState.tableSettings;
    }
    if (panelState.table) {
      tableName = panelState.table;
    }
    if (panelState.settings) {
      settings = {
        ...settings,
        ...panelState.settings,
      };
    }
  }

  const table = await session.getTable(tableName);

  IrisGridUtils.applyTableSettings(table, tableSettings);

  return ChartModelFactory.makeModelFromSettings(settings, table);
};

export const createGridModel = async (
  session: DhSession,
  metadata: GridPanelMetadata
): Promise<IrisGridModel> => {
  const { table: tableName } = metadata;
  const table = await session.getTable(tableName);
  return IrisGridModelFactory.makeModel(table, false);
};

export default { createChartModel, createGridModel };
