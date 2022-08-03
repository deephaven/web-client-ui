import {
  ChartModel,
  ChartModelFactory,
  FigureChartModel,
} from '@deephaven/chart';
import dh, { IdeSession } from '@deephaven/jsapi-shim';
import { SortDirection } from '@deephaven/jsapi-utils';
import {
  InputFilter,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridUtils,
  AdvancedFilterOptions,
} from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import { ModelIndex } from '@deephaven/grid';

export type ChartPanelMetadata = {
  settings: Record<string, unknown>;
  tableSettings: {
    quickFilters?: [
      ModelIndex,
      {
        text: string;
      }
    ][];
    advancedFilters?: [
      ModelIndex,
      {
        options: AdvancedFilterOptions;
      }
    ][];
    inputFilters?: InputFilter[];
    sorts?: {
      column: ModelIndex;
      isAbs: boolean;
      direction: SortDirection;
    }[];
    partition?: unknown;
    partitionColumn?: string;
  };
  table?: string;
  figure?: string;
};

export type ChartPanelPanelState = Partial<ChartPanelMetadata>;

export type GridPanelMetadata = {
  table: string;
};

export const createChartModel = async (
  session: IdeSession,
  metadata: ChartPanelMetadata,
  panelState?: ChartPanelPanelState
): Promise<ChartModel | FigureChartModel> => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ChartModelFactory.makeModel(settings as any, figure);
  }

  const definition = { name: tableName, type: dh.VariableType.TABLE };
  const table = await session.getObject(definition);

  IrisGridUtils.applyTableSettings(
    table,
    tableSettings,
    getTimeZone(store.getState())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ChartModelFactory.makeModelFromSettings(settings as any, table);
};

export const createGridModel = async (
  session: IdeSession,
  metadata: GridPanelMetadata,
  type = dh.VariableType.TABLE
): Promise<IrisGridModel> => {
  const { table: tableName } = metadata;
  const definition = { name: tableName, type };
  const table = await session.getObject(definition);
  return IrisGridModelFactory.makeModel(table);
};

export default { createChartModel, createGridModel };
