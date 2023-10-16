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
  i18n: {
    DateTimeFormat: DateTimeFormat;
    NumberFormat: NumberFormat;
    TimeZone: i18nTimeZone;
  };
  DateWrapper: DateWrapper;
  LongWrapper: LongWrapper;
  FilterCondition: FilterConditionStatic;
  FilterValue: FilterValueStatic;
  plot: Plot;
  Axis: Axis;
  Table: TableStatic;
  Client: ClientStatic;
  TreeTable: TreeTableStatic;
  Column: Column;
  SearchDisplayMode?: SearchDisplayModeStatic;
  RangeSet: RangeSet;
  IdeSession: IdeSessionStatic;
  calendar: CalendarStatic;
  CoreClient: CoreClientContructor;
  storage: {
    FileContents: FileContentsStatic;
  };
  ValueType: typeof ValueType;
}

const VariableType = {
  FIGURE: 'Figure',
  OTHERWIDGET: 'OtherWidget',
  PANDAS: 'Pandas',
  TABLE: 'Table',
  TABLEMAP: 'TableMap',
  TREETABLE: 'TreeTable',
  HIERARCHICALTABLE: 'HierarchicalTable',
  PARTITIONEDTABLE: 'PartitionedTable',
} as const;

const ValueType = {
  STRING: 'String',
  NUMBER: 'Number',
  DOUBLE: 'Double',
  LONG: 'Long',
  DATETIME: 'Datetime',
  BOOLEAN: 'Boolean',
} as const;

export type ValueTypeUnion = (typeof ValueType)[keyof typeof ValueType];

export interface CalendarStatic {
  DayOfWeek: { values: () => string[] };
}

/**
 * @deprecated
 * Used to be a string union, but it can really be any string
 */
export type VariableTypeUnion = string;

export interface VariableDefinition<T extends string = string> {
  type: T;

  /**
   * @deprecated
   */
  name?: string;

  title?: string;

  id?: string;
}

export interface JsWidget extends Evented {
  getDataAsBase64: () => string;
  getDataAsU8: () => Uint8Array;
  getDataAsString: () => string;
  exportedObjects: {
    fetch: () => Promise<Table | Figure | TreeTable | JsWidget>;
  }[];
  sendMessage: (
    message: string | ArrayBuffer | ArrayBufferView,
    references?: unknown[]
  ) => void;
  close: () => void;
}

export interface LogItem {
  micros: number;
  logLevel: string;
  message: string;
}

export interface VariableChanges {
  created: VariableDefinition[];
  updated: VariableDefinition[];
  removed: VariableDefinition[];
}

export interface CommandResult {
  changes: VariableChanges;
  error: string;
}

export interface Position {
  line: number;
  character: number;
}

export interface DocumentRange {
  start: Position;
  end: Position;
}

export interface TextEdit {
  text: string;
  range: DocumentRange;
}

export interface MarkupContent {
  value: string;
  kind: 'markdown' | 'plaintext';
}

export interface CompletionItem {
  label: string;
  kind: number;
  detail: string;
  documentation: MarkupContent;
  sortText: string;
  filterText: string;
  textEdit: TextEdit;
  insertTextFormat: number;
}

export interface ParameterInfo {
  label: string;
  documentation: string;
}

export interface SignatureInfo {
  label: string;
  documentation?: MarkupContent;
  parameters?: ParameterInfo[];
  activeParameter: number;
}

export interface Hover {
  contents?: MarkupContent;
  range?: DocumentRange;
}

export interface IdeSessionStatic {
  EVENT_COMMANDSTARTED: 'commandstarted';
}

export interface WorkerConnection {
  subscribeToFieldUpdates(
    param: (changes: VariableChanges) => void
  ): () => void;
}

export interface IdeSession extends Evented {
  subscribeToFieldUpdates(
    param: (changes: VariableChanges) => void
  ): () => void;
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
  getObject(
    definition: VariableDefinition<typeof VariableType.HIERARCHICALTABLE>
  ): Promise<TreeTable>;
  getObject(definition: VariableDefinition): Promise<unknown>;
  onLogMessage(logHandler: (logItem: LogItem) => void): () => void;
  runCode(code: string): Promise<CommandResult>;
  bindTableToVariable(table: Table, variableName: string): Promise<void>;
  mergeTables(tables: Table[]): Promise<Table>;
  newTable(
    columnNames: string[],
    columnTypes: string[],
    data: string[][],
    userTimeZone: string
  ): Promise<Table>;
  getCompletionItems(params: unknown): Promise<CompletionItem[]>;
  getSignatureHelp?(params: unknown): Promise<SignatureInfo[]>;
  getHover?(params: unknown): Promise<Hover>;
  closeDocument(params: unknown): void;
  openDocument(params: unknown): void;
  changeDocument(params: unknown): void;
  close(): void;
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
  DownsampleOptions: DownsampleOptions;

  ChartData: typeof ChartData;
}

export interface RemoverFn {
  (): void;
}

export interface EventListener {
  (event: CustomEvent): void;
}

export interface FigureDescriptor {
  title: string;
  titleFont?: string;
  titleColor?: string;
  isResizable?: boolean;
  isDefaultTheme?: boolean;
  updateInterval?: number;
  rows?: number;
  cols?: number;
  charts: Partial<ChartDescriptor>[];
}
export interface ChartDescriptor {
  rowspan?: number;
  colspan?: number;
  series: Partial<SeriesDescriptor>[];
  axes: Partial<AxisDescriptor>[];
  chartType: string;
  title?: string;
  titleFont?: string;
  titleColor?: string;
  showLegend?: boolean;
  legendFont?: string;
  legendColor?: string;
  is3d?: boolean;
}
export interface SeriesDescriptor {
  plotStyle: string;
  name: string;
  linesVisible?: boolean;
  shapesVisible?: boolean;
  gradientVisible?: boolean;
  lineColor?: string;
  pointLabelFormat?: string;
  xToolTipPattern?: string;
  yToolTipPattern?: string;
  shapeLabel?: string;
  shapeSize?: number;
  shapeColor?: string;
  shape?: string;
}
export interface SourceDescriptor {
  axis?: AxisDescriptor;
  table: Table;
  columnName: string;
  columnType: string;
}
export interface AxisDescriptor {
  formatType: string;
  type: string;
  position: string;
  log?: boolean;
  label?: string;
  labelFont?: string;
  ticksFont?: string;
  formatPattern?: string;
  color?: string;
  minRange?: number;
  maxRange?: number;
  minorTicksVisible?: boolean;
  majorTicksVisible?: boolean;
  minorTickCount?: number;
  gapBetweenMajorTicks?: number;
  tickLabelAngle?: number;
  invert?: boolean;
  isTimeAxis?: boolean;
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
  readonly EVENT_SERIES_ADDED: string;

  /** Given a client-created figure descriptor, generate a figure that can be subscribed to */
  create(figure: Partial<FigureDescriptor>): Promise<Figure>;

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

  close(): void;
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
  readonly PARENT: SourceType;
  readonly HOVER_TEXT: SourceType;
  readonly TEXT: SourceType;
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
  readonly TREEMAP: SeriesPlotStyle;
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

  readonly row: number;
  readonly column: number;
  readonly colspan: number;
  readonly rowspan: number;
  readonly chartType: ChartType;
  readonly title: string;
  readonly titleFont: string;
  readonly titleColor: string;
  readonly showLegend: boolean;
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
  readonly isLinesVisible: boolean | null;
  readonly isShapesVisible: boolean | null;
  readonly isGradientVisible: boolean;
  readonly lineColor: string;
  readonly pointLabelFormat: string;
  readonly xToolTipPattern: string;
  readonly yToolTipPattern: string;
  readonly shapeLabel: string;
  readonly shapeSize: number;
  readonly shape: string;
  readonly shapeColor: string;
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

export interface BusinessPeriod {
  open: string;
  close: string;
}

export interface LocalDateWrapper {
  toString: () => string;
}
export interface Holiday {
  date: LocalDateWrapper;
  businessPeriods: BusinessPeriod[];
}

export interface BusinessCalendar {
  getName: () => string;
  timeZone: TimeZone;
  businessPeriods: BusinessPeriod[];
  businessDays: string[];
  holidays: Holiday[];
}

export interface Axis {
  readonly id: string;
  readonly formatType: AxisFormatType;
  readonly type: AxisType;
  readonly position: AxisPosition;
  readonly log: boolean;
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

  readonly FORMAT_TYPE_NUMBER: unknown;
  readonly businessCalendar: BusinessCalendar;

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
  readonly columnType: string;
}

export interface OneClick {
  readonly columns: { name: string; type: string }[];
  readonly requireAllFiltersToDisplay: boolean;

  setValueForColumn(columnName: string, value: any): void;
  getValueForColumn(columnName: string): any;
}

export interface Column {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly constituentType: string;

  readonly isPartitionColumn: boolean;
  readonly isSortable?: boolean;

  filter(): FilterValue;
  sort(): Sort;

  formatColor(expression: string): CustomColumn;
  formatRowColor(expression: string): CustomColumn;
}

export interface CustomColumn {
  readonly type: string;
  readonly name: string;
  readonly expression: string;
}

export interface FilterValueStatic {
  ofString(input: unknown): FilterValue;
  ofNumber(input: unknown): FilterValue;
  ofBoolean(input: unknown): FilterValue;
}
export interface FilterValue {
  eq(value: FilterValue): FilterCondition;
  eqIgnoreCase(value: FilterValue): FilterCondition;
  notEq(value: FilterValue): FilterCondition;
  notEqIgnoreCase(value: FilterValue): FilterCondition;
  greaterThan(value: FilterValue): FilterCondition;
  lessThan(value: FilterValue): FilterCondition;
  greaterThanOrEqualTo(value: FilterValue): FilterCondition;
  lessThanOrEqualTo(value: FilterValue): FilterCondition;
  in(values: FilterValue[]): FilterCondition;
  inIgnoreCase(values: FilterValue[]): FilterCondition;
  notIn(values: FilterValue[]): FilterCondition;
  notInIgnoreCase(values: FilterValue[]): FilterCondition;
  contains(value: FilterValue): FilterCondition;
  containsIgnoreCase(value: FilterValue): FilterCondition;
  isFalse(): FilterCondition;
  isTrue(): FilterCondition;
  isNull(): FilterCondition;
  invoke(method: string, ...args: FilterValue[]): FilterCondition;
  matches(value: FilterValue): FilterCondition;
  matchesIgnoreCase(value: FilterValue): FilterCondition;
}

export interface FilterConditionStatic {
  invoke(method: string, ...args: FilterValue[]): FilterCondition;
  search(value: FilterValue, columns?: FilterValue[]): FilterCondition;
}
export interface FilterCondition {
  not(): FilterCondition;
  and(first: FilterCondition, ...rest: FilterCondition[]): FilterCondition;
  or(first: FilterCondition, ...rest: FilterCondition[]): FilterCondition;

  toString(): string;
}
export interface Sort {
  reverse(): Sort;

  readonly column: Column;
  readonly direction: 'ASC' | 'DESC' | 'REVERSE' | null;

  readonly isAbs: boolean;

  asc(): Sort;
  desc(): Sort;
  abs(): Sort;
}

export interface InputTable {
  keys: string[];
  keyColumns: Column[];
  values: string[];
  valueColumns: Column[];
  addRow(
    row: Record<string, unknown>,
    userTimeZone?: string
  ): Promise<InputTable>;
  addRows(
    rows: Record<string, unknown>[],
    userTimeZone?: string
  ): Promise<InputTable>;
  addTable(table: Table): Promise<InputTable>;
  addTables(tables: Table[]): Promise<InputTable>;
  deleteTable(table: Table): Promise<InputTable>;
  deleteTables(tables: Table[]): Promise<InputTable>;
  table: Table;
}
export interface ColumnGroup {
  name: string;
  children: string[];
  color?: string;
}

export interface LayoutHints {
  areSavedLayoutsAllowed?: boolean;
  frontColumns?: string[];
  backColumns?: string[];
  hiddenColumns?: string[];
  frozenColumns?: string[];
  columnGroups?: ColumnGroup[];
  searchDisplayMode?: keyof SearchDisplayModeStatic;
}

export interface SearchDisplayModeStatic {
  SEARCH_DISPLAY_DEFAULT: 'Default';
  SEARCH_DISPLAY_HIDE: 'Hide';
  SEARCH_DISPLAY_SHOW: 'Show';
}

export interface TableStatic {
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
}

export interface ClientStatic {
  readonly EVENT_REQUEST_FAILED: 'requestfailed';
  readonly EVENT_REQUEST_STARTED: 'requeststarted';
  readonly EVENT_REQUEST_SUCCEEDED: 'requestsucceeded';
}
export interface Table extends TableTemplate<Table>, TableStatic {
  readonly totalSize: number;

  readonly description: string;

  customColumns: string[];

  readonly layoutHints: LayoutHints;

  readonly isUncoalesced: boolean;
  readonly hasInputTable: boolean;

  readonly isClosed: boolean;
  readonly pluginName: string;

  applyCustomColumns(columns: (CustomColumn | string)[]): string[];

  getViewportData(): Promise<TableData>;

  subscribe(columns: Column[]): TableSubscription;

  selectDistinct(columns: Column[]): Promise<Table>;
  copy(): Promise<Table>;

  rollup(config: RollupConfig): Promise<TreeTable>;
  treeTable(config: TreeTableConfig): Promise<TreeTable>;

  inputTable(): Promise<InputTable>;

  freeze(): Promise<Table>;

  snapshot(
    rightHandSide: Table,
    doInitialSnapshot?: boolean,
    stampColumns?: string[]
  ): Promise<Table>;

  getColumnStatistics(column: Column): Promise<ColumnStatistics>;

  join(
    joinType: string,
    rightTable: Table,
    columnsToMatch: string[],
    columnsToAdd?: string[]
  ): Promise<Table>;
  byExternal(keys: string[], dropKeys?: boolean): Promise<TableMap>;

  fireViewportUpdate(): void;

  seekRow(
    startRow: number,
    column: Column,
    valueType: ValueTypeUnion,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number>;
}

export interface TableViewportSubscription extends Evented {
  setViewport(firstRow: number, lastRow: number, columns?: Column[]): void;
  getViewportData(): Promise<TableData>;
  snapshot(rows: RangeSet, columns: readonly Column[]): Promise<TableData>;
  close(): void;
}

export interface ViewportData {
  offset: number;
  rows: Row[];
  columns: Column[];
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
  iterator(): JsIterator<LongWrapper>;
}

export interface JsIterator<T> {
  hasNext(): boolean;
  next(): IteratorResult<T>;
}

export interface LongWrapper {
  asNumber(): number;
  valueOf(): string;
  toString(): string;
  ofString(str: string): LongWrapper;
}
export interface DateWrapper extends LongWrapper {
  ofJsDate(date: Date): DateWrapper;
  asDate(): Date;
}

export interface TimeZone {
  adjustments: number[];
  standardOffset: number;
  timeZoneID: string;
  id: string;
  transitionPoints: number[];
  tzNames: string[];
}

export interface i18nTimeZone {
  getTimeZone(tzCode: string): TimeZone;
}

export interface DateTimeFormat {
  format(
    pattern: string,
    date: DateWrapper | Date | number,
    timeZone?: TimeZone
  ): string;
  parse(pattern: string, text: string, timeZone?: TimeZone): DateWrapper;
  parseAsDate(pattern: string, text: string): Date;
}

export interface NumberFormat {
  format(pattern: string, number: number): string;
  parse(pattern: string, text: string): number;
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

export interface UpdateEventData extends TableData {
  readonly added: RangeSet;
  readonly removed: RangeSet;
  readonly modified: RangeSet;
  readonly fullIndex: RangeSet;
}

export interface Row {
  readonly index: LongWrapper;

  get(column: Column): any;

  getFormat(column: Column): Format;
}

export interface Format {
  readonly color: string;
  readonly backgroundColor: string;
  readonly formatString: string;
  readonly formatDataBar: DatabarFormat;
}

export interface DatabarFormat {
  axis: string;
  direction: string;
  max: number;
  min: number;
  negativeColor: string | string[];
  opacity: number;
  positiveColor: string | string[];
  valuePlacement: string;
  value: number;
  marker: number;
  markerColor: string | string[];
}

export interface ColumnStatistics {
  readonly statisticsMap: Map<string, number>;
  readonly uniqueValues: Map<string, number>;

  getType(name: string): string;
}

export interface TreeTableStatic {
  readonly EVENT_UPDATED: string;
  readonly EVENT_DISCONNECT: string;
  readonly EVENT_RECONNECT: string;
  readonly EVENT_RECONNECTFAILED: string;
}

export interface TableTemplate<T = Table> extends Evented {
  readonly size: number;
  readonly columns: Column[];
  readonly sort: Sort[];
  readonly filter: FilterCondition[];
  readonly totalsTableConfig: TotalsTableConfig;

  findColumn(name: string): Column;
  findColumns(names: string[]): Column[];

  applySort(sorts: Sort[]): Sort[];
  applyFilter(filters: FilterCondition[]): FilterCondition[];
  selectDistinct(columns: Column[]): Promise<Table>;

  getTotalsTable(config?: TotalsTableConfig): Promise<TotalsTable>;
  getGrandTotalsTable(config?: TotalsTableConfig): Promise<TotalsTable>;

  setViewport(
    firstRow: number,
    lastRow: number,
    columns?: Column[],
    updateIntervalMs?: number
  ): TableViewportSubscription;

  copy(): Promise<T>;
  close(): void;
}

export interface TreeTable extends TableTemplate<TreeTable>, TreeTableStatic {
  readonly isIncludeConstituents: boolean;
  readonly groupedColumns: Column[];

  expand(row: number): void;
  expand(row: TreeRow): void;
  collapse(row: number): void;
  collapse(row: TreeRow): void;
  setExpanded(
    row: number,
    isExpanded: boolean,
    expandDescendants?: boolean
  ): void;
  setExpanded(
    row: TreeRow,
    isExpanded: boolean,
    expandDescendants?: boolean
  ): void;
  expandAll?(): void;
  collapseAll?(): void;
  isExpanded(row: number): boolean;
  isExpanded(row: TreeRow): boolean;

  getViewportData(): Promise<TreeTableData>;

  saveExpandedState(): string;
  restoreExpandedState(nodesToRestore: string): void;
}
export interface TreeTableData extends TableData {
  readonly rows: TreeRow[];
}
export interface TreeRow extends Row {
  readonly isExpanded: boolean;
  readonly hasChildren: boolean;
  readonly depth: number;
}

export interface RollupConfig {
  groupingColumns: string[] | null;
  aggregations: Record<string, readonly string[]> | null;
  includeConstituents: boolean;
  includeOriginalColumns?: boolean;
  includeDescriptions: boolean;
}

export interface TreeTableConfig {}

export interface TotalsTableConfig {
  showTotalsByDefault?: boolean;
  showGrandTotalsByDefault?: boolean;
  defaultOperation?: string;
  groupBy?: readonly string[];
  operationMap: Record<string, readonly string[]>;
}

export interface TotalsTable extends Evented {
  readonly size: number;
  readonly columns: Column[];

  readonly sort: Sort[];
  readonly filter: FilterCondition[];
  customColumns: string[];

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

export interface WorkerHeapInfo {
  readonly maximumHeapSize: number;
  readonly freeMemory: number;
  readonly totalHeapSize: number;
}

export interface QueryConnectable extends Evented {
  getWorkerHeapInfo(): Promise<WorkerHeapInfo>;
  getConsoleTypes(): Promise<string[]>;
  startSession(type: string): Promise<IdeSession>;
}

export interface IdeConnectionOptions {
  authoToken?: string;
  serviceId?: string;
}

export interface IdeConnectionConstructor {
  /** @deprecated Use EVENT_DISCONNECT and EVENT_RECONNECT instead */
  HACK_CONNECTION_FAILURE: string;
  EVENT_DISCONNECT: string;
  EVENT_RECONNECT: string;
  EVENT_SHUTDOWN: string;

  new (serverUrl: string, options?: IdeConnectionOptions): IdeConnection;
}

export interface IdeConnection
  extends QueryConnectable,
    IdeConnectionConstructor {
  close(): void;
  running(): Promise<IdeConnection>;
  disconnected(): void;
  getObject(
    definition: VariableDefinition<typeof VariableType.TABLE>
  ): Promise<Table>;
  getObject(
    definition: VariableDefinition<typeof VariableType.FIGURE>
  ): Promise<Figure>;
  getObject(
    definition: VariableDefinition<typeof VariableType.TREETABLE>
  ): Promise<TreeTable>;
  getObject(
    definition: VariableDefinition<typeof VariableType.HIERARCHICALTABLE>
  ): Promise<TreeTable>;
  getObject(definition: VariableDefinition): Promise<unknown>;
  subscribeToFieldUpdates(
    param: (changes: VariableChanges) => void
  ): () => void;
}

export interface ItemDetails {
  filename: string;
  basename: string;
  dirname: string;
  type: 'directory' | 'file';
  size: number;
  etag?: string;
}

export interface FileContentsStatic {
  blob(blob: Blob): FileContents;
  text(...text: string[]): FileContents;
  arrayBuffers(...buffers: ArrayBuffer[]): FileContents;
}

export interface FileContents {
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  etag?: string;
}

export interface LoginOptions {
  type: string;
  token?: string;
}

export interface StorageService {
  listItems(path: string, glob?: string): Promise<ItemDetails[]>;
  loadFile(path: string, etag?: string): Promise<FileContents>;
  deleteItem(path: string): Promise<void>;
  saveFile(
    path: string,
    contents: FileContents,
    allowOverwrite?: boolean
  ): Promise<void>;
  moveItem(path: string, newPath: string, newFile?: boolean): Promise<void>;
  createDirectory(path: string): Promise<void>;
}

export interface ConnectOptions {
  headers?: Record<string, string>;
}

export interface CoreClientContructor extends Evented {
  EVENT_CONNECT: string;
  EVENT_DISCONNECT: string;
  EVENT_RECONNECT: string;
  EVENT_RECONNECT_AUTH_FAILED: string;
  EVENT_REFRESH_TOKEN_UPDATED: string;
  LOGIN_TYPE_ANONYMOUS: string;
  new (serverUrl: string, options?: ConnectOptions): CoreClient;
}

export interface CoreClient extends CoreClientContructor {
  login(options: LoginOptions): Promise<void>;
  getAsIdeConnection(): Promise<IdeConnection>;
  getStorageService(): StorageService;
  getServerConfigValues(): Promise<[string, string][]>;
  getAuthConfigValues(): Promise<[string, string][]>;
  disconnect(): void;
}

/**
 * Helper class to manage snapshots and deltas and keep not only a contiguous JS array of data per column in the
 * underlying table, but also support a mapping function to let client code translate data in some way for display and
 * keep that cached as well.
 */
declare class ChartData {
  constructor(table: Table);

  update(eventDetail: object): void;
  getColumn(
    columnName: string,
    mappingFunc: (input: any) => any,
    currentUpdate: TableData
  ): Array<any>;
  /**
   * Removes some column from the cache, avoiding extra computation on incoming events, and possibly freeing some
   * memory. If this pair of column name and map function are requested again, it will be recomputed from scratch.
   */
  removeColumn(columnName: string, mappingFunc: (input: any) => any): void;
}

export type { ChartData };
