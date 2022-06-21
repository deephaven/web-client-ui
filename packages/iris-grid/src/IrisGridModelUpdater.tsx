/* eslint-disable react/require-default-props */
/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo } from 'react';
import dh, {
  Column,
  CustomColumn,
  FilterCondition,
  RollupConfig,
  Sort,
} from '@deephaven/jsapi-shim';
import { ModelIndex, MoveOperation } from '@deephaven/grid';
import { Formatter, ReverseType, TableUtils } from '@deephaven/jsapi-utils';
import IrisGridUtils from './IrisGridUtils';
import { ColumnName, UITotalsTableConfig, UIRow } from './CommonTypes';
import IrisGridModel from './IrisGridModel';

const COLUMN_BUFFER_PAGES = 1;

interface IrisGridModelUpdaterProps {
  model: IrisGridModel;
  modelColumns: Column[];
  top: number;
  bottom: number;
  left: number | null;
  right: number | null;
  filter: FilterCondition[];
  sorts: Sort[];
  reverseType?: ReverseType;
  customColumns: ColumnName[];
  movedColumns: MoveOperation[];
  hiddenColumns: ModelIndex[];
  frozenColumns?: ColumnName[];
  formatColumns: CustomColumn[];
  alwaysFetchColumns: ColumnName[];
  formatter: Formatter;
  rollupConfig?: RollupConfig | null;
  totalsConfig?: UITotalsTableConfig | null;
  selectDistinctColumns?: ColumnName[];
  pendingRowCount?: number;
  pendingDataMap?: Map<ModelIndex, UIRow>;
}

/**
 * React component to keep IrisGridModel in sync
 */
const IrisGridModelUpdater = React.memo(
  ({
    model,
    modelColumns,
    top,
    bottom,
    left,
    right,
    filter,
    formatter,
    reverseType = TableUtils.REVERSE_TYPE.NONE,
    sorts,
    customColumns,
    movedColumns,
    hiddenColumns,
    alwaysFetchColumns,
    rollupConfig = null,
    totalsConfig = null,
    selectDistinctColumns = [],
    pendingRowCount = 0,
    pendingDataMap = new Map(),
    frozenColumns,
    formatColumns,
  }: IrisGridModelUpdaterProps) => {
    const columns = useMemo(
      () =>
        IrisGridUtils.getModelViewportColumns(
          modelColumns,
          left,
          right,
          movedColumns,
          hiddenColumns,
          alwaysFetchColumns,
          COLUMN_BUFFER_PAGES
        ),
      [
        modelColumns,
        left,
        right,
        movedColumns,
        hiddenColumns,
        alwaysFetchColumns,
      ]
    );

    useEffect(
      function updateFilter() {
        model.filter = filter;
      },
      [model, filter]
    );
    useEffect(
      function updateSorts() {
        const sortsForModel = [...sorts];
        if (reverseType !== TableUtils.REVERSE_TYPE.NONE) {
          sortsForModel.push(dh.Table.reverse());
        }
        model.sort = sortsForModel;
      },
      [model, sorts, reverseType]
    );
    useEffect(
      function updateFormatter() {
        model.formatter = formatter;
      },
      [model, formatter]
    );
    useEffect(
      function updateCustomColumns() {
        if (model.isCustomColumnsAvailable) {
          model.customColumns = customColumns;
        }
      },
      [model, customColumns]
    );
    useEffect(
      function updateFormatColumns() {
        if (model.isFormatColumnsAvailable) {
          model.formatColumns = formatColumns;
        }
      },
      [model, formatColumns]
    );
    useEffect(
      function updateViewport() {
        model.setViewport(top, bottom, columns);
      },
      [model, top, bottom, columns]
    );
    useEffect(
      function updateRollupCOnfig() {
        if (model.isRollupAvailable) {
          model.rollupConfig = rollupConfig;
        }
      },
      [model, model.isRollupAvailable, rollupConfig]
    );
    useEffect(
      function updateSelectDistinctColumns() {
        if (model.isSelectDistinctAvailable) {
          model.selectDistinctColumns = selectDistinctColumns;
        }
      },
      [model, selectDistinctColumns]
    );
    useEffect(
      function updateTotalsConfig() {
        if (model.isTotalsAvailable) {
          model.totalsConfig = totalsConfig;
        }
      },
      [model, model.isTotalsAvailable, totalsConfig]
    );
    useEffect(
      function updatePendingRowCount() {
        model.pendingRowCount = pendingRowCount;
      },
      [model, pendingRowCount]
    );
    useEffect(
      function updatePendingDataMap() {
        model.pendingDataMap = pendingDataMap;
      },
      [model, pendingDataMap]
    );
    useEffect(
      function updateFrozenColumns() {
        if (frozenColumns) {
          model.updateFrozenColumns(frozenColumns);
        }
      },
      [model, frozenColumns]
    );

    return null;
  }
);

IrisGridModelUpdater.displayName = 'IrisGridModelUpdater';

export default IrisGridModelUpdater;
