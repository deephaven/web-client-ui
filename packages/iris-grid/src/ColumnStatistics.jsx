import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingSpinner } from '@deephaven/components';
import { dhRefresh, vsLock } from '@deephaven/icons';
import { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { PromiseUtils } from '@deephaven/utils';
import IrisGridModel from './IrisGridModel';
import './ColumnStatistics.scss';

const log = Log.module('ColumnStatistics');
const STATS_LABEL_OVERRIDES = {
  SIZE: 'Number of Rows',
};

class ColumnStatistics extends Component {
  /** Automatically generate the statistics when the row count is below this threshold */
  static AUTO_GENERATE_LIMIT = 100000;

  static getStatsLabel(operation) {
    return (
      STATS_LABEL_OVERRIDES[operation] ??
      operation
        .split(' ')
        .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
        .join(' ')
    );
  }

  constructor(props) {
    super(props);

    this.handleError = this.handleError.bind(this);
    this.handleGenerateStatistics = this.handleGenerateStatistics.bind(this);
    this.handleStatistics = this.handleStatistics.bind(this);

    this.cancelablePromise = null;

    this.state = {
      error: null,
      loading: false,
      statistics: null,
      numRows: 0,
    };
  }

  componentDidMount() {
    this.maybeGenerateStatistics();
  }

  componentWillUnmount() {
    if (this.cancelablePromise) {
      this.cancelablePromise.cancel();
    }
  }

  maybeGenerateStatistics() {
    const { model } = this.props;

    const numRows = model.rowCount;
    this.setState({ numRows });
    if (!model.isColumnStatisticsAvailable) {
      this.setState({ loading: false });
    } else if (numRows < ColumnStatistics.AUTO_GENERATE_LIMIT) {
      this.handleGenerateStatistics();
    }
  }

  handleGenerateStatistics() {
    this.setState({ loading: true });

    const { column, model } = this.props;

    this.cancelablePromise = PromiseUtils.makeCancelable(
      model.columnStatistics(column)
    );

    this.cancelablePromise.then(this.handleStatistics).catch(this.handleError);
  }

  handleStatistics(stats) {
    log.debug('Received statistics', stats);

    const { model, onStatistics } = this.props;
    const statistics = [];

    stats.statisticsMap.forEach((value, operation) => {
      statistics.push({
        operation: ColumnStatistics.getStatsLabel(operation),
        value,
        type: stats.getType(operation),
      });
    });

    stats.uniqueValues.forEach((value, operation) => {
      statistics.push({
        operation,
        className: 'column-statistics-unique-value',
        value,
        type: 'long',
      });
    });

    this.setState({
      loading: false,
      statistics,
      numRows: model.rowCount,
    });

    onStatistics();
  }

  handleError(error) {
    if (error && error.isCanceled) {
      log.debug('Called handleError on a cancelled promise result');
      return;
    }

    log.error('Error generating statistics', error);
    this.setState({
      error,
      loading: false,
      statistics: null,
    });
  }

  render() {
    const { column, model } = this.props;
    const { error, loading, statistics, numRows } = this.state;
    const showGenerateStatistics =
      !loading &&
      error == null &&
      statistics == null &&
      model.isColumnStatisticsAvailable;
    const statisticElements = [];
    const columnType = column.type.substring(column.type.lastIndexOf('.') + 1);
    const description = column.description === null ? null : column.description;
    if (statistics != null) {
      for (let i = 0; i < statistics.length; i += 1) {
        const { operation, className, value, type } = statistics[i];
        const formattedValue = !type
          ? model.displayString(value, column.type, column.name)
          : model.displayString(value, type);
        const statisticElement = (
          <React.Fragment key={operation}>
            <div
              className={classNames('column-statistic-operation', className)}
            >
              {operation}
            </div>
            <div className="column-statistic-value">{formattedValue}</div>
          </React.Fragment>
        );
        statisticElements.push(statisticElement);
      }
    }
    const rowCountLabel = model.hasExpandableRows
      ? 'Expanded Rows'
      : 'Number of Rows';
    const formattedRowCount = model.displayString(numRows, 'long');
    return (
      <div className="column-statistics">
        <div className="column-statistics-title">
          {column.name}&nbsp;
          <span className="column-statistics-type">({columnType})</span>
        </div>
        {description && (
          <div className="column-statistics-description">{description}</div>
        )}
        {!model.isColumnMovable(column.name) && (
          <div className="column-statistics-status">
            <FontAwesomeIcon icon={vsLock} className="mr-1" />
            Not movable
          </div>
        )}
        <div className="column-statistics-grid">
          {statistics == null && (
            <>
              <div className="column-statistic-operation">{rowCountLabel}</div>
              <div className="column-statistic-value">{formattedRowCount}</div>
            </>
          )}

          {statisticElements}
        </div>
        {showGenerateStatistics && (
          <button
            type="button"
            className="btn btn-link"
            onClick={this.handleGenerateStatistics}
          >
            Generate Stats
          </button>
        )}
        {error && <div className="error-message">{`${error}`}</div>}
        {statistics && !loading && (
          <button
            type="button"
            className="btn btn-link px-0"
            onClick={this.handleGenerateStatistics}
          >
            <FontAwesomeIcon icon={dhRefresh} className="mr-1" />
            Refresh
          </button>
        )}
        {loading && (
          <div className="column-statistics-loading">
            <LoadingSpinner className="mr-2" />
            Calculating Stats...
          </div>
        )}
      </div>
    );
  }
}

ColumnStatistics.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  column: APIPropTypes.Column.isRequired,
  onStatistics: PropTypes.func.isRequired,
};

export default ColumnStatistics;
