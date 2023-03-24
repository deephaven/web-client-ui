import { ChartModel, ChartModelFactory } from '@deephaven/chart';
import dh, {
  Table,
  VariableTypeUnion,
  IdeConnection,
} from '@deephaven/jsapi-shim';
import {
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import {
  ChartPanelMetadata,
  GLChartPanelState,
  isChartPanelTableMetadata,
} from '@deephaven/dashboard-core-plugins';
import { TableUtils } from '@deephaven/jsapi-utils';

export type GridPanelMetadata = {
  table: string;
};

export const createChartModel = async (
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
    figureName = metadata.figure;
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

    return ChartModelFactory.makeModel(settings, figure);
  }

  const definition = {
    title: figureName,
    name: tableName,
    type: dh.VariableType.TABLE,
  };
  const table = await connection.getObject(definition);
  const tableUtils = new TableUtils(dh);
  IrisGridUtils.applyTableSettings(
    table,
    tableSettings,
    tableUtils,
    getTimeZone(store.getState())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ChartModelFactory.makeModelFromSettings(settings as any, table);
};

export const createGridModel = async (
  connection: IdeConnection,
  metadata: GridPanelMetadata,
  type: VariableTypeUnion = dh.VariableType.TABLE
): Promise<IrisGridModel> => {
  const { table: tableName } = metadata;
  const definition = { title: tableName, name: tableName, type };
  const table = (await connection.getObject(definition)) as Table;
  const tableUtils = new TableUtils(dh);
  return IrisGridModelFactory.makeModel(table, tableUtils);
};

export default { createChartModel, createGridModel };
