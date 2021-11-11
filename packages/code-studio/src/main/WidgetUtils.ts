import { ChartModel, ChartModelFactory } from '@deephaven/chart';
import dh from '@deephaven/jsapi-shim';
import {
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import { DhSession } from './SessionUtils';

export type ChartPanelMetadata = {
  settings: Record<string, unknown>;
  tableSettings: Record<string, unknown>;
  table?: string;
  figure?: string;
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
  let {
    settings = {},
    table: tableName = '',
    figure: figureName = '',
    tableSettings = {},
  } = metadata;
  if (panelState) {
    if (panelState.tableSettings) {
      tableSettings = panelState.tableSettings;
    }
    if (panelState.table) {
      tableName = panelState.table;
    }
    if (panelState.figure) {
      figureName = panelState.figure;
    }
    if (panelState.settings) {
      settings = {
        ...settings,
        ...panelState.settings,
      };
    }
  }

  if (figureName) {
    const definition = { name: figureName, type: dh.VariableType.FIGURE };
    const figure = await session.getObject(definition);

    return ChartModelFactory.makeModel(settings, figure);
  }

  const definition = { name: tableName, type: dh.VariableType.TABLE };
  const table = await session.getObject(definition);

  IrisGridUtils.applyTableSettings(
    table,
    tableSettings,
    getTimeZone(store.getState())
  );

  return ChartModelFactory.makeModelFromSettings(settings, table);
};

export const createGridModel = async (
  session: DhSession,
  metadata: GridPanelMetadata
): Promise<IrisGridModel> => {
  const { table: tableName } = metadata;
  const definition = { name: tableName, type: dh.VariableType.TABLE };
  const table = await session.getObject(definition);
  return IrisGridModelFactory.makeModel(table, false);
};

export default { createChartModel, createGridModel };
