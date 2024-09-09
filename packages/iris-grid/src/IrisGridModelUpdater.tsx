/* eslint-disable react/require-default-props */
/* eslint-disable no-param-reassign */
import { useMemo } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { ModelIndex, MoveOperation } from '@deephaven/grid';
import { Formatter, ReverseType, TableUtils } from '@deephaven/jsapi-utils';
import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import { useOnChange } from '@deephaven/react-hooks';
import IrisGridUtils from './IrisGridUtils';
import { ColumnName, UITotalsTableConfig, PendingDataMap } from './CommonTypes';
import IrisGridModel from './IrisGridModel';
import type ColumnHeaderGroup from './ColumnHeaderGroup';
import {
  PartitionConfig,
  isPartitionedGridModel,
} from './PartitionedGridModel';
import { isIrisGridTreeTableModel } from './IrisGridTreeTableModel';

const COLUMN_BUFFER_PAGES = 1;

interface IrisGridModelUpdaterProps {
  model: IrisGridModel;
  top: number;
  bottom: number;
  left: number | null;
  right: number | null;
  filter: readonly dh.FilterCondition[];
  sorts: readonly dh.Sort[];
  reverseType?: ReverseType;
  customColumns: readonly ColumnName[];
  movedColumns: readonly MoveOperation[];
  hiddenColumns: readonly ModelIndex[];
  frozenColumns?: readonly ColumnName[];
  columnHeaderGroups: readonly ColumnHeaderGroup[];
  formatColumns: readonly dh.CustomColumn[];
  alwaysFetchColumns: readonly ColumnName[];
  formatter: Formatter;
  rollupConfig?: dh.RollupConfig | null;
  totalsConfig?: UITotalsTableConfig | null;
  selectDistinctColumns?: readonly ColumnName[];
  pendingRowCount?: number;
  pendingDataMap?: PendingDataMap;
  partitionConfig?: PartitionConfig;
  showExtraGroupColumn?: boolean;
}

/**
 * React component to keep IrisGridModel in sync
 */
function IrisGridModelUpdater({
  model,
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
  partitionConfig,
  showExtraGroupColumn,
}: IrisGridModelUpdaterProps): JSX.Element | null {
  const { isTotalsAvailable, isRollupAvailable } = model;
  // Check for showExtraGroupColumn before memoizing columns, since updating it will change the columns
  useOnChange(() => {
    if (isIrisGridTreeTableModel(model) && showExtraGroupColumn != null) {
      model.showExtraGroupColumn = showExtraGroupColumn;
    }
  }, [model, showExtraGroupColumn]);

  const columns = useMemo(
    () =>
      IrisGridUtils.getModelViewportColumns(
        model.columns,
        left,
        right,
        movedColumns,
        hiddenColumns,
        alwaysFetchColumns,
        COLUMN_BUFFER_PAGES
      ),
    [
      model.columns,
      left,
      right,
      movedColumns,
      hiddenColumns,
      alwaysFetchColumns,
    ]
  );
  useOnChange(
    function updateFilter() {
      model.filter = filter;
    },
    [model, filter]
  );
  useOnChange(
    function updateSorts() {
      const sortsForModel = [...sorts];
      if (reverseType !== TableUtils.REVERSE_TYPE.NONE) {
        sortsForModel.push(model.dh.Table.reverse());
      }
      model.sort = sortsForModel;
    },
    [model, sorts, reverseType]
  );
  useOnChange(
    function updateFormatter() {
      model.formatter = formatter;
    },
    [model, formatter]
  );
  useOnChange(
    function updateCustomColumns() {
      if (model.isCustomColumnsAvailable) {
        model.customColumns = customColumns;
      }
    },
    [model, customColumns]
  );
  useOnChange(
    function updateFormatColumns() {
      if (model.isFormatColumnsAvailable) {
        model.formatColumns = formatColumns;
      }
    },
    [model, formatColumns]
  );
  useOnChange(
    function updateViewport() {
      model.setViewport(top, bottom, columns);
    },
    [model, top, bottom, columns]
  );
  useOnChange(
    function updateRollupCOnfig() {
      if (isRollupAvailable) {
        model.rollupConfig = rollupConfig;
      }
    },
    [model, isRollupAvailable, rollupConfig]
  );
  useOnChange(
    function updateSelectDistinctColumns() {
      if (model.isSelectDistinctAvailable) {
        model.selectDistinctColumns = selectDistinctColumns;
      }
    },
    [model, selectDistinctColumns]
  );
  useOnChange(
    function updateTotalsConfig() {
      if (isTotalsAvailable) {
        model.totalsConfig = totalsConfig;
      }
    },
    [model, isTotalsAvailable, totalsConfig]
  );
  useOnChange(
    function updatePendingRowCount() {
      model.pendingRowCount = pendingRowCount;
    },
    [model, pendingRowCount]
  );
  useOnChange(
    function updatePendingDataMap() {
      model.pendingDataMap = pendingDataMap;
    },
    [model, pendingDataMap]
  );
  useOnChange(
    function updateFrozenColumns() {
      if (frozenColumns) {
        model.updateFrozenColumns(frozenColumns);
      }
    },
    [model, frozenColumns]
  );
  useOnChange(
    function updateColumnHeaderGroups() {
      model.columnHeaderGroups = columnHeaderGroups;
    },
    [model, columnHeaderGroups]
  );
  useOnChange(
    function updatePartitionConfig() {
      if (partitionConfig && isPartitionedGridModel(model)) {
        model.partitionConfig = partitionConfig;
      }
    },
    [model, partitionConfig]
  );

  return null;
}

IrisGridModelUpdater.displayName = 'IrisGridModelUpdater';

export default IrisGridModelUpdater;
