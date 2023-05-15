/* eslint-disable react/require-default-props */
/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo } from 'react';
import type {
  Column,
  CustomColumn,
  FilterCondition,
  RollupConfig,
  Sort,
} from '@deephaven/jsapi-types';
import { ModelIndex, MoveOperation } from '@deephaven/grid';
import { Formatter, ReverseType, TableUtils } from '@deephaven/jsapi-utils';
import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import IrisGridUtils from './IrisGridUtils';
import { ColumnName, UITotalsTableConfig, PendingDataMap } from './CommonTypes';
import IrisGridModel from './IrisGridModel';
import type ColumnHeaderGroup from './ColumnHeaderGroup';

const COLUMN_BUFFER_PAGES = 1;

interface IrisGridModelUpdaterProps {
  model: IrisGridModel;
  modelColumns: readonly Column[];
  top: number;
  bottom: number;
  left: number | null;
  right: number | null;
  filter: readonly FilterCondition[];
  sorts: readonly Sort[];
  reverseType?: ReverseType;
  customColumns: readonly ColumnName[];
  movedColumns: readonly MoveOperation[];
  hiddenColumns: readonly ModelIndex[];
  frozenColumns?: readonly ColumnName[];
  columnHeaderGroups: readonly ColumnHeaderGroup[];
  formatColumns: readonly CustomColumn[];
  alwaysFetchColumns: readonly ColumnName[];
  formatter: Formatter;
  rollupConfig?: RollupConfig | null;
  totalsConfig?: UITotalsTableConfig | null;
  selectDistinctColumns?: readonly ColumnName[];
  pendingRowCount?: number;
  pendingDataMap?: PendingDataMap;
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
    selectDistinctColumns = EMPTY_ARRAY,
    pendingRowCount = 0,
    pendingDataMap = EMPTY_MAP,
    frozenColumns,
    formatColumns,
    columnHeaderGroups,
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
          sortsForModel.push(model.dh.Table.reverse());
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
    useEffect(
      function updateColumnHeaderGroups() {
        model.columnHeaderGroups = columnHeaderGroups;
      },
      [model, columnHeaderGroups]
    );

    return null;
  }
);

IrisGridModelUpdater.displayName = 'IrisGridModelUpdater';

export default IrisGridModelUpdater;
