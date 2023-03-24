import { ChartModel, ChartModelFactory } from '@deephaven/chart';
import type {
  dh as DhType,
  Table,
  IdeConnection,
} from '@deephaven/jsapi-types';
import {
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import {
  ChartPanelMetadata,
  GLChartPanelState,
  IrisGridPanelMetadata,
  isChartPanelTableMetadata,
} from '@deephaven/dashboard-core-plugins';

export const createChartModel = async (
  dh: DhType,
  connection: IdeConnection,
  metadata: ChartPanelMetadata,
  panelState?: GLChartPanelState
): Promise<ChartModel> => {
  let settings;
  let tableName;
  let figureName;
  let tableSettings;

  if (isChartPanelTableMetadata(metadata)) {
    settings = metadata.settings;
    tableName = metadata.table;
    figureName = undefined;
    tableSettings = metadata.tableSettings;
  } else {
    settings = {};
    tableName = '';
    figureName = metadata.name ?? metadata.figure;
    tableSettings = {};
  }
  if (panelState !== undefined) {
    if (panelState.tableSettings != null) {
      tableSettings = panelState.tableSettings;
    }
    if (panelState.table != null) {
      tableName = panelState.table;
    }
    if (panelState.figure != null) {
      figureName = panelState.figure;
    }
    if (panelState.settings != null) {
      settings = {
        ...settings,
        ...panelState.settings,
      };
    }
  }

  if (figureName !== undefined) {
    const definition = {
      title: figureName,
      name: figureName,
      type: dh.VariableType.FIGURE,
    };
    const figure = await connection.getObject(definition);

    return ChartModelFactory.makeModel(dh, settings, figure);
  }

  const definition = {
    title: figureName,
    name: tableName,
    type: dh.VariableType.TABLE,
  };
  const table = await connection.getObject(definition);
  new IrisGridUtils(dh).applyTableSettings(
    table,
    tableSettings,
    getTimeZone(store.getState())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ChartModelFactory.makeModelFromSettings(dh, settings as any, table);
};

export const createGridModel = async (
  dh: DhType,
  connection: IdeConnection,
  metadata: IrisGridPanelMetadata
): Promise<IrisGridModel> => {
  const { name: tableName } = metadata;
  const definition = {
    title: tableName,
    name: tableName,
    type: metadata.type,
  };
  const table = (await connection.getObject(definition)) as Table;
  return IrisGridModelFactory.makeModel(dh, table);
};

export default { createChartModel, createGridModel };
