/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Formatter from './Formatter';
import IrisGridModel from './IrisGridModel';
import IrisGridUtils from './IrisGridUtils';
import TableUtils from './TableUtils';

const COLUMN_BUFFER_PAGES = 1;

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
    reverseType,
    sorts,
    customColumns,
    movedColumns,
    hiddenColumns,
    alwaysFetchColumns,
    formatColumns,
    rollupConfig,
    totalsConfig,
    selectDistinctColumns,
    pendingRowCount,
    pendingDataMap,
    frozenColumns,
  }) => {
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
      if (model.isConditionalFormatsAvailable) {
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
      model.updateFrozenColumns(frozenColumns);
    }, [model, frozenColumns]);

    return null;
  }
);

IrisGridModelUpdater.displayName = 'IrisGridModelUpdater';

IrisGridModelUpdater.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  modelColumns: PropTypes.arrayOf(APIPropTypes.Column).isRequired,
  top: PropTypes.number.isRequired,
  bottom: PropTypes.number.isRequired,
  left: PropTypes.number,
  right: PropTypes.number,
  filter: PropTypes.arrayOf(APIPropTypes.FilterCondition).isRequired,
  sorts: PropTypes.arrayOf(APIPropTypes.Sort).isRequired,
  reverseType: PropTypes.oneOf(Object.values(TableUtils.REVERSE_TYPE)),
  customColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  movedColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  hiddenColumns: PropTypes.arrayOf(PropTypes.number).isRequired,
  frozenColumns: PropTypes.arrayOf(PropTypes.string),
  alwaysFetchColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  formatColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  formatter: PropTypes.instanceOf(Formatter).isRequired,
  rollupConfig: APIPropTypes.RollupConfig,
  totalsConfig: PropTypes.shape({}),
  selectDistinctColumns: PropTypes.arrayOf(PropTypes.string),
  pendingRowCount: PropTypes.number,
  pendingDataMap: PropTypes.instanceOf(Map),
};

IrisGridModelUpdater.defaultProps = {
  left: null,
  right: null,
  reverseType: TableUtils.REVERSE_TYPE.NONE,
  rollupConfig: null,
  totalsConfig: null,
  selectDistinctColumns: [],
  pendingRowCount: 0,
  pendingDataMap: new Map(),
  frozenColumns: null,
};

export default IrisGridModelUpdater;
