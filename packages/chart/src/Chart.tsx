import React, { Component, ReactElement, RefObject } from 'react';
import deepEqual from 'deep-equal';
import memoize from 'memoize-one';
import {
  vsLoading,
  dhGraphLineDown,
  dhWarningFilled,
  IconDefinition,
} from '@deephaven/icons';
import {
  Formatter,
  FormatterUtils,
  DateUtils,
  DateTimeColumnFormatterOptions,
  DecimalColumnFormatterOptions,
  IntegerColumnFormatterOptions,
  FormattingRule,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { WorkspaceSettings } from '@deephaven/redux';
import { Layout, Icon } from 'plotly.js';
import Plotly from './plotly/Plotly';
import Plot from './plotly/Plot';

import ChartModel from './ChartModel';
import ChartUtils from './ChartUtils';
import './Chart.scss';

const log = Log.module('Chart');

type FormatterSettings = Partial<WorkspaceSettings> & {
  decimalFormatOptions: DecimalColumnFormatterOptions;
  integerFormatOptions: IntegerColumnFormatterOptions;
};

interface ChartProps {
  model: ChartModel;
  // These settings come from the redux store
  settings: Partial<WorkspaceSettings>;
  isActive: boolean;
  onDisconnect: () => void;
  onReconnect: () => void;
  onUpdate: (obj: { isLoading: boolean }) => void;
  onError: (error: Error) => void;
  onSettingsChanged: (settings: Partial<ChartModelSettings>) => void;
}

interface ChartModelSettings {
  hiddenSeries: string[];
}

interface ChartState {
  data: { name: string; visible: string }[] | null;
  downsamplingError: unknown;
  isDownsampleFinished: boolean;
  isDownsampleInProgress: boolean;
  isDownsamplingDisabled: boolean;
  layout: {
    datarevision: number;
  };
  revision: number;
}

export class Chart extends Component<ChartProps, ChartState> {
  static defaultProps = {
    isActive: true,
    settings: {
      timeZone: 'America/New_York',
      defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
      showTimeZone: false,
      showTSeparator: true,
      formatter: [],
    },
    onDisconnect: (): void => undefined,
    onReconnect: (): void => undefined,
    onUpdate: (): void => undefined,
    onError: (): void => undefined,
    onSettingsChanged: (): void => undefined,
  };

  /**
   * Convert a font awesome icon definition to a plotly icon definition
   * @param faIcon The icon to convert
   */
  static convertIcon(faIcon: IconDefinition): Icon {
    const [width, , , , path] = faIcon.icon;
    // By default the icons are flipped upside down, so we need to add our own transform
    // https://github.com/plotly/plotly.js/issues/1335
    const stringPath = `${path}`;
    return {
      width,
      path: stringPath,
      ascent: width,
      descent: 0,
      transform: `matrix(1, 0, 0, 1, 0, 0)`,
    };
  }

  static downsampleButtonTitle(
    isDownsampleInProgress: boolean,
    isDownsamplingDisabled: boolean
  ): string {
    if (isDownsampleInProgress) {
      return 'Downsampling in progress...';
    }

    return isDownsamplingDisabled
      ? 'Downsampling disabled, click to enable'
      : 'Downsampling enabled, click to disable';
  }

  static downsampleButtonAttr(
    isDownsampleInProgress: boolean,
    isDownsamplingDisabled: boolean
  ): string | undefined {
    if (isDownsampleInProgress) {
      return 'animation-spin';
    }

    return isDownsamplingDisabled ? undefined : 'fill-active';
  }

  constructor(props: ChartProps) {
    super(props);

    this.handleAfterPlot = this.handleAfterPlot.bind(this);
    this.handleDownsampleClick = this.handleDownsampleClick.bind(this);
    this.handleModelEvent = this.handleModelEvent.bind(this);
    this.handlePlotUpdate = this.handlePlotUpdate.bind(this);
    this.handleRelayout = this.handleRelayout.bind(this);
    this.handleRestyle = this.handleRestyle.bind(this);

    this.plot = React.createRef();
    this.plotWrapper = React.createRef();
    this.columnFormats = [];
    this.dateTimeFormatterOptions = {};
    this.decimalFormatOptions = {};
    this.integerFormatOptions = {};
    this.isSubscribed = false;
    this.isLoadedFired = false;
    this.currentSeries = 0;

    this.state = {
      data: null,
      downsamplingError: null,
      isDownsampleFinished: false,
      isDownsampleInProgress: false,
      isDownsamplingDisabled: false,
      layout: {
        datarevision: 0,
      },
      revision: 0,
    };
  }

  componentDidMount(): void {
    // Need to make sure the model dimensions are up to date before initializing the data
    this.updateDimensions();
    this.updateModelDimensions();

    this.initData();
    this.initFormatter();

    const { isActive } = this.props;
    if (isActive) {
      this.subscribe();
    }
  }

  componentDidUpdate(prevProps: ChartProps): void {
    const { isActive, settings } = this.props;
    this.updateFormatterSettings(settings as FormatterSettings);

    if (isActive !== prevProps.isActive) {
      if (isActive) {
        this.subscribe();
      } else {
        this.unsubscribe();
      }
    }
  }

  componentWillUnmount(): void {
    this.unsubscribe();
  }

  currentSeries: number;

  plot: RefObject<typeof Plot>;

  plotWrapper: RefObject<HTMLDivElement>;

  columnFormats?: FormattingRule[];

  dateTimeFormatterOptions?: DateTimeColumnFormatterOptions;

  decimalFormatOptions: DecimalColumnFormatterOptions;

  integerFormatOptions: IntegerColumnFormatterOptions;

  rect?: DOMRect;

  ranges?: unknown;

  isSubscribed: boolean;

  isLoadedFired: boolean;

  getCachedConfig = memoize(
    (
      downsamplingError,
      isDownsampleFinished,
      isDownsampleInProgress,
      isDownsamplingDisabled
    ) => {
      const customButtons = [];
      if (downsamplingError) {
        customButtons.push({
          name: `Downsampling failed: ${downsamplingError}`,
          click: () => undefined,
          icon: Chart.convertIcon(dhWarningFilled),
          attr: 'fill-warning',
        });
      }

      if (
        isDownsampleFinished ||
        isDownsampleInProgress ||
        isDownsamplingDisabled ||
        downsamplingError
      ) {
        const name = Chart.downsampleButtonTitle(
          isDownsampleInProgress,
          isDownsamplingDisabled
        );
        const attr = Chart.downsampleButtonAttr(
          isDownsampleInProgress,
          isDownsamplingDisabled
        );

        const icon = isDownsampleInProgress ? vsLoading : dhGraphLineDown;
        customButtons.push({
          name,
          icon: Chart.convertIcon(icon),
          click: this.handleDownsampleClick,
          attr,
        });
      }

      return {
        displaylogo: false,

        // Display the mode bar if there's an error or downsampling so user can see progress
        // Yes, the value is a boolean or the string 'hover': https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L249
        displayModeBar:
          isDownsampleInProgress || downsamplingError ? true : 'hover',

        // Each array gets grouped together in the mode bar
        modeBarButtons: [
          customButtons,
          ['toImage'],
          ['zoom2d', 'pan2d'],
          ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
        ],
      };
    }
  );

  getPlotRect(): DOMRect | null {
    return this.plotWrapper.current?.getBoundingClientRect() ?? null;
  }

  initData(): void {
    const { model } = this.props;
    const { layout } = this.state;
    this.setState({
      data: model.getData(),
      layout: {
        ...layout,
        ...model.getLayout(),
      },
    });
  }

  subscribe(): void {
    if (this.isSubscribed) {
      return;
    }

    const { model } = this.props;
    if (!this.rect || this.rect.width === 0 || this.rect.height === 0) {
      log.debug2('Delaying subscription until model dimensions are set');
      return;
    }
    model.subscribe(this.handleModelEvent);
    this.isSubscribed = true;
  }

  unsubscribe(): void {
    if (!this.isSubscribed) {
      return;
    }

    const { model } = this.props;
    model.unsubscribe(this.handleModelEvent);
    this.isSubscribed = false;
  }

  handleAfterPlot(): void {
    if (this.plot.current) {
      // TODO: Translate whatever Don was doing in plotting.js in the afterplot here so that area graphs show up properly
    }
  }

  handleDownsampleClick(): void {
    this.setState(
      ({ isDownsamplingDisabled }) => ({
        downsamplingError: null,
        isDownsampleInProgress: false,
        isDownsampleFinished: false,
        isDownsamplingDisabled: !isDownsamplingDisabled,
      }),
      () => {
        const { model } = this.props;
        const { isDownsamplingDisabled } = this.state;
        model.setDownsamplingDisabled(isDownsamplingDisabled);
      }
    );
  }

  handleModelEvent(event: CustomEvent): void {
    const { type, detail } = event;
    log.debug2('Received data update', type, detail);

    switch (type) {
      case ChartModel.EVENT_UPDATED: {
        this.currentSeries += 1;
        this.setState(state => {
          const { layout, revision } = state;
          layout.datarevision += 1;
          return {
            data: detail,
            layout,
            revision: revision + 1,
          };
        });

        const { onUpdate } = this.props;
        onUpdate({ isLoading: !this.isLoadedFired });
        break;
      }
      case ChartModel.EVENT_LOADFINISHED: {
        const { onUpdate } = this.props;
        this.isLoadedFired = true;
        onUpdate({ isLoading: false });
        break;
      }
      case ChartModel.EVENT_DISCONNECT: {
        const { onDisconnect } = this.props;
        onDisconnect();
        break;
      }
      case ChartModel.EVENT_RECONNECT: {
        const { onReconnect } = this.props;
        onReconnect();
        break;
      }
      case ChartModel.EVENT_DOWNSAMPLESTARTED: {
        this.setState({
          isDownsampleFinished: false,
          isDownsampleInProgress: true,
          downsamplingError: null,
        });
        break;
      }
      case ChartModel.EVENT_DOWNSAMPLEFINISHED: {
        this.setState({
          isDownsampleFinished: true,
          isDownsampleInProgress: false,
          downsamplingError: null,
        });
        break;
      }
      case ChartModel.EVENT_DOWNSAMPLENEEDED:
      case ChartModel.EVENT_DOWNSAMPLEFAILED: {
        const downsamplingError = detail.message ? detail.message : detail;
        this.setState({
          isDownsampleFinished: false,
          isDownsampleInProgress: false,
          isDownsamplingDisabled: false,
          downsamplingError,
        });

        const { onError } = this.props;
        onError(new Error(downsamplingError));
        break;
      }
      default:
        log.debug('Unknown event type', type, event);
    }
  }

  handlePlotUpdate(figure: { layout: Layout }): void {
    // User could have modified zoom/pan here, update the model dimensions
    // We don't need to update the datarevision, as we don't have any data changes
    // until an update comes back from the server anyway
    const { layout } = figure;
    const ranges = ChartUtils.getLayoutRanges(layout);

    const isRangesChanged = !deepEqual(ranges, this.ranges);

    if (isRangesChanged) {
      this.ranges = ranges;

      this.updateModelDimensions(true);
    }
  }

  handleRelayout(changes: { hiddenlabels?: string[] }): void {
    log.debug('handleRelayout', changes);
    if (changes.hiddenlabels != null) {
      const { onSettingsChanged } = this.props;
      // Pie charts store series visibility in layout.hiddenlabels and trigger relayout on changes
      // Series visibility for other types of charts is handled in handleRestyle
      const hiddenSeries = [...changes.hiddenlabels];
      onSettingsChanged({ hiddenSeries });
    }

    this.updateModelDimensions();
  }

  handleRestyle([changes, seriesIndexes]: [
    Record<string, unknown>,
    number[]
  ]): void {
    log.debug('handleRestyle', changes, seriesIndexes);
    if (Object.keys(changes).includes('visible')) {
      const { data } = this.state;
      const { onSettingsChanged } = this.props;
      if (data != null) {
        const hiddenSeries = data.reduce(
          (acc: string[], { name, visible }) =>
            visible === 'legendonly' ? [...acc, name] : acc,
          []
        );
        onSettingsChanged({ hiddenSeries });
      }
    }
  }

  /**
   * Update the models dimensions and ranges.
   * Note that this will update it all whether the plot size changes OR the range
   * the user is looking at has changed (eg. panning/zooming).
   * Could update each independently, but doing them at the same time keeps the
   * ChartModel API a bit cleaner.
   * @param {boolean} force Force a change even if the chart dimensions haven't changed (eg. after pan/zoom)
   */
  updateModelDimensions(force = false): void {
    const rect = this.getPlotRect();
    if (!rect) {
      log.warn('Unable to get plotting rect');
      return;
    }

    const isRectChanged =
      !this.rect ||
      this.rect.width !== rect.width ||
      this.rect.height !== rect.height;

    if (isRectChanged || force) {
      this.rect = rect;

      const { isActive, model } = this.props;
      model.setDimensions(rect);
      // We may need to resubscribe if dimensions were too small before
      if (isActive) {
        this.subscribe();
      }
    }
  }

  initFormatter(): void {
    const { settings } = this.props;
    this.updateFormatterSettings(settings as FormatterSettings);
  }

  updateFormatterSettings(
    settings: Partial<WorkspaceSettings> & {
      decimalFormatOptions: DecimalColumnFormatterOptions;
      integerFormatOptions: IntegerColumnFormatterOptions;
    }
  ): void {
    const columnFormats = FormatterUtils.getColumnFormats(settings);
    const dateTimeFormatterOptions = FormatterUtils.getDateTimeFormatterOptions(
      settings
    );
    const { decimalFormatOptions = {}, integerFormatOptions = {} } = settings;

    if (
      !deepEqual(this.columnFormats, columnFormats) ||
      !deepEqual(this.dateTimeFormatterOptions, dateTimeFormatterOptions) ||
      !deepEqual(this.decimalFormatOptions, decimalFormatOptions) ||
      !deepEqual(this.integerFormatOptions, integerFormatOptions)
    ) {
      this.columnFormats = FormatterUtils.getColumnFormats(settings);
      this.dateTimeFormatterOptions = dateTimeFormatterOptions;
      this.decimalFormatOptions = decimalFormatOptions;
      this.integerFormatOptions = integerFormatOptions;
      this.updateFormatter();
    }
  }

  updateFormatter(): void {
    const formatter = new Formatter(
      this.columnFormats,
      this.dateTimeFormatterOptions,
      this.decimalFormatOptions,
      this.integerFormatOptions
    );

    const { model } = this.props;
    model.setFormatter(formatter);
  }

  updateDimensions(): void {
    const rect = this.getPlotRect();
    if (
      this.plot.current != null &&
      rect != null &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      // Call relayout to resize avoiding the debouncing plotly does
      // https://github.com/plotly/plotly.js/issues/2769#issuecomment-402099552
      Plotly.relayout(this.plot.current.el, { autosize: true }).catch(e => {
        log.debug('Unable to resize, promise rejected', e);
      });
    }
  }

  render(): ReactElement {
    const {
      data,
      downsamplingError,
      isDownsampleFinished,
      isDownsampleInProgress,
      isDownsamplingDisabled,
      layout,
      revision,
    } = this.state;
    const config = this.getCachedConfig(
      downsamplingError,
      isDownsampleFinished,
      isDownsampleInProgress,
      isDownsamplingDisabled
    );
    const isPlotShown = data != null;
    return (
      <div className="h-100 w-100 chart-wrapper" ref={this.plotWrapper}>
        {isPlotShown && (
          <Plot
            ref={this.plot}
            data={data}
            layout={layout}
            revision={revision}
            config={config}
            onAfterPlot={this.handleAfterPlot}
            onError={log.error}
            onRelayout={this.handleRelayout}
            onUpdate={this.handlePlotUpdate}
            onRestyle={this.handleRestyle}
            useResizeHandler
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>
    );
  }
}

export default Chart;
