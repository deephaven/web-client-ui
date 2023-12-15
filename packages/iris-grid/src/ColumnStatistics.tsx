import React, { Component, Key } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, CopyButton, LoadingSpinner } from '@deephaven/components';
import { dhFreeze, dhRefresh, dhSortSlash, vsLock } from '@deephaven/icons';
import type { ColumnStatistics as APIColumnStatistics } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';
import { isExpandableGridModel } from '@deephaven/grid';
import './ColumnStatistics.scss';
import IrisGridModel, { DisplayColumn } from './IrisGridModel';

const log = Log.module('ColumnStatistics');
const STATS_LABEL_OVERRIDES: Record<string, string> = {
  SIZE: 'Number of Rows',
};

interface Statistic {
  operation: Key;
  className?: string;
  value: unknown;
  type: string;
}

interface ColumnStatisticsProps {
  column: DisplayColumn;
  model: IrisGridModel;
  onStatistics: () => void;
}
interface ColumnStatisticsState {
  error: unknown;
  loading: boolean;
  statistics: readonly Statistic[] | null;
  numRows: number;
}

class ColumnStatistics extends Component<
  ColumnStatisticsProps,
  ColumnStatisticsState
> {
  /** Automatically generate the statistics when the row count is below this threshold */
  static AUTO_GENERATE_LIMIT = 100000;

  static getStatsLabel(operation: string): string {
    return (
      STATS_LABEL_OVERRIDES[operation] ??
      operation
        .split(' ')
        .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
        .join(' ')
    );
  }

  constructor(props: ColumnStatisticsProps) {
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

  componentDidMount(): void {
    this.maybeGenerateStatistics();
  }

  componentWillUnmount(): void {
    if (this.cancelablePromise) {
      this.cancelablePromise.cancel();
    }
  }

  cancelablePromise: CancelablePromise<APIColumnStatistics> | null;

  maybeGenerateStatistics(): void {
    const { column, model } = this.props;

    const numRows =
      model.rowCount -
      model.pendingRowCount -
      model.floatingBottomRowCount -
      model.floatingTopRowCount;
    this.setState({ numRows });
    if (!model.isColumnStatisticsAvailable || column.isProxy === true) {
      this.setState({ loading: false });
    } else if (numRows < ColumnStatistics.AUTO_GENERATE_LIMIT) {
      this.handleGenerateStatistics();
    }
  }

  handleGenerateStatistics(): void {
    this.setState({ loading: true });

    const { column, model } = this.props;

    this.cancelablePromise = PromiseUtils.makeCancelable(
      model.columnStatistics(column)
    );

    this.cancelablePromise.then(this.handleStatistics).catch(this.handleError);
  }

  handleStatistics(stats: APIColumnStatistics): void {
    log.debug('Received statistics', stats);

    const { model, onStatistics } = this.props;
    const statistics: Statistic[] = [];

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
      numRows:
        model.rowCount -
        model.pendingRowCount -
        model.floatingBottomRowCount -
        model.floatingTopRowCount,
    });

    onStatistics();
  }

  handleError(error: Error): void {
    if (error != null && PromiseUtils.isCanceled(error)) {
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

  render(): React.ReactElement {
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
    const rowCountLabel =
      isExpandableGridModel(model) && model.hasExpandableRows
        ? 'Expanded Rows'
        : 'Number of Rows';
    const formattedRowCount = model.displayString(numRows, 'long');
    const columnIndex = model.getColumnIndexByName(column.name);
    return (
      <div className="column-statistics">
        <div className="column-statistics-title">
          {column.displayName ?? column.name}
          <span className="column-statistics-type">&nbsp;({columnType})</span>
          <CopyButton
            className="column-statistics-copy"
            tooltip="Copy column name"
            copy={column.name}
          />
        </div>
        {description != null && (
          <div className="column-statistics-description">{description}</div>
        )}
        {columnIndex != null && !model.isColumnSortable(columnIndex) && (
          <div className="column-statistics-status">
            <FontAwesomeIcon icon={dhSortSlash} className="mr-1" />
            Not sortable
          </div>
        )}
        {columnIndex != null && !model.isColumnMovable(columnIndex) && (
          <div className="column-statistics-status">
            <FontAwesomeIcon
              icon={model.isColumnFrozen(columnIndex) ? dhFreeze : vsLock}
              className="mr-1"
            />
            {model.isColumnFrozen(columnIndex) ? 'Frozen' : 'Not movable'}
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
          <Button
            kind="ghost"
            className="px-0"
            onClick={this.handleGenerateStatistics}
          >
            Generate Stats
          </Button>
        )}
        {error != null && <div className="error-message">{`${error}`}</div>}
        {statistics && !loading && (
          <Button
            kind="ghost"
            className="px-0"
            onClick={this.handleGenerateStatistics}
            icon={<FontAwesomeIcon icon={dhRefresh} className="mr-1" />}
          >
            Refresh
          </Button>
        )}
        {loading && (
          <div className="column-statistics-loading">
            <LoadingSpinner className="loading-spinner-vertical-align" />
            Calculating Stats...
          </div>
        )}
      </div>
    );
  }
}

export default ColumnStatistics;
