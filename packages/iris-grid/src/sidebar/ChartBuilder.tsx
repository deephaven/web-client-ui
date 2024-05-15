import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, RadioGroup, Radio, Select } from '@deephaven/components';
import {
  vsLink,
  dhUnlink,
  dhTable,
  dhNewCircleLargeFilled,
  vsCircleLargeFilled,
  vsTrash,
} from '@deephaven/icons';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { bindAllMethods } from '@deephaven/utils';
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

export type ChartBuilderSettings = {
  type: DhType.plot.SeriesPlotStyle;
  series: string[];
  xAxis: string;
  isLinked: boolean;
};
export type SeriesItem = {
  id: string;
  value: string;
};

interface ChartBuilderProps {
  model: IrisGridModel;
  onSubmit: (obj: ChartBuilderSettings) => void;
  onChange: (obj: ChartBuilderSettings) => void;
}
interface ChartBuilderState {
  /** The selected chart type */
  type: DhType.plot.SeriesPlotStyle;

  /** Array of column names of the series to display */
  seriesItems: readonly SeriesItem[];

  /** The column name to use as the x-axis */
  xAxis: string;

  /** Whether the newly created chart should be linked with the table (update when filters update) */
  isLinked: boolean;
}
/**
 * Form for configuring all the settings when creating a console.
 */
class ChartBuilder extends PureComponent<ChartBuilderProps, ChartBuilderState> {
  static getMaxSeriesCount(
    dh: typeof DhType,
    type: DhType.plot.SeriesPlotStyle
  ): number {
    switch (type) {
      case dh.plot.SeriesPlotStyle.PIE:
        return 1;
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 0;
      default:
        return 100;
    }
  }

  static makeSeriesItem(value: string): SeriesItem {
    return { id: shortid.generate(), value };
  }

  static makeDefaultSeriesItems(
    dh: typeof DhType,
    type: DhType.plot.SeriesPlotStyle,
    columns: readonly DhType.Column[]
  ): SeriesItem[] {
    const maxSeriesCount = ChartBuilder.getMaxSeriesCount(dh, type);
    if (maxSeriesCount === 0 || columns == null || columns.length === 0) {
      return [];
    }

    const value = columns.length > 1 ? columns[1].name : columns[0].name;
    return [ChartBuilder.makeSeriesItem(value)];
  }

  static getDefaultXAxis(
    type: DhType.plot.SeriesPlotStyle,
    columns: readonly DhType.Column[]
  ): string | null {
    if (columns != null && columns.length > 0) {
      return columns[0].name;
    }

    return null;
  }

  constructor(props: ChartBuilderProps) {
    super(props);

    bindAllMethods(this);

    const { model } = props;
    const { columns, dh } = model;

    const type = this.getTypes()[0];
    const xAxis = ChartBuilder.getDefaultXAxis(type, columns) as string;
    const seriesItems = ChartBuilder.makeDefaultSeriesItems(dh, type, columns);

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

  getTypes(): DhType.plot.SeriesPlotStyle[] {
    const { model } = this.props;
    const { dh } = model;
    return [
      dh.plot.SeriesPlotStyle.LINE,
      dh.plot.SeriesPlotStyle.BAR,
      dh.plot.SeriesPlotStyle.SCATTER,
      dh.plot.SeriesPlotStyle.PIE,
      // IDS-6808: Disable Histogram in Chart Builder until we pipe histogram creation through the API
      // dh.plot.SeriesPlotStyle.HISTOGRAM,
    ];
  }

  /**
   * Converts the provided chart type into a readable type.
   * Just replaces underscores with spaces and capitals the first letter of each word.
   */
  getTypeName(
    type: DhType.plot.SeriesPlotStyle
  ): string | DhType.plot.SeriesPlotStyle {
    const { model } = this.props;
    const { dh } = model;
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

  getTypeIcon(type: DhType.plot.SeriesPlotStyle): React.ReactElement | null {
    const { model } = this.props;
    const { dh } = model;
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

  getXAxisLabel(type: DhType.plot.SeriesPlotStyle): string {
    const { model } = this.props;
    const { dh } = model;
    switch (type) {
      case dh.plot.SeriesPlotStyle.PIE:
        return 'Labels';
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 'Data';
      default:
        return 'X-Axis';
    }
  }

  getSeriesLabel(type: DhType.plot.SeriesPlotStyle): string {
    const { model } = this.props;
    const { dh } = model;
    switch (type) {
      case dh.plot.SeriesPlotStyle.PIE:
        return 'Values';
      default:
        return 'Series';
    }
  }

  handleAddSeries(): void {
    this.setState(state => {
      const { seriesItems } = state;
      const newSeriesItems = [...seriesItems];

      const { model } = this.props;
      const { columns } = model;
      newSeriesItems.push({
        id: shortid.generate(),
        value: columns[0].name,
      });

      return { seriesItems: newSeriesItems };
    }, this.sendChange);
  }

  handleLinkStateChange(value: string): void {
    this.setState({ isLinked: value === 'true' }, this.sendChange);
  }

  handleReset(): void {
    const { model } = this.props;
    const { columns, dh } = model;

    const type = this.getTypes()[0];
    const xAxis = ChartBuilder.getDefaultXAxis(type, columns) as string;
    const seriesItems = ChartBuilder.makeDefaultSeriesItems(dh, type, columns);
    const isLinked = true;

    this.setState({ type, seriesItems, xAxis, isLinked }, this.sendChange);
  }

  handleSeriesChange(eventTargetValue: string, index: number): void {
    const value = eventTargetValue;

    this.setState(state => {
      let { seriesItems } = state;
      seriesItems = [...seriesItems];
      seriesItems[index].value = value;

      return { seriesItems };
    }, this.sendChange);
  }

  handleSeriesDeleteClick(index: number): void {
    this.setState(state => {
      const { seriesItems } = state;
      const newSeriesItems = [...seriesItems];

      newSeriesItems.splice(index, 1);

      return { seriesItems: newSeriesItems };
    }, this.sendChange);
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const { onSubmit } = this.props;
    const { type, seriesItems, xAxis, isLinked } = this.state;
    const series = seriesItems.map(item => item.value);
    onSubmit({
      type,
      series,
      xAxis,
      isLinked,
    });
  }

  handleTypeClick(index: number): void {
    const type = this.getTypes()[index];

    log.debug2('handleTypeSelect', type);

    this.setState(state => {
      const { model } = this.props;
      const { dh } = model;
      const maxSeriesCount = ChartBuilder.getMaxSeriesCount(dh, type);
      let { seriesItems } = state;
      seriesItems = seriesItems.slice(0, maxSeriesCount);
      if (seriesItems.length === 0 && maxSeriesCount > 0) {
        const { columns } = model;
        seriesItems = ChartBuilder.makeDefaultSeriesItems(dh, type, columns);
      }

      return { type, seriesItems };
    }, this.sendChange);
  }

  handleXAxisChange(eventTargetValue: string): void {
    const xAxis = eventTargetValue;
    log.debug2('x-axis change', xAxis);

    this.setState({ xAxis }, this.sendChange);
  }

  sendChange(): void {
    const { onChange } = this.props;
    const { isLinked, type, seriesItems, xAxis } = this.state;
    const series = seriesItems.map(item => item.value);

    onChange({ type, series, xAxis, isLinked });
  }

  render(): JSX.Element {
    const { model } = this.props;
    const { columns, dh } = model;
    const { seriesItems, type, xAxis, isLinked } = this.state;
    const maxSeriesCount = ChartBuilder.getMaxSeriesCount(dh, type);
    const xAxisLabel = this.getXAxisLabel(type);
    const seriesLabel = this.getSeriesLabel(type);
    const isSeriesVisible = seriesItems.length > 0;
    const isAddSeriesVisible = seriesItems.length < maxSeriesCount;

    return (
      <div className="chart-builder">
        <form onSubmit={this.handleSubmit}>
          <div className="form-row">
            <label>Select Chart Type</label>
            <div className="form-row">
              {this.getTypes().map((chartType, index) => {
                const key = chartType as unknown as React.Key;
                return (
                  <div key={key} className="col col-chart-type">
                    <button
                      type="button"
                      className={classNames(
                        'btn',
                        'btn-icon',
                        'btn-chart-type',
                        {
                          active: chartType === type,
                        }
                      )}
                      onClick={() => this.handleTypeClick(index)}
                    >
                      {this.getTypeIcon(chartType)}
                      {this.getTypeName(chartType)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <hr />
          <div className="form-row form-inline">
            <label className="col-2 label-left">{xAxisLabel}</label>
            <Select
              className="form-control select-x-axis col"
              value={xAxis}
              onChange={this.handleXAxisChange}
            >
              {columns.map(column => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </Select>
          </div>
          {isSeriesVisible && <hr />}
          {seriesItems.map((seriesItem, i) => (
            <div
              className="form-row form-inline form-series-item"
              key={seriesItem.id}
              data-testid={`form-series-item-${i}`}
            >
              <label className="col-2 label-left">
                {i === 0 ? seriesLabel : ''}
              </label>
              <Select
                className="form-control select-series col"
                value={seriesItem.value}
                onChange={v => this.handleSeriesChange(v, i)}
                data-testid={`select-series-item-${i}`}
              >
                {columns.map(column => (
                  <option key={column.name} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </Select>
              {seriesItems.length > 1 && (
                <Button
                  kind="ghost"
                  className="btn-delete-series ml-2 px-2"
                  data-testid={`delete-series-${i}`}
                  onClick={() => {
                    this.handleSeriesDeleteClick(i);
                  }}
                  icon={vsTrash}
                  tooltip="Delete"
                />
              )}
            </div>
          ))}
          {isAddSeriesVisible && (
            <div className="form-row">
              <div className="col-2" />
              <Button
                kind="ghost"
                className="btn-add-series mt-1"
                onClick={this.handleAddSeries}
                icon={dhNewCircleLargeFilled}
              >
                Add Series
              </Button>
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
              aria-label="Link state options"
              orientation="horizontal"
              onChange={this.handleLinkStateChange}
              value={`${isLinked}`}
            >
              <Radio value="true">Sync State</Radio>
              <Radio value="false">Freeze State</Radio>
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
            <Button
              kind="secondary"
              className="btn-reset"
              onClick={this.handleReset}
            >
              Reset
            </Button>
            <Button kind="primary" type="submit" className="btn-submit">
              Create
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

export default ChartBuilder;
