import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RadioGroup, RadioItem } from '@deephaven/components';
import {
  vsLink,
  dhUnlink,
  dhTable,
  dhNewCircleLargeFilled,
  vsCircleLargeFilled,
  vsTrash,
} from '@deephaven/icons';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import shortid from 'shortid';
import {
  BarIcon,
  HistogramIcon,
  LineIcon,
  PieIcon,
  ScatterIcon,
} from './icons';
import './ChartBuilder.scss';
import IrisGridModel from '../IrisGridModel';

const log = Log.module('ChartBuilder');

/**
 * Form for configuring all the settings when creating a console.
 */
class ChartBuilder extends PureComponent {
  static types = [
    dh.plot.SeriesPlotStyle.LINE,
    dh.plot.SeriesPlotStyle.BAR,
    dh.plot.SeriesPlotStyle.SCATTER,
    dh.plot.SeriesPlotStyle.PIE,
    // IDS-6808: Disable Histogram in Chart Builder until we pipe histogram creation through the API
    // dh.plot.SeriesPlotStyle.HISTOGRAM,
  ];

  /**
   * Converts the provided chart type into a readable type.
   * Just replaces underscores with spaces and capitals the first letter of each word.
   */
  static getTypeName(type) {
    switch (type) {
      case dh.plot.SeriesPlotStyle.LINE:
        return 'Line';
      case dh.plot.SeriesPlotStyle.BAR:
        return 'Bar';
      case dh.plot.SeriesPlotStyle.SCATTER:
        return 'Scatter';
      case dh.plot.SeriesPlotStyle.PIE:
        return 'Pie';
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 'Histogram';
      default:
        return type;
    }
  }

  static getTypeIcon(type) {
    switch (type) {
      case dh.plot.SeriesPlotStyle.LINE:
        return <LineIcon />;
      case dh.plot.SeriesPlotStyle.BAR:
        return <BarIcon />;
      case dh.plot.SeriesPlotStyle.SCATTER:
        return <ScatterIcon />;
      case dh.plot.SeriesPlotStyle.PIE:
        return <PieIcon />;
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return <HistogramIcon />;
      default:
        return null;
    }
  }

  static getMaxSeriesCount(type) {
    switch (type) {
      case dh.plot.SeriesPlotStyle.PIE:
        return 1;
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 0;
      default:
        return 100;
    }
  }

  static getXAxisLabel(type) {
    switch (type) {
      case dh.plot.SeriesPlotStyle.PIE:
        return 'Labels';
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 'Data';
      default:
        return 'X-Axis';
    }
  }

  static getSeriesLabel(type) {
    switch (type) {
      case dh.plot.SeriesPlotStyle.PIE:
        return 'Values';
      default:
        return 'Series';
    }
  }

  static makeSeriesItem(value) {
    return { id: shortid.generate(), value };
  }

  static makeDefaultSeriesItems(type, columns) {
    const maxSeriesCount = ChartBuilder.getMaxSeriesCount(type);
    if (maxSeriesCount === 0 || columns == null || columns.length === 0) {
      return [];
    }

    const value = columns.length > 1 ? columns[1].name : columns[0].name;
    return [ChartBuilder.makeSeriesItem(value)];
  }

  static getDefaultXAxis(type, columns) {
    if (columns != null && columns.length > 0) {
      return columns[0].name;
    }

    return null;
  }

  constructor(props) {
    super(props);

    this.handleAddSeries = this.handleAddSeries.bind(this);
    this.handleLinkStateChange = this.handleLinkStateChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSeriesChange = this.handleSeriesChange.bind(this);
    this.handleSeriesDeleteClick = this.handleSeriesDeleteClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTypeClick = this.handleTypeClick.bind(this);
    this.handleXAxisChange = this.handleXAxisChange.bind(this);

    const { model } = props;
    const { columns } = model;

    const type = ChartBuilder.types[0];
    const xAxis = ChartBuilder.getDefaultXAxis(type, columns);
    const seriesItems = ChartBuilder.makeDefaultSeriesItems(type, columns);

    this.state = {
      /** The selected chart type */
      type,

      /** Array of column names of the series to display */
      seriesItems,

      /** The column name to use as the x-axis */
      xAxis,

      /** Whether the newly created chart should be linked with the table (update when filters update) */
      isLinked: true,
    };
  }

  handleAddSeries() {
    this.setState(
      state => {
        let { seriesItems } = state;
        seriesItems = [].concat(seriesItems);

        const { model } = this.props;
        const { columns } = model;
        seriesItems.push({
          id: shortid.generate(),
          value: columns[0].name,
        });

        return { seriesItems };
      },
      () => {
        this.sendChange();
      }
    );
  }

  handleLinkStateChange(event) {
    this.setState({ isLinked: event.target.value === 'true' }, () => {
      this.sendChange();
    });
  }

  handleReset() {
    const { model } = this.props;
    const { columns } = model;

    const type = ChartBuilder.types[0];
    const xAxis = ChartBuilder.getDefaultXAxis(type, columns);
    const seriesItems = ChartBuilder.makeDefaultSeriesItems(type, columns);
    const isLinked = true;

    this.setState({ type, seriesItems, xAxis, isLinked }, () => {
      this.sendChange();
    });
  }

  handleSeriesChange(event) {
    const { value } = event.target;
    const index = event.target.getAttribute('data-index');

    this.setState(
      state => {
        let { seriesItems } = state;

        seriesItems = [].concat(seriesItems);
        seriesItems[index].value = value;

        return { seriesItems };
      },
      () => {
        this.sendChange();
      }
    );
  }

  handleSeriesDeleteClick(event) {
    const index = event.target.getAttribute('data-index');

    this.setState(
      state => {
        let { seriesItems } = state;

        seriesItems = [].concat(seriesItems);
        seriesItems.splice(index, 1);

        return { seriesItems };
      },
      () => {
        this.sendChange();
      }
    );
  }

  handleSubmit(event) {
    event.preventDefault();

    const { onSubmit } = this.props;
    const { type, seriesItems, xAxis, isLinked } = this.state;
    const series = seriesItems.map(item => item.value);
    onSubmit({ type: `${type}`, series, xAxis, isLinked });
  }

  handleTypeClick(event) {
    const index = event.target.getAttribute('data-index');
    const type = ChartBuilder.types[index];

    log.debug2('handleTypeSelect', type);

    this.setState(
      state => {
        const maxSeriesCount = ChartBuilder.getMaxSeriesCount(type);
        let { seriesItems } = state;
        seriesItems = seriesItems.slice(0, maxSeriesCount);
        if (seriesItems.length === 0 && maxSeriesCount > 0) {
          const { model } = this.props;
          const { columns } = model;
          seriesItems = ChartBuilder.makeDefaultSeriesItems(type, columns);
        }

        return { type, seriesItems };
      },
      () => {
        this.sendChange();
      }
    );
  }

  handleXAxisChange(event) {
    const xAxis = event.target.value;
    log.debug2('x-axis change', xAxis);

    this.setState({ xAxis }, () => {
      this.sendChange();
    });
  }

  sendChange() {
    const { onChange } = this.props;
    const { isLinked, type, seriesItems, xAxis } = this.state;
    const series = seriesItems.map(item => item.value);

    onChange({ type, series, xAxis, isLinked });
  }

  render() {
    const { model } = this.props;
    const { columns } = model;
    const { seriesItems, type, xAxis, isLinked } = this.state;
    const maxSeriesCount = ChartBuilder.getMaxSeriesCount(type);
    const xAxisLabel = ChartBuilder.getXAxisLabel(type);
    const seriesLabel = ChartBuilder.getSeriesLabel(type);
    const isSeriesVisible = seriesItems.length > 0;
    const isAddSeriesVisible = seriesItems.length < maxSeriesCount;

    return (
      <div className="chart-builder">
        <form onSubmit={this.handleSubmit}>
          <div className="form-row">
            <label>Select Chart Type</label>
            <div className="form-row">
              {ChartBuilder.types.map((chartType, index) => (
                <div key={chartType} className="col col-chart-type">
                  <button
                    type="button"
                    className={classNames('btn', 'btn-icon', 'btn-chart-type', {
                      active: chartType === type,
                    })}
                    data-index={index}
                    onClick={this.handleTypeClick}
                  >
                    {ChartBuilder.getTypeIcon(chartType)}
                    {ChartBuilder.getTypeName(chartType)}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <hr />
          <div className="form-row form-inline">
            <label className="col-2 label-left">{xAxisLabel}</label>
            <select
              className="form-control custom-select select-x-axis col"
              value={xAxis}
              onChange={this.handleXAxisChange}
            >
              {columns.map(column => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>
          {isSeriesVisible && <hr />}
          {seriesItems.map((seriesItem, i) => (
            <div
              className="form-row form-inline form-series-item"
              key={seriesItem.id}
            >
              <label className="col-2 label-left">
                {i === 0 ? seriesLabel : ''}
              </label>
              <select
                className="form-control custom-select select-series col"
                value={seriesItem.value}
                onChange={this.handleSeriesChange}
                data-index={i}
              >
                {columns.map(column => (
                  <option key={column.name} value={column.name} data-index={i}>
                    {column.name}
                  </option>
                ))}
              </select>
              {seriesItems.length > 1 && (
                <button
                  type="button"
                  className="btn btn-link btn-link-icon btn-delete-series ml-2 px-2"
                  data-index={i}
                  onClick={this.handleSeriesDeleteClick}
                >
                  <FontAwesomeIcon icon={vsTrash} />
                </button>
              )}
            </div>
          ))}
          {isAddSeriesVisible && (
            <div className="form-row">
              <div className="col-2" />
              <button
                type="button"
                className="btn btn-link btn-add-series mt-1"
                onClick={this.handleAddSeries}
              >
                <FontAwesomeIcon icon={dhNewCircleLargeFilled} />
                Add Series
              </button>
            </div>
          )}
          <div className="form-row chart-builder-link">
            <label className="col-2 label-right">
              <div className="fa-md fa-layers">
                <FontAwesomeIcon
                  mask={dhTable}
                  icon={vsCircleLargeFilled}
                  transform="right-5 down-5"
                />
                <FontAwesomeIcon
                  icon={isLinked ? vsLink : dhUnlink}
                  transform="grow-2 right-8 down-6"
                />
              </div>
            </label>
            <RadioGroup
              onChange={this.handleLinkStateChange}
              value={`${isLinked}`}
            >
              <RadioItem value="true">Sync State</RadioItem>
              <RadioItem value="false">Freeze State</RadioItem>
            </RadioGroup>
          </div>
          <div className="form-row">
            <div className="col-2 label-right" />
            <div className="col chart-builder-link-info">
              {isLinked
                ? 'Charts with synced state will update to match any filters or user modifications applied to the parent table.'
                : 'Freeze State disconnects the chart state from the parent table. New filters or user modifications on the parent table will not be applied.'}
            </div>
          </div>
          <div
            className={classNames('form-row', 'justify-content-end', 'my-3')}
          >
            <button
              type="button"
              className="btn btn-outline-primary btn-reset"
              onClick={this.handleReset}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary btn-submit">
              Create
            </button>
          </div>
        </form>
      </div>
    );
  }
}

ChartBuilder.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ChartBuilder;
