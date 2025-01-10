import React, { Component, type ReactElement, type RefObject } from 'react';
import deepEqual from 'fast-deep-equal';
import memoize from 'memoize-one';
import {
  vsLoading,
  dhGraphLineDown,
  dhWarningFilled,
  type IconDefinition,
} from '@deephaven/icons';
import {
  Formatter,
  FormatterUtils,
  DateUtils,
  type DateTimeColumnFormatterOptions,
  type DecimalColumnFormatterOptions,
  type IntegerColumnFormatterOptions,
  type FormattingRule,
  type ColumnFormatSettings,
  type DateTimeFormatSettings,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  type Config as PlotlyConfig,
  type Layout,
  type Icon,
  type Data,
  type PlotData,
  type ModeBarButtonAny,
} from 'plotly.js';
import type { PlotParams } from 'react-plotly.js';
import { mergeRefs } from '@deephaven/react-hooks';
import { bindAllMethods } from '@deephaven/utils';
import createPlotlyComponent from './plotly/createPlotlyComponent';
import Plotly from './plotly/Plotly';
import ChartModel from './ChartModel';
import ChartErrorOverlay from './ChartErrorOverlay';
import { type ChartTheme } from './ChartTheme';
import ChartUtils, { type ChartModelSettings } from './ChartUtils';
import './Chart.scss';
import DownsamplingError from './DownsamplingError';
import useChartTheme from './useChartTheme';

const log = Log.module('Chart');

type ChartSettings = ColumnFormatSettings &
  DateTimeFormatSettings & {
    decimalFormatOptions?: DecimalColumnFormatterOptions;
    integerFormatOptions?: IntegerColumnFormatterOptions;
    webgl?: boolean;
  };

interface ChartProps {
  model: ChartModel;
  theme: ChartTheme;

  /** User settings that are relevant to the chart, e.g. formatter settings */
  settings: ChartSettings;

  isActive: boolean;
  Plotly: typeof Plotly;
  containerRef?: React.Ref<HTMLDivElement>;
  onDisconnect: () => void;
  onReconnect: () => void;
  onUpdate: (obj: { isLoading: boolean }) => void;
  onError: (error: Error) => void;

  /** Called when the settings for the ChartModel are changed */
  onSettingsChanged: (settings: Partial<ChartModelSettings>) => void;
}

// All of the ChartProps have default values except for model in the Chart
// component, hence the Partial here.
interface ChartContainerProps extends Partial<Omit<ChartProps, 'theme'>> {
  model: ChartModel;
}

interface ChartState {
  data: Partial<Data>[] | null;
  /** An error specific to downsampling */
  downsamplingError: unknown;
  isDownsampleFinished: boolean;
  isDownsampleInProgress: boolean;
  isDownsamplingDisabled: boolean;

  /** Any other kind of error that doesn't completely block the chart from rendering */
  error: unknown;
  shownError: string | null;
  layout: Partial<Layout>;
  revision: number;

  /** A message that blocks the chart from rendering. It can be bypassed by the user to continue rendering.  */
  shownBlocker: string | null;
}

class Chart extends Component<ChartProps, ChartState> {
  static defaultProps = {
    isActive: true,
    settings: {
      timeZone: 'America/New_York',
      defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
      showTimeZone: false,
      showTSeparator: true,
      formatter: [],
      webgl: true,
    },
    Plotly,
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

    bindAllMethods(this);

    this.PlotComponent = createPlotlyComponent(props.Plotly);
    this.plot = React.createRef();
    this.plotWrapper = React.createRef();
    this.plotWrapperMerged = mergeRefs(this.plotWrapper, props.containerRef);
    this.columnFormats = [];
    this.dateTimeFormatterOptions = {};
    this.decimalFormatOptions = {};
    this.integerFormatOptions = {};
    this.isSubscribed = false;
    this.isLoadedFired = false;
    this.currentSeries = 0;
    this.resizeObserver = new window.ResizeObserver(this.handleResize);

    this.state = {
      data: null,
      downsamplingError: null,
      isDownsampleFinished: false,
      isDownsampleInProgress: false,
      isDownsamplingDisabled: false,
      error: null,
      shownError: null,
      layout: {
        datarevision: 0,
      },
      revision: 0,
      shownBlocker: null,
    };
  }

  componentDidMount(): void {
    // Need to make sure the model dimensions are up to date before initializing the data
    this.updateDimensions();
    this.updateModelDimensions();

    this.initData();
    this.initFormatter();

    const { isActive, model } = this.props;
    if (isActive) {
      this.subscribe(model);
    }
    if (this.plotWrapper.current != null) {
      this.resizeObserver.observe(this.plotWrapper.current);
    }

    this.handleThemeChange();
  }

  componentDidUpdate(prevProps: ChartProps): void {
    const { isActive, model, settings, theme } = this.props;
    this.updateFormatterSettings(settings);

    if (model !== prevProps.model) {
      this.unsubscribe(prevProps.model);
      this.subscribe(model);
    }

    if (isActive !== prevProps.isActive) {
      if (isActive) {
        this.updateDimensions();
        this.subscribe(model);
      } else {
        this.unsubscribe(model);
      }
    }

    if (theme !== prevProps.theme) {
      this.handleThemeChange();
    }
  }

  componentWillUnmount(): void {
    const { model } = this.props;
    this.unsubscribe(model);

    this.resizeObserver.disconnect();
  }

  currentSeries: number;

  PlotComponent: React.ComponentType<PlotParams>;

  plot: RefObject<typeof this.PlotComponent>;

  plotWrapper: RefObject<HTMLDivElement>;

  plotWrapperMerged: React.RefCallback<HTMLDivElement>;

  columnFormats?: FormattingRule[];

  dateTimeFormatterOptions?: DateTimeColumnFormatterOptions;

  decimalFormatOptions: DecimalColumnFormatterOptions;

  integerFormatOptions: IntegerColumnFormatterOptions;

  webgl?: boolean;

  rect?: DOMRect;

  ranges?: unknown;

  isSubscribed: boolean;

  isLoadedFired: boolean;

  // Listen for resizing of the element and update the canvas appropriately
  resizeObserver: ResizeObserver;

  getCachedConfig = memoize(
    (
      downsamplingError: unknown,
      isDownsampleFinished: boolean,
      isDownsampleInProgress: boolean,
      isDownsamplingDisabled: boolean,
      data: Partial<Data>[],
      error: unknown
    ): Partial<PlotlyConfig> => {
      const customButtons: ModeBarButtonAny[] = [];
      const hasDownsampleError = Boolean(downsamplingError);
      if (hasDownsampleError) {
        customButtons.push({
          name: `Downsampling failed: ${downsamplingError}`,
          title: 'Downsampling failed',
          click: () => {
            this.toggleErrorMessage(`${downsamplingError}`);
          },
          icon: Chart.convertIcon(dhWarningFilled),
          attr: 'fill-warning',
        });
      }
      const hasError = Boolean(error);
      if (hasError) {
        customButtons.push({
          name: `Error: ${error}`,
          title: `Error`,
          click: () => {
            this.toggleErrorMessage(`${error}`);
          },
          icon: Chart.convertIcon(dhWarningFilled),
          attr: 'fill-warning',
        });
      }

      if (
        isDownsampleFinished ||
        isDownsampleInProgress ||
        isDownsamplingDisabled ||
        hasDownsampleError
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
          title: 'Downsampling status',
          icon: Chart.convertIcon(icon),
          click: this.handleDownsampleClick,
          attr,
        });
      }

      const has2D = data.some(
        ({ type }) => type != null && !type.includes('3d')
      );
      const has3D = data.some(
        ({ type }) => type != null && type.includes('3d')
      );

      const buttons2D = [
        'zoomIn2d',
        'zoomOut2d',
        'autoScale2d',
        'resetScale2d',
      ] as const;
      const buttons3D = [
        'orbitRotation',
        'tableRotation',
        'resetCameraDefault3d',
      ] as const;

      return {
        displaylogo: false,

        // scales the plot to the container size
        // https://github.com/plotly/react-plotly.js/issues/102
        responsive: true,

        // Display the mode bar if there's an error or downsampling so user can see progress
        // Yes, the value is a boolean or the string 'hover': https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L249
        displayModeBar:
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          isDownsampleInProgress || hasDownsampleError || hasError
            ? true
            : ('hover' as const),

        // Each array gets grouped together in the mode bar
        modeBarButtons: [
          customButtons,
          ['toImage'],
          ['zoom2d', 'pan2d'], // These work the same for both 2d and 3d
          [...(has2D ? buttons2D : []), ...(has3D ? buttons3D : [])],
        ],
      };
    }
  );

  getPlotRect(): DOMRect | null {
    return this.plotWrapper.current?.getBoundingClientRect() ?? null;
  }

  initData(): void {
    const { model } = this.props;

    this.setState(({ layout }) => ({
      data: model.getData(),
      layout: {
        ...layout,
        ...model.getLayout(),
      },
    }));
  }

  subscribe(model: ChartModel): void {
    if (this.isSubscribed) {
      return;
    }

    if (!this.rect || this.rect.width === 0 || this.rect.height === 0) {
      log.debug2('Delaying subscription until model dimensions are set');
      return;
    }
    model.subscribe(this.handleModelEvent);
    this.isSubscribed = true;
  }

  unsubscribe(model: ChartModel): void {
    if (!this.isSubscribed) {
      return;
    }

    model.unsubscribe(this.handleModelEvent);
    this.isSubscribed = false;
  }

  handleAfterPlot(): void {
    if (this.plot.current != null) {
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

  handleErrorClose(): void {
    this.setState({ shownError: null });
  }

  handleDownsampleErrorClose(): void {
    this.setState({ downsamplingError: null });
  }

  handleModelEvent(event: DhType.Event<unknown>): void {
    const { type, detail } = event;
    log.debug2('Received data update', type, detail);

    switch (type) {
      case ChartModel.EVENT_UPDATED: {
        this.currentSeries += 1;
        this.setState(state => {
          const { layout, revision } = state;
          if (typeof layout.datarevision === 'number') {
            layout.datarevision += 1;
          }
          return {
            data: detail as Partial<Data>[] | null,
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
        const downsamplingError =
          (detail as { message?: string }).message ?? detail;
        this.setState({
          isDownsampleFinished: false,
          isDownsampleInProgress: false,
          isDownsamplingDisabled: false,
          downsamplingError,
        });

        const { onError } = this.props;
        onError(
          new DownsamplingError(
            downsamplingError == null ? undefined : `${downsamplingError}`
          )
        );
        break;
      }
      case ChartModel.EVENT_ERROR: {
        const error = `${detail}`;
        this.setState({ error });
        const { onError } = this.props;
        onError(new Error(error));
        break;
      }
      case ChartModel.EVENT_BLOCKER: {
        const blocker = `${detail}`;
        this.setState({ shownBlocker: blocker });
        break;
      }
      case ChartModel.EVENT_BLOCKER_CLEAR: {
        this.setState({ shownBlocker: null });
        break;
      }
      default:
        log.debug('Unknown event type', type, event);
    }
  }

  handlePlotUpdate(figure: Readonly<{ layout: Partial<Layout> }>): void {
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

  handleResize(): void {
    this.updateDimensions();
  }

  handleRestyle([changes, seriesIndexes]: readonly [
    Record<string, unknown>,
    number[],
  ]): void {
    log.debug('handleRestyle', changes, seriesIndexes);
    if (Object.keys(changes).includes('visible')) {
      const { data } = this.state;
      const { onSettingsChanged } = this.props;
      if (data != null) {
        const hiddenSeries = (data as Partial<PlotData>[]).reduce(
          (acc: string[], { name, visible }) =>
            name != null && visible === 'legendonly' ? [...acc, name] : acc,
          []
        );
        onSettingsChanged({ hiddenSeries });
      }
    }
  }

  handleThemeChange(): void {
    const { theme, model } = this.props;
    const { dh } = model;
    const chartUtils = new ChartUtils(dh);

    this.setState(({ layout }) => ({
      layout: {
        ...layout,
        template: chartUtils.makeDefaultTemplate(theme),
      },
    }));
  }

  /**
   * Toggle the error message. If it is already being displayed, then hide it.
   */
  toggleErrorMessage(error: string): void {
    this.setState(({ shownError }) => ({
      shownError: shownError === error ? null : error,
    }));
  }

  /**
   * Update the models dimensions and ranges.
   * Note that this will update it all whether the plot size changes OR the range
   * the user is looking at has changed (eg. panning/zooming).
   * Could update each independently, but doing them at the same time keeps the
   * ChartModel API a bit cleaner.
   * @param force Force a change even if the chart dimensions haven't changed (eg. after pan/zoom)
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
        this.subscribe(model);
      }
    }
  }

  initFormatter(): void {
    const { settings } = this.props;
    this.updateFormatterSettings(settings);
  }

  updateFormatterSettings(settings: ChartSettings): void {
    const columnFormats = FormatterUtils.getColumnFormats(settings);
    const dateTimeFormatterOptions =
      FormatterUtils.getDateTimeFormatterOptions(settings);
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

    if (this.webgl !== settings.webgl) {
      this.webgl = settings.webgl;
      this.updateRenderOptions();
    }
  }

  updateFormatter(): void {
    const { model } = this.props;
    const formatter = new Formatter(
      model.dh,
      this.columnFormats,
      this.dateTimeFormatterOptions,
      this.decimalFormatOptions,
      this.integerFormatOptions
    );
    model.setFormatter(formatter);
  }

  updateRenderOptions(): void {
    const { model } = this.props;
    const renderOptions = { webgl: this.webgl };
    model.setRenderOptions(renderOptions);
  }

  updateDimensions(): void {
    const rect = this.getPlotRect();
    const { Plotly: PlotlyProp } = this.props;
    if (
      this.plot.current != null &&
      rect != null &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      // Call relayout to resize avoiding the debouncing plotly does
      // https://github.com/plotly/plotly.js/issues/2769#issuecomment-402099552
      PlotlyProp.relayout(
        (this.plot.current as unknown as { el: HTMLElement }).el,
        {
          autosize: true,
        }
      ).catch((e: unknown) => {
        log.debug('Unable to resize, promise rejected', e);
      });
    }
  }

  render(): ReactElement {
    const { PlotComponent } = this;
    const {
      data,
      downsamplingError,
      isDownsampleFinished,
      isDownsampleInProgress,
      isDownsamplingDisabled,
      error,
      shownError,
      layout,
      revision,
      shownBlocker,
    } = this.state;
    const config = this.getCachedConfig(
      downsamplingError,
      isDownsampleFinished,
      isDownsampleInProgress,
      isDownsamplingDisabled,
      data ?? [],
      error
    );
    const { model } = this.props;
    const isPlotShown = data != null && shownBlocker == null;

    let errorOverlay: React.ReactNode = null;
    if (shownBlocker != null) {
      errorOverlay = (
        <ChartErrorOverlay
          errorMessage={`${shownBlocker}`}
          onConfirm={() => {
            model.fireBlockerClear();
          }}
        />
      );
    } else if (shownError != null) {
      errorOverlay = (
        <ChartErrorOverlay
          errorMessage={`${downsamplingError}`}
          onDiscard={() => {
            this.handleDownsampleErrorClose();
          }}
          onConfirm={() => {
            this.handleDownsampleErrorClose();
            this.handleDownsampleClick();
          }}
        />
      );
    } else if (downsamplingError != null) {
      errorOverlay = (
        <ChartErrorOverlay
          errorMessage={`${downsamplingError}`}
          onDiscard={() => {
            this.handleDownsampleErrorClose();
          }}
          onConfirm={() => {
            this.handleDownsampleErrorClose();
            this.handleDownsampleClick();
          }}
        />
      );
    }

    return (
      <div className="h-100 w-100 chart-wrapper" ref={this.plotWrapperMerged}>
        {isPlotShown && (
          <PlotComponent
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
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
            style={{ height: '100%', width: '100%' }}
          />
        )}
        {errorOverlay}
      </div>
    );
  }
}

export default function ChartContainer(
  props: ChartContainerProps
): JSX.Element {
  const chartTheme = useChartTheme();
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Chart {...props} theme={chartTheme} />;
}
