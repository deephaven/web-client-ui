/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable lines-between-class-members */
/* eslint-disable max-classes-per-file */
export default dh;

export interface dh {
  IdeConnection: IdeConnectionConstructor;
  Session: IdeSession;
  VariableType: typeof VariableType;
  i18n: any;
  plot: Plot;
}

const VariableType = {
  FIGURE: 'Figure',
  OTHERWIDGET: 'OtherWidget',
  PANDAS: 'Pandas',
  TABLE: 'Table',
  TABLEMAP: 'TableMap',
  TREETABLE: 'TreeTable',
} as const;

type VariableTypeUnion = typeof VariableType[keyof typeof VariableType];

export interface VariableDefinition<
  T extends VariableTypeUnion = VariableTypeUnion
> {
  type: T;
}

export interface IdeSession {
  getTable(name: string): Promise<Table>;
  getFigure(name: string): Promise<Figure>;
  getTreeTable(name: string): Promise<TreeTable>;
  getObject(
    definition: VariableDefinition<typeof VariableType.TABLE>
  ): Promise<Table>;
  getObject(
    definition: VariableDefinition<typeof VariableType.FIGURE>
  ): Promise<Figure>;
  getObject(
    definition: VariableDefinition<typeof VariableType.TREETABLE>
  ): Promise<TreeTable>;
  getObject(definition: VariableDefinition): Promise<unknown>;
}

export interface Evented {
  addEventListener(eventType: string, listener: EventListener): RemoverFn;
  nextEvent(eventType: string, timeoutInMillis?: number): Promise<CustomEvent>;

  hasListeners(eventType: string): boolean;
  removeEventListener(eventType: string, listener: EventListener): boolean;
}

export interface Plot {
  Figure: Figure;

  SourceType: SourceType;
  SeriesPlotStyle: SeriesPlotStyle;
  ChartType: ChartType;
  AxisType: AxisType;
  AxisPosition: AxisPosition;
  AxisFormatType: AxisFormatType;

  FigureDescriptor: FigureDescriptor;
  ChartDescriptor: ChartDescriptor;
  SeriesDescriptor: SeriesDescriptor;
  SourceDescriptor: SourceDescriptor;
}

export interface RemoverFn {
  (): void;
}

export interface EventListener {
  (event: CustomEvent): void;
}

export interface FigureDescriptor {
  title: string;
  titleFont: string;
  titleColor: string;
  isResizable: boolean;
  isDefaultTheme: boolean;
  updateInterval: number;
  rows: number;
  cols: number;
  charts: ChartDescriptor[];
}
export interface ChartDescriptor {
  rowspan: number;
  colspan: number;
  series: SeriesDescriptor[];
  axes: AxisDescriptor[];
  chartType: string;
  title: string;
  titleFont: string;
  titleColor: string;
  showLegend: boolean;
  legendFont: string;
  legendColor: string;
  is3d: boolean;
}
export interface SeriesDescriptor {
  plotStyle: string;
  name: string;
  linesVisible: boolean;
  shapesVisible: boolean;
  gradientVisible: boolean;
  lineColor: string;
  pointLabelFormat: string;
  xToolTipPattern: string;
  yToolTipPattern: string;
  shapeLabel: string;
  shapeSize: number;
  shapeColor: string;
  shape: string;
}
export interface SourceDescriptor {
  axis: AxisDescriptor;
  table: Table;
  columnName: string;
  columnType: string;
}
export interface AxisDescriptor {
  formatType: string;
  type: string;
  position: string;
  log: boolean;
  label: string;
  labelFont: string;
  ticksFont: string;
  formatPattern: string;
  color: string;
  minRange: number;
  maxRange: number;
  minorTicksVisible: boolean;
  majorTicksVisible: boolean;
  minorTickCount: number;
  gapBetweenMajorTicks: number;
  tickLabelAngle: number;
  invert: boolean;
  isTimeAxis: boolean;
}
export interface Figure extends Evented {
  readonly EVENT_UPDATED: string;
  readonly EVENT_DISCONNECT: string;
  readonly EVENT_RECONNECT: string;
  readonly EVENT_RECONNECTFAILED: string;
  readonly EVENT_DOWNSAMPLESTARTED: string;
  readonly EVENT_DOWNSAMPLEFINISHED: string;
  readonly EVENT_DOWNSAMPLEFAILED: string;
  readonly EVENT_DOWNSAMPLENEEDED: string;

  /** Given a client-created figure descriptor, generate a figure that can be subscribed to */
  create(figure: FigureDescriptor): Figure;

  readonly title: string;
  readonly titleFont: string;
  readonly titleColor: string;
  readonly isResizable: boolean;
  readonly isDefaultTheme: boolean;
  readonly updateInterval: number;
  readonly cols: number;
  readonly rows: number;
  readonly charts: Chart[];

  /**
   * Subscribes to all series in this figure.
   * @param forceDisableDownsample optional, can be specified to force downsampling to be disabled
   */
  subscribe(forceDisableDownsample?: DownsampleOptions): void;

  /**
   * Unsubscribes to all series in this figure.
   */
  unsubscribe(): void;
}

export interface FigureDataUpdatedEvent {
  /**
   * The series instances which were affected by this event and need to be updated.
   */
  readonly series: Series[];

  /**
   * Reads data out for this series from the event which just occurred for the given series.
   * The array returned by this method will be cached and reused to minimize the garbage
   * created, and to reduce processing time in handling updates.
   *
   * The pattern when using this is to iterate over the series which this event affects, and
   * for each series, iterate over each source. For each series+source, pass them in, along
   * with the optional mapping function, and get back the array of data across the entire plot.
   *
   * @param series
   * @param sourceType
   * @param mapFn
   */
  getArray<I, O>(
    series: Series,
    sourceType: SourceType,
    mapFn?: MapFn<I, O>
  ): O[];
}

export interface MapFn<I, O> {
  (input: I): O;
}

export interface DownsampleOptions {
  readonly DEFAULT: DownsampleOptions;
  readonly DISABLE: DownsampleOptions;
}

export interface SourceType {
  readonly X: SourceType;
  readonly Y: SourceType;
  readonly Z: SourceType;
  readonly X_LOW: SourceType;
  readonly X_HIGH: SourceType;
  readonly Y_LOW: SourceType;
  readonly Y_HIGH: SourceType;
  readonly TIME: SourceType;
  readonly OPEN: SourceType;
  readonly HIGH: SourceType;
  readonly LOW: SourceType;
  readonly CLOSE: SourceType;
  readonly SHAPE: SourceType;
  readonly SIZE: SourceType;
  readonly LABEL: SourceType;
  readonly COLOR: SourceType;
}
export interface ChartType {
  readonly XY: ChartType;
  readonly PIE: ChartType;
  readonly OHLC: ChartType;
  readonly CATEGORY: ChartType;
  readonly XYZ: ChartType;
  readonly CATEGORY_3D: ChartType;
}
export interface SeriesPlotStyle {
  readonly BAR: SeriesPlotStyle;
  readonly STACKED_BAR: SeriesPlotStyle;
  readonly LINE: SeriesPlotStyle;
  readonly AREA: SeriesPlotStyle;
  readonly STACKED_AREA: SeriesPlotStyle;
  readonly PIE: SeriesPlotStyle;
  readonly HISTOGRAM: SeriesPlotStyle;
  readonly OHLC: SeriesPlotStyle;
  readonly SCATTER: SeriesPlotStyle;
  readonly STEP: SeriesPlotStyle;
  readonly ERROR_BAR: SeriesPlotStyle;
}
export interface AxisFormatType {
  readonly CATEGORY: AxisFormatType;
  readonly NUMBER: AxisFormatType;
}
export interface AxisType {
  readonly X: AxisType;
  readonly Y: AxisType;
  readonly Z: AxisType;
  readonly SHAPE: AxisType;
  readonly SIZE: AxisType;
  readonly LABEL: AxisType;
  readonly COLOR: AxisType;
}
export interface AxisPosition {
  readonly TOP: AxisPosition;
  readonly BOTTOM: AxisPosition;
  readonly LEFT: AxisPosition;
  readonly RIGHT: AxisPosition;
  readonly NONE: AxisPosition;
}

export interface Chart extends Evented {
  readonly EVENT_SERIES_ADDED: string;

  readonly colspan: number;
  readonly rowspan: number;
  readonly chartType: ChartType;
  readonly title: string;
  readonly titleFont: string;
  readonly titleColor: string;
  readonly isShowLegend: boolean;
  readonly legendFont: string;
  readonly legendColor: string;
  readonly is3d: boolean;
  readonly series: Series[];
  readonly multiSeries: MultiSeries[];
  readonly axes: Axis[];
}

export interface Series {
  readonly plotStyle: SeriesPlotStyle;
  readonly name: string;
  readonly isLinesVisible: boolean;
  readonly isShapesVisible: boolean;
  readonly isGradientVisible: boolean;
  readonly lineColor: string;
  readonly pointLabelFormat: string;
  readonly xToolTipPattern: string;
  readonly yToolTipPattern: string;
  readonly shapeLabel: string;
  readonly shapeSize: number;
  readonly shape: string;
  readonly sources: SeriesDataSource[];
  readonly multiSeries: MultiSeries;
  readonly oneClick: OneClick;

  subscribe(downsampleOptions?: DownsampleOptions): void;
  unsubscribe(): void;
}

export interface MultiSeries {
  readonly plotStyle: SeriesPlotStyle;
  readonly name: string;
}

export interface Axis {
  readonly id: string;
  readonly formatType: AxisFormatType;
  readonly type: AxisType;
  readonly position: AxisPosition;
  readonly isLog: boolean;
  readonly label: string;
  readonly labelFont: string;
  readonly ticksFont: string;
  readonly formatPattern: string;
  readonly minRange: number;
  readonly maxRange: number;
  readonly isMinorTicksVisible: boolean;
  readonly isMajorTicksVisible: boolean;
  readonly minorTickCount: number;
  readonly gapBetweenMajorTicks: number;
  readonly majorTickLocations: number[];
  readonly tickLabelAngle: number;
  readonly isInvert: boolean;
  readonly isTimeAxis: boolean;

  /**
   * Indicate the density and range of data that the UI needs for this axis, across any series which
   * draws on this axis. Ignored for non-time series data, for non-line series.
   * @param pixelCount the approx number of pixels wide
   * @param min the optional minimum value visible on this axis - even if specified, smaller values may
   * be returned, to ensure that lines drawn off the screen.
   * @param max the optional max value visible on this axis. If min is specified, max is also expected.
   */
  range(pixelCount?: number, min?: any, max?: any): void;
}

export interface SeriesDataSource {
  readonly axis: Axis;
  readonly type: SourceType;
  readonly columnName: string;
}

export interface OneClick {
  readonly columns: { name: string; type: string }[];
  readonly isRequireAllFiltersToDisplay: boolean;

  setValueForColumn(columnName: string, value: any): void;
  getValueForColumn(columnName: string): any;
}

export interface Column {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly constituentType: string;

  readonly isPartitionColumn: boolean;

  filter(): FilterValue;
  sort(): Sort;
}
export interface FilterValue {
  ofString(input: object): FilterValue;
  ofNumber(input: number): FilterValue;
  ofNumber(input: LongWrapper): FilterValue;
  ofNumber(input: object): FilterValue;
  ofBoolean(input: boolean): FilterValue;

  eq(value: FilterValue): FilterCondition;
  eqIgnoreCase(value: FilterValue): FilterCondition;
  notEq(value: FilterValue): FilterCondition;
  notEqIgnoreCase(value: FilterValue): FilterCondition;
  greaterThan(value: FilterValue): FilterCondition;
  lessThan(value: FilterValue): FilterCondition;
  greaterThanOrEqualTo(value: FilterValue): FilterCondition;
  lessThanOrEqualTo(value: FilterValue): FilterCondition;
  inIgnoreCase(value: FilterValue): FilterCondition;
  notIn(value: FilterValue): FilterCondition;
  notInIgnoreCase(value: FilterValue): FilterCondition;
  contains(value: FilterValue): FilterCondition;
  isFalse(): FilterCondition;
  isTrue(): FilterCondition;
  isNull(): FilterCondition;
  invoke(method: string, ...args: FilterValue[]): FilterCondition;
}
export interface FilterCondition {
  invoke(method: string, ...args: FilterValue[]): FilterCondition;
  search(value: FilterValue, columns?: FilterValue[]): FilterCondition;

  not(): FilterCondition;
  and(first: FilterCondition, ...rest: FilterCondition[]): FilterCondition;
  or(first: FilterCondition, ...rest: FilterCondition[]): FilterCondition;

  toString(): string;
  // columns: Column[] //doesnt work
}
export interface Sort {
  reverse(): Sort;

  readonly column: Column;
  readonly direction: string;

  readonly isAbs: boolean;

  asc(): Sort;
  desc(): Sort;
  abs(): Sort;
}
export interface Table extends Evented {
  readonly EVENT_SIZECHANGED: string;
  readonly EVENT_UPDATED: string;
  readonly EVENT_ROWADDED: string;
  readonly EVENT_ROWREMOVED: string;
  readonly EVENT_ROWUPDATED: string;
  readonly EVENT_SORTCHANGED: string;
  readonly EVENT_FILTERCHANGED: string;
  readonly EVENT_CUSTOMCOLUMNSCHANGED: string;
  readonly EVENT_DISCONNECT: string;
  readonly EVENT_RECONNECT: string;
  readonly EVENT_RECONNECTFAILED: string;

  readonly SIZE_UNCOALESCED: number;

  reverse(): Sort;
  readonly size: number;

  readonly columns: Column[];
  readonly description: string;

  readonly sort: Sort[];
  readonly filter: FilterCondition[];
  readonly customColumns: string[];

  readonly isUncoalesced: boolean;
  readonly hasInputTable: boolean;

  readonly totalsTableConfig: TotalsTableConfig;

  findColumn(name: string): Column;
  findColumns(names: string[]): Column[];

  applySort(sorts: Sort[]): Sort[];
  applyFilter(filters: FilterCondition[]): FilterCondition[];
  applyCustomColumns(columns: string[]): string[];

  setViewport(
    firstRow: number,
    lastRow: number,
    columns?: Column[],
    updateIntervalMs?: number
  ): TableViewportSubscription;
  getViewportData(): Promise<TableData>;

  subscribe(columns: Column[]): TableSubscription;
  // inputTable(): Promise<InputTable>

  selectDistinct(columns: Column[]): Promise<Table>;
  copy(): Promise<Table>;

  getTotalsTable(config?: TotalsTableConfig): Promise<TotalsTable>;
  getGrandTotalsTable(config?: TotalsTableConfig): Promise<TotalsTable>;

  rollup(config: RollupConfig): Promise<TreeTable>;
  treeTable(config: TreeTableConfig): Promise<TreeTable>;

  close(): void;
  readonly isClosed: boolean;

  freeze(): Promise<Table>;

  snapshot(
    rightHandSide: Table,
    doInitialSnapshot?: boolean,
    stampColumns?: string[]
  ): Promise<Table>;

  getColumnStatistics(column: Column): ColumnStatistics;

  join(
    joinType: string,
    rightTable: Table,
    columnsToMatch: string[],
    columnsToAdd?: string[]
  ): Promise<Table>;
  byExternal(keys: string[], dropKeys?: boolean): Promise<TableMap>;
}

export interface TableViewportSubscription extends Evented {
  setViewport(firstRow: number, lastRow: number, columns?: Column[]): void;
  getViewportData(): Promise<TableData>;
  snapshot(rows: RangeSet, columns: Column[]): Promise<TableData>;
  close(): void;
}

export interface TableSubscription extends Evented {
  readonly EVENT_UPDATED: string;

  readonly columns: Column[];
  close(): void;
}

export interface RangeSet {
  ofRange(first: number, last: number): RangeSet;
  ofItems(rows: number[]): RangeSet;
  ofRanges(ranges: RangeSet[]): RangeSet;

  readonly size: number;
  iterator(): Iterator<LongWrapper>;
}

export interface LongWrapper {
  asNumber(): number;
  valueOf(): string;
  toString(): string;
}
export interface DateWrapper extends LongWrapper {
  ofJsDate(date: Date): DateWrapper;
  asDate(): Date;
}

export interface TableData {
  readonly columns: Column[];
  readonly rows: Row[];

  get(index: number): Row;
  get(index: LongWrapper): Row;

  getData(index: number, column: Column): any;
  getData(index: LongWrapper, column: Column): any;

  getFormat(index: number, column: Column): Format;
  getFormat(index: LongWrapper, column: Column): Format;
}

export interface Row {
  readonly index: LongWrapper;

  get(column: Column): any;

  getFormat(column: Column): any;
}

export interface Format {
  readonly color: string;
  readonly backgroundColor: string;
  readonly formatString: string;
}

export interface ColumnStatistics {
  readonly statisticsMap: Map<string, number>;
  readonly uniqueValues: Map<string, number>;

  getType(name: string): string;
}

export interface TreeTable extends Evented {
  readonly EVENT_UPDATED: string;
  readonly EVENT_DISCONNECT: string;
  readonly EVENT_RECONNECT: string;
  readonly EVENT_RECONNECTFAILED: string;

  readonly size: number;

  readonly columns: Column[];

  readonly sort: Sort[];
  readonly filter: FilterCondition[];

  readonly totalsTableConfig: TotalsTableConfig;

  findColumn(name: string): Column;
  findColumns(names: string[]): Column[];

  expand(row: number): void;
  expand(row: TreeRow): void;
  collapse(row: number): void;
  collapse(row: TreeRow): void;
  setExpanded(row: number, isExpanded: boolean): void;
  setExpanded(row: TreeRow, isExpanded: boolean): void;
  isExpanded(row: number): boolean;
  isExpanded(row: TreeRow): boolean;

  applySort(sorts: Sort[]): Sort[];
  applyFilter(filters: FilterCondition[]): FilterCondition[];

  selectDistict(columns: Column[]): Promise<Table>;

  getTotalsTable(config?: TotalsTableConfig): Promise<TotalsTable>;
  getGrandTotalsTable(config?: TotalsTableConfig): Promise<TotalsTable>;

  setViewport(): void;
  getViewportData(): Promise<TreeTableData>;

  saveExpandedState(): string;
  restoreExpandedState(nodesToRestore: string): void;

  close(): void;
}
export interface TreeTableData extends TableData {
  readonly rows: TreeRow[];
}
export interface TreeRow extends Row {
  readonly isExpanded: boolean;
  readonly hasChildren: boolean;
  readonly depth: number;
}

export interface RollupConfig {}
export interface TreeTableConfig {}

export interface TotalsTableConfig {}
export interface TotalsTable extends Evented {
  readonly size: number;
  readonly column: Column[];

  readonly sort: Sort[];
  readonly filter: FilterCondition[];
  readonly customColumns: string[];

  readonly totalsTableConfig: TotalsTableConfig;

  applySort(sorts: Sort[]): Sort[];
  applyFilter(filters: FilterCondition[]): FilterCondition[];
  applyCustomColumns(columns: string[]): string[];

  setViewport(
    firstRow: number,
    lastRow: number,
    columns?: Column[],
    updateIntervalMs?: number
  ): void;
  getViewportData(): Promise<TableData>;

  close(): void;
}

export interface TableMap extends Evented {
  readonly size: number;
  close(): void;
  getKeys(): Promise<Set<object>>;
  getTable(key: object): Promise<Table>;
}

export interface QueryConnectable extends Evented {
  getConsoleTypes(): Promise<string[]>;
  startSession(type: string): Promise<IdeSession>;
}

export interface IdeConnectionOptions {
  authoToken?: string;
  serviceId?: string;
}

export interface IdeConnectionConstructor {
  new (serverUrl: string, options?: IdeConnectionOptions): IdeConnection;
}

export interface IdeConnection
  extends QueryConnectable,
    IdeConnectionConstructor {
  close(): void;
  getServerUrl(): string;
  running(): Promise<IdeConnection>;
  disconnected(): void;
}
