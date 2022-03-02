/* eslint-disable react/require-default-props */
/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo } from 'react';
import dh, {
  Column,
  CustomColumn,
  FilterCondition,
  RollupConfig,
  Sort,
  TotalsTableConfig,
} from '@deephaven/jsapi-shim';
import Formatter from './Formatter';
import IrisGridModel from './IrisGridModel';
import IrisGridUtils from './IrisGridUtils';
import TableUtils, { ReverseType } from './TableUtils';

const COLUMN_BUFFER_PAGES = 1;

interface IrisGridModelUpdaterProps {
  model: IrisGridModel;
  modelColumns: Column[];
  top: number;
  bottom: number;
  left?: number;
  right?: number;
  filter: FilterCondition[];
  sorts: Sort[];
  reverseType?: ReverseType;
  customColumns: string[];
  movedColumns: unknown[];
  hiddenColumns: number[];
  frozenColumns?: string[];
  formatColumns: CustomColumn[];
  alwaysFetchColumns: string[];
  formatter: Formatter;
  rollupConfig?: RollupConfig | null;
  totalsConfig?: TotalsTableConfig | null;
  selectDistinctColumns?: string[];
  pendingRowCount?: number;
  pendingDataMap?: Map<number, Map<string, unknown>>;
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

    useEffect(() => {
      model.filter = filter;
    }, [model, filter]);
    useEffect(() => {
      const sortsForModel = [...sorts];
      if (reverseType !== TableUtils.REVERSE_TYPE.NONE) {
        sortsForModel.push(dh.Table.reverse());
      }
      model.sort = sortsForModel;
    }, [model, sorts, reverseType]);
    useEffect(() => {
      model.formatter = formatter;
    }, [model, formatter]);
    useEffect(() => {
      if (model.isCustomColumnsAvailable) {
        model.customColumns = customColumns;
      }
    }, [model, customColumns]);
    useEffect(() => {
      if (model.isFormatColumnsAvailable) {
        model.formatColumns = formatColumns;
      }
    }, [model, formatColumns]);
    useEffect(() => {
      model.setViewport(top, bottom, columns);
    }, [model, top, bottom, columns]);
    useEffect(() => {
      if (model.isRollupAvailable) {
        model.rollupConfig = rollupConfig;
      }
    }, [model, model.isRollupAvailable, rollupConfig]);
    useEffect(() => {
      if (model.isSelectDistinctAvailable) {
        model.selectDistinctColumns = selectDistinctColumns;
      }
    }, [model, selectDistinctColumns]);
    useEffect(() => {
      if (model.isTotalsAvailable) {
        model.totalsConfig = totalsConfig;
      }
    }, [model, model.isTotalsAvailable, totalsConfig]);
    useEffect(() => {
      model.pendingRowCount = pendingRowCount;
    }, [model, pendingRowCount]);
    useEffect(() => {
      model.pendingDataMap = pendingDataMap;
    }, [model, pendingDataMap]);
    useEffect(() => {
      if (frozenColumns) {
        model.updateFrozenColumns(frozenColumns);
      }
    }, [model, frozenColumns]);

    return null;
  }
);

IrisGridModelUpdater.displayName = 'IrisGridModelUpdater';

export default IrisGridModelUpdater;
