/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable lines-between-class-members */

/* eslint-disable max-classes-per-file */
// export default dh;

// export interface dh {
//   IdeConnection: IdeConnectionConstructor;
//   Session: dh.IdeSession;
//   VariableType: typeof dh.VariableType;
//   i18n: {
//     DateTimeFormat: dh.i18n.DateTimeFormat;
//     NumberFormat: dh.i18n.NumberFormat;
//     TimeZone: i18nTimeZone;
//   };
//   DateWrapper: dh.DateWrapper;
//   LongWrapper: dh.LongWrapper;
//   FilterCondition: FilterConditionStatic;
//   FilterValue: FilterValueStatic;
//   plot: Plot;
//   Axis: dh.plot.Axis;
//   Table: TableStatic;
//   Client: ClientStatic;
//   TreeTable: TreeTableStatic;
//   Column: dh.Column;
//   SearchDisplayMode?: SearchDisplayModeStatic;
//   RangeSet: dh.RangeSet;
//   IdeSession: IdeSessionStatic;
//   calendar: CalendarStatic;
//   CoreClient: CoreClientContructor;
//   storage: {
//     FileContents: FileContentsStatic;
//   };
//   ValueType: typeof dh.ValueType;
//   Widget: Widget;
// }

// const dh.VariableType = {
//   FIGURE: 'Figure',
//   OTHERWIDGET: 'OtherWidget',
//   PANDAS: 'Pandas',
//   TABLE: 'Table',
//   TABLEMAP: 'TableMap',
//   TREETABLE: 'TreeTable',
//   HIERARCHICALTABLE: 'HierarchicalTable',
//   PARTITIONEDTABLE: 'PartitionedTable',
// } as const;

// const dh.ValueType = {
//   STRING: 'String',
//   NUMBER: 'Number',
//   DOUBLE: 'Double',
//   LONG: 'Long',
//   DATETIME: 'Datetime',
//   BOOLEAN: 'Boolean',
// } as const;

// export type dh.ValueTypeType = (typeof dh.ValueType)[keyof typeof dh.ValueType];

// export interface CalendarStatic {
//   DayOfWeek: { values: () => string[] };
// }

/**
 * @deprecated
 * Used to be a string union, but it can really be any string
 */
// export type dh.VariableTypeType = string;

// export interface dh.VariableDefinition<T extends string = string> {
//   type: T;

//   /**
//    * @deprecated
//    */
//   name?: string;

//   title?: string;

//   id?: string;
// }

// export interface dh.ide.LogItem {
//   micros: number;
//   logLevel: string;
//   message: string;
// }

// export interface dh.ide.VariableChanges {
//   created: dh.VariableDefinition[];
//   updated: dh.VariableDefinition[];
//   removed: dh.VariableDefinition[];
// }

// export interface dh.ide.CommandResult {
//   changes: dh.ide.VariableChanges;
//   error: string;
// }

// export interface dh.lsp.Position {
//   line: number;
//   character: number;
// }

// export interface dh.lsp.Range {
//   start: dh.lsp.Position;
//   end: dh.lsp.Position;
// }

// export interface dh.lsp.TextEdit {
//   text: string;
//   range: dh.lsp.Range;
// }

// export interface dh.lsp.MarkupContent {
//   value: string;
//   kind: 'markdown' | 'plaintext';
// }

// export interface dh.lsp.CompletionItem {
//   label: string;
//   kind: number;
//   detail: string;
//   documentation: dh.lsp.MarkupContent;
//   sortText: string;
//   filterText: string;
//   textEdit: dh.lsp.TextEdit;
//   insertTextFormat: number;
// }

// export interface dh.lsp.ParameterInformation {
//   label: string;
//   documentation: string;
// }

// export interface dh.lsp.SignatureInformation {
//   label: string;
//   documentation?: dh.lsp.MarkupContent;
//   parameters?: dh.lsp.ParameterInformation[];
//   activeParameter: number;
// }

// export interface dh.lsp.Hover {
//   contents?: dh.lsp.MarkupContent;
//   range?: dh.lsp.Range;
// }

export interface IdeSessionStatic {
  EVENT_COMMANDSTARTED: 'commandstarted';
}

// export interface WorkerConnection {
//   subscribeToFieldUpdates: (
//     param: (changes: dh.ide.VariableChanges) => void
//   ) => () => void;
// }

// export interface dh.IdeSession extends Evented {
//   subscribeToFieldUpdates: (
//     param: (changes: dh.ide.VariableChanges) => void
//   ) => () => void;
//   getTable: (name: string) => Promise<Table>;
//   getFigure: (name: string) => Promise<Figure>;
//   getTreeTable: (name: string) => Promise<TreeTable>;
//   getPartitionedTable: (name: string) => Promise<PartitionedTable>;
//   getObject: ((
//     definition: dh.VariableDefinition<typeof VariableType.TABLE>
//   ) => Promise<Table>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.FIGURE>
//     ) => Promise<Figure>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.TREETABLE>
//     ) => Promise<TreeTable>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.HIERARCHICALTABLE>
//     ) => Promise<TreeTable>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.PARTITIONEDTABLE>
//     ) => Promise<PartitionedTable>) &
//     ((definition: dh.VariableDefinition) => Promise<unknown>);
//   onLogMessage: (logHandler: (logItem: dh.ide.LogItem) => void) => () => void;
//   runCode: (code: string) => Promise<dh.ide.CommandResult>;
//   bindTableToVariable: (table: Table, variableName: string) => Promise<void>;
//   mergeTables: (tables: Table[]) => Promise<Table>;
//   newTable: (
//     columnNames: string[],
//     columnTypes: string[],
//     data: string[][],
//     userTimeZone: string
//   ) => Promise<Table>;
//   getCompletionItems: (params: unknown) => Promise<dh.lsp.CompletionItem[]>;
//   getSignatureHelp?: (params: unknown) => Promise<dh.lsp.SignatureInformation[]>;
//   getHover?: (params: unknown) => Promise<dh.lsp.Hover>;
//   closeDocument: (params: unknown) => void;
//   openDocument: (params: unknown) => void;
//   changeDocument: (params: unknown) => void;
//   close: () => void;
// }

// export interface dh.HasEventHandling {
//   addEventListener: <T>(
//     eventType: string,
//     listener: EventListener<T>
//   ) => RemoverFn;
//   nextEvent: (
//     eventType: string,
//     timeoutInMillis?: number
//   ) => Promise<CustomEvent>;

//   hasListeners: (eventType: string) => boolean;
//   removeEventListener: <T>(
//     eventType: string,
//     listener: EventListener<T>
//   ) => boolean;
// }

// export interface Plot {
//   Figure: Figure;

//   SourceType: SourceType;
//   SeriesPlotStyle: SeriesPlotStyle;
//   ChartType: ChartType;
//   AxisType: AxisType;
//   AxisPosition: AxisPosition;
//   AxisFormatType: AxisFormatType;

//   FigureDescriptor: FigureDescriptor;
//   ChartDescriptor: ChartDescriptor;
//   SeriesDescriptor: SeriesDescriptor;
//   SourceDescriptor: SourceDescriptor;
//   DownsampleOptions: DownsampleOptions;

//   ChartData: typeof ChartData;
// }

// export interface RemoverFn {
//   (): void;
// }

// export interface EventListener<T> {
//   (event: CustomEvent<T>): void;
// }

// export interface dh.plot.FigureDescriptor {
//   title: string;
//   titleFont?: string;
//   titleColor?: string;
//   isResizable?: boolean;
//   isDefaultTheme?: boolean;
//   updateInterval?: number;
//   rows?: number;
//   cols?: number;
//   charts: Partial<ChartDescriptor>[];
// }
// export interface dh.plot.ChartDescriptor {
//   rowspan?: number;
//   colspan?: number;
//   series: Partial<SeriesDescriptor>[];
//   axes: Partial<AxisDescriptor>[];
//   chartType: string;
//   title?: string;
//   titleFont?: string;
//   titleColor?: string;
//   showLegend?: boolean;
//   legendFont?: string;
//   legendColor?: string;
//   is3d?: boolean;
// }
// export interface dh.plot.SeriesDescriptor {
//   plotStyle: string;
//   name: string;
//   linesVisible?: boolean;
//   shapesVisible?: boolean;
//   gradientVisible?: boolean;
//   lineColor?: string;
//   pointLabelFormat?: string;
//   xToolTipPattern?: string;
//   yToolTipPattern?: string;
//   shapeLabel?: string;
//   shapeSize?: number;
//   shapeColor?: string;
//   shape?: string;
// }
// export interface dh.plot.SourceDescriptor {
//   axis?: AxisDescriptor;
//   table: Table;
//   columnName: string;
//   columnType: string;
// }
// export interface dh.plot.AxisDescriptor {
//   formatType: string;
//   type: string;
//   position: string;
//   log?: boolean;
//   label?: string;
//   labelFont?: string;
//   ticksFont?: string;
//   formatPattern?: string;
//   color?: string;
//   minRange?: number;
//   maxRange?: number;
//   minorTicksVisible?: boolean;
//   majorTicksVisible?: boolean;
//   minorTickCount?: number;
//   gapBetweenMajorTicks?: number;
//   tickLabelAngle?: number;
//   invert?: boolean;
//   isTimeAxis?: boolean;
// }
// export interface dh.plot.Figure extends dh.HasEventHandling {
//   readonly EVENT_UPDATED: string;
//   readonly EVENT_DISCONNECT: string;
//   readonly EVENT_RECONNECT: string;
//   readonly EVENT_RECONNECTFAILED: string;
//   readonly EVENT_DOWNSAMPLESTARTED: string;
//   readonly EVENT_DOWNSAMPLEFINISHED: string;
//   readonly EVENT_DOWNSAMPLEFAILED: string;
//   readonly EVENT_DOWNSAMPLENEEDED: string;
//   readonly EVENT_SERIES_ADDED: string;

//   /** Given a client-created figure descriptor, generate a figure that can be subscribed to */
//   create: (figure: Partial<dh.plot.FigureDescriptor>) => Promise<dh.plot.Figure>;

//   readonly title: string;
//   readonly titleFont: string;
//   readonly titleColor: string;
//   readonly isResizable: boolean;
//   readonly isDefaultTheme: boolean;
//   readonly updateInterval: number;
//   readonly cols: number;
//   readonly rows: number;
//   readonly charts: Chart[];
//   readonly errors: string[];

//   /**
//    * Subscribes to all series in this figure.
//    * @param forceDisableDownsample optional, can be specified to force downsampling to be disabled
//    */
//   subscribe: (forceDisableDownsample?: DownsampleOptions) => void;

//   /**
//    * Unsubscribes to all series in this figure.
//    */
//   unsubscribe: () => void;

//   close: () => void;
// }

// export type WidgetExportedObject = {
//   type: string;
//   fetch: () => Promise<unknown>;
//   close: () => void;
// };

// export interface Widget extends dh.HasEventHandling {
//   readonly EVENT_MESSAGE: string;

//   getDataAsBase64: () => string;
//   getDataAsString: () => string;
//   getDataAsU8: () => Uint8Array;
//   sendMessage: (
//     message: string | ArrayBuffer | ArrayBufferView,
//     references?: never[]
//   ) => void;
//   exportedObjects: WidgetExportedObject[];
//   close: () => void;
// }

// export interface FigureDataUpdatedEvent {
//   /**
//    * The series instances which were affected by this event and need to be updated.
//    */
//   readonly series: Series[];

//   /**
//    * Reads data out for this series from the event which just occurred for the given series.
//    * The array returned by this method will be cached and reused to minimize the garbage
//    * created, and to reduce processing time in handling updates.
//    *
//    * The pattern when using this is to iterate over the series which this event affects, and
//    * for each series, iterate over each source. For each series+source, pass them in, along
//    * with the optional mapping function, and get back the array of data across the entire plot.
//    *
//    * @param series
//    * @param sourceType
//    * @param mapFn
//    */
//   getArray: <I, O>(
//     series: Series,
//     sourceType: SourceType,
//     mapFn?: MapFn<I, O>
//   ) => O[];
// }

// export interface MapFn<I, O> {
//   (input: I): O;
// }

// export interface dh.plot.DownsampleOptions {
//   readonly DEFAULT: dh.plot.DownsampleOptions;
//   readonly DISABLE: dh.plot.DownsampleOptions;
// }

// export interface dh.plot.SourceType {
//   readonly X: dh.plot.SourceType;
//   readonly Y: dh.plot.SourceType;
//   readonly Z: dh.plot.SourceType;
//   readonly X_LOW: dh.plot.SourceType;
//   readonly X_HIGH: dh.plot.SourceType;
//   readonly Y_LOW: dh.plot.SourceType;
//   readonly Y_HIGH: dh.plot.SourceType;
//   readonly TIME: dh.plot.SourceType;
//   readonly OPEN: dh.plot.SourceType;
//   readonly HIGH: dh.plot.SourceType;
//   readonly LOW: dh.plot.SourceType;
//   readonly CLOSE: dh.plot.SourceType;
//   readonly SHAPE: dh.plot.SourceType;
//   readonly SIZE: dh.plot.SourceType;
//   readonly LABEL: dh.plot.SourceType;
//   readonly COLOR: dh.plot.SourceType;
//   readonly PARENT: dh.plot.SourceType;
//   readonly HOVER_TEXT: dh.plot.SourceType;
//   readonly TEXT: dh.plot.SourceType;
// }
// export interface ChartType {
//   readonly XY: ChartType;
//   readonly PIE: ChartType;
//   readonly OHLC: ChartType;
//   readonly CATEGORY: ChartType;
//   readonly XYZ: ChartType;
//   readonly CATEGORY_3D: ChartType;
// }
// export interface dh.plot.SeriesPlotStyle {
//   readonly BAR: dh.plot.SeriesPlotStyle;
//   readonly STACKED_BAR: dh.plot.SeriesPlotStyle;
//   readonly LINE: dh.plot.SeriesPlotStyle;
//   readonly AREA: dh.plot.SeriesPlotStyle;
//   readonly STACKED_AREA: dh.plot.SeriesPlotStyle;
//   readonly PIE: dh.plot.SeriesPlotStyle;
//   readonly HISTOGRAM: dh.plot.SeriesPlotStyle;
//   readonly OHLC: dh.plot.SeriesPlotStyle;
//   readonly SCATTER: dh.plot.SeriesPlotStyle;
//   readonly STEP: dh.plot.SeriesPlotStyle;
//   readonly ERROR_BAR: dh.plot.SeriesPlotStyle;
//   readonly TREEMAP: dh.plot.SeriesPlotStyle;
// }
// export interface dh.plot.AxisFormatType {
//   readonly CATEGORY: dh.plot.AxisFormatType;
//   readonly NUMBER: dh.plot.AxisFormatType;
// }
// export interface dh.plot.AxisType {
//   readonly X: dh.plot.AxisType;
//   readonly Y: dh.plot.AxisType;
//   readonly Z: dh.plot.AxisType;
//   readonly SHAPE: dh.plot.AxisType;
//   readonly SIZE: dh.plot.AxisType;
//   readonly LABEL: dh.plot.AxisType;
//   readonly COLOR: dh.plot.AxisType;
// }
// export interface dh.plot.AxisPosition {
//   readonly TOP: dh.plot.AxisPosition;
//   readonly BOTTOM: dh.plot.AxisPosition;
//   readonly LEFT: dh.plot.AxisPosition;
//   readonly RIGHT: dh.plot.AxisPosition;
//   readonly NONE: dh.plot.AxisPosition;
// }

// export interface dh.plot.Chart extends dh.HasEventHandling {
//   readonly EVENT_SERIES_ADDED: string;

//   readonly row: number;
//   readonly column: number;
//   readonly colspan: number;
//   readonly rowspan: number;
//   readonly chartType: ChartType;
//   readonly title: string;
//   readonly titleFont: string;
//   readonly titleColor: string;
//   readonly showLegend: boolean;
//   readonly legendFont: string;
//   readonly legendColor: string;
//   readonly is3d: boolean;
//   readonly series: Series[];
//   readonly multiSeries: MultiSeries[];
//   readonly axes: Axis[];
// }

// export interface dh.plot.Series {
//   readonly plotStyle: dh.plot.SeriesPlotStyle;
//   readonly name: string;
//   readonly isLinesVisible: boolean | null;
//   readonly isShapesVisible: boolean | null;
//   readonly isGradientVisible: boolean;
//   readonly lineColor: string;
//   readonly pointLabelFormat: string;
//   readonly xToolTipPattern: string;
//   readonly yToolTipPattern: string;
//   readonly shapeLabel: string;
//   readonly shapeSize: number;
//   readonly shape: string;
//   readonly shapeColor: string;
//   readonly sources: SeriesDataSource[];
//   readonly multiSeries: MultiSeries;
//   readonly oneClick: OneClick;

//   subscribe: (downsampleOptions?: dh.plot.DownsampleOptions) => void;
//   unsubscribe: () => void;
// }

// export interface dh.plot.MultiSeries {
//   readonly plotStyle: dh.plot.SeriesPlotStyle;
//   readonly name: string;
// }

// export interface dh.calendar.BusinessPeriod {
//   open: string;
//   close: string;
// }

// export interface dh.LocalDateWrapper {
//   toString: () => string;
// }
// export interface dh.calendar.Holiday {
//   date: dh.LocalDateWrapper;
//   businessPeriods: dh.calendar.BusinessPeriod[];
// }

// export interface dh.calendar.BusinessCalendar {
//   getName: () => string;
//   timeZone: TimeZone;
//   businessPeriods: dh.calendar.BusinessPeriod[];
//   businessDays: string[];
//   holidays: dh.calendar.Holiday[];
// }

// export interface dh.plot.Axis {
//   readonly id: string;
//   readonly formatType: dh.plot.AxisFormatType;
//   readonly type: dh.plot.AxisType;
//   readonly position: dh.plot.AxisPosition;
//   readonly log: boolean;
//   readonly label: string;
//   readonly labelFont: string;
//   readonly ticksFont: string;
//   readonly formatPattern: string;
//   readonly minRange: number;
//   readonly maxRange: number;
//   readonly isMinorTicksVisible: boolean;
//   readonly isMajorTicksVisible: boolean;
//   readonly minorTickCount: number;
//   readonly gapBetweenMajorTicks: number;
//   readonly majorTickLocations: number[];
//   readonly tickLabelAngle: number;
//   readonly isInvert: boolean;
//   readonly isTimeAxis: boolean;

//   readonly FORMAT_TYPE_NUMBER: unknown;
//   readonly businessCalendar: dh.calendar.BusinessCalendar;

//   /**
//    * Indicate the density and range of data that the UI needs for this axis, across any series which
//    * draws on this axis. Ignored for non-time series data, for non-line series.
//    * @param pixelCount the approx number of pixels wide
//    * @param min the optional minimum value visible on this axis - even if specified, smaller values may
//    * be returned, to ensure that lines drawn off the screen.
//    * @param max the optional max value visible on this axis. If min is specified, max is also expected.
//    */
//   range: (pixelCount?: number, min?: any, max?: any) => void;
// }

// export interface dh.plot.SeriesDataSource {
//   readonly axis: dh.plot.Axis;
//   readonly type: dh.plot.SourceType;
//   readonly columnType: string;
// }

// export interface dh.plot.OneClick {
//   readonly columns: { name: string; type: string }[];
//   readonly requireAllFiltersToDisplay: boolean;

//   setValueForColumn: (columnName: string, value: any) => void;
//   getValueForColumn: (columnName: string) => any;
// }

// export interface dh.Column {
//   readonly type: string;
//   readonly name: string;
//   readonly description: string;
//   readonly constituentType: string;

//   readonly isPartitionColumn: boolean;
//   readonly isSortable?: boolean;

//   filter: () => FilterValue;
//   sort: () => Sort;

//   formatColor: (expression: string) => CustomColumn;
//   formatRowColor: (expression: string) => CustomColumn;
// }

// export interface dh.CustomColumn {
//   readonly type: string;
//   readonly name: string;
//   readonly expression: string;
// }

// export interface FilterValueStatic {
//   ofString: (input: unknown) => dh.FilterValue;
//   ofNumber: (input: unknown) => dh.FilterValue;
//   ofBoolean: (input: unknown) => dh.FilterValue;
// }
// export interface dh.FilterValue {
//   eq: (value: dh.FilterValue) => FilterCondition;
//   eqIgnoreCase: (value: dh.FilterValue) => FilterCondition;
//   notEq: (value: dh.FilterValue) => FilterCondition;
//   notEqIgnoreCase: (value: dh.FilterValue) => FilterCondition;
//   greaterThan: (value: dh.FilterValue) => FilterCondition;
//   lessThan: (value: dh.FilterValue) => FilterCondition;
//   greaterThanOrEqualTo: (value: dh.FilterValue) => FilterCondition;
//   lessThanOrEqualTo: (value: dh.FilterValue) => FilterCondition;
//   in: (values: dh.FilterValue[]) => FilterCondition;
//   inIgnoreCase: (values: dh.FilterValue[]) => FilterCondition;
//   notIn: (values: dh.FilterValue[]) => FilterCondition;
//   notInIgnoreCase: (values: dh.FilterValue[]) => FilterCondition;
//   contains: (value: dh.FilterValue) => FilterCondition;
//   containsIgnoreCase: (value: dh.FilterValue) => FilterCondition;
//   isFalse: () => FilterCondition;
//   isTrue: () => FilterCondition;
//   isNull: () => FilterCondition;
//   invoke: (method: string, ...args: dh.FilterValue[]) => FilterCondition;
//   matches: (value: dh.FilterValue) => FilterCondition;
//   matchesIgnoreCase: (value: dh.FilterValue) => FilterCondition;
// }

// export interface FilterConditionStatic {
//   invoke: (method: string, ...args: dh.FilterValue[]) => FilterCondition;
//   search: (value: dh.FilterValue, columns?: dh.FilterValue[]) => FilterCondition;
// }
// export interface dh.FilterCondition {
//   not: () => dh.FilterCondition;
//   and: (first: dh.FilterCondition, ...rest: dh.FilterCondition[]) => dh.FilterCondition;
//   or: (first: dh.FilterCondition, ...rest: dh.FilterCondition[]) => dh.FilterCondition;

//   toString: () => string;
// }
// export interface dh.Sort {
//   reverse: () => dh.Sort;

//   readonly column: dh.Column;
//   readonly direction: 'ASC' | 'DESC' | 'REVERSE' | null;

//   readonly isAbs: boolean;

//   asc: () => dh.Sort;
//   desc: () => dh.Sort;
//   abs: () => dh.Sort;
// }

// export interface dh.InputTable {
//   keys: string[];
//   keyColumns: dh.Column[];
//   values: string[];
//   valueColumns: dh.Column[];
//   addRow: (
//     row: Record<string, unknown>,
//     userTimeZone?: string
//   ) => Promise<dh.InputTable>;
//   addRows: (
//     rows: Record<string, unknown>[],
//     userTimeZone?: string
//   ) => Promise<dh.InputTable>;
//   addTable: (table: Table) => Promise<dh.InputTable>;
//   addTables: (tables: Table[]) => Promise<dh.InputTable>;
//   deleteTable: (table: Table) => Promise<dh.InputTable>;
//   deleteTables: (tables: Table[]) => Promise<dh.InputTable>;
//   table: Table;
// }
// export interface dh.ColumnGroup {
//   name: string;
//   children: string[];
//   color?: string;
// }

// export interface dh.LayoutHints {
//   areSavedLayoutsAllowed?: boolean;
//   frontColumns?: string[];
//   backColumns?: string[];
//   hiddenColumns?: string[];
//   frozenColumns?: string[];
//   columnGroups?: dh.ColumnGroup[];
//   searchDisplayMode?: keyof SearchDisplayModeStatic;
// }

// export interface SearchDisplayModeStatic {
//   SEARCH_DISPLAY_DEFAULT: 'Default';
//   SEARCH_DISPLAY_HIDE: 'Hide';
//   SEARCH_DISPLAY_SHOW: 'Show';
// }

// export interface TableStatic {
//   readonly EVENT_SIZECHANGED: string;
//   readonly EVENT_UPDATED: string;
//   readonly EVENT_ROWADDED: string;
//   readonly EVENT_ROWREMOVED: string;
//   readonly EVENT_ROWUPDATED: string;
//   readonly EVENT_SORTCHANGED: string;
//   readonly EVENT_FILTERCHANGED: string;
//   readonly EVENT_CUSTOMCOLUMNSCHANGED: string;
//   readonly EVENT_DISCONNECT: string;
//   readonly EVENT_RECONNECT: string;
//   readonly EVENT_RECONNECTFAILED: string;
//   readonly SIZE_UNCOALESCED: number;
//   reverse: () => dh.Sort;
// }

// export interface ClientStatic {
//   readonly EVENT_REQUEST_FAILED: 'requestfailed';
//   readonly EVENT_REQUEST_STARTED: 'requeststarted';
//   readonly EVENT_REQUEST_SUCCEEDED: 'requestsucceeded';
// }
// export interface dh.Table extends TableTemplate<dh.Table>, TableStatic {
//   readonly totalSize: number;

//   readonly description: string;

//   customColumns: string[];

//   readonly layoutHints: dh.LayoutHints;

//   readonly isUncoalesced: boolean;
//   readonly hasInputTable: boolean;

//   readonly isClosed: boolean;
//   readonly pluginName: string;

//   applyCustomColumns: (columns: (dh.CustomColumn | string)[]) => string[];

//   getViewportData: () => Promise<TableData>;

//   subscribe: (columns: dh.Column[]) => TableSubscription;

//   selectDistinct: (columns: dh.Column[]) => Promise<dh.Table>;
//   copy: () => Promise<dh.Table>;

//   rollup: (config: RollupConfig) => Promise<dh.TreeTable>;
//   treeTable: (config: TreeTableConfig) => Promise<dh.TreeTable>;

//   inputTable: () => Promise<dh.InputTable>;

//   freeze: () => Promise<dh.Table>;

//   snapshot: (
//     rightHandSide: dh.Table,
//     doInitialSnapshot?: boolean,
//     stampColumns?: string[]
//   ) => Promise<dh.Table>;

//   getColumnStatistics: (column: dh.Column) => Promise<ColumnStatistics>;

//   join: (
//     joinType: string,
//     rightTable: dh.Table,
//     columnsToMatch: string[],
//     columnsToAdd?: string[]
//   ) => Promise<dh.Table>;
//   byExternal: (keys: string[], dropKeys?: boolean) => Promise<TableMap>;

//   fireViewportUpdate: () => void;

//   seekRow: (
//     startRow: number,
//     column: dh.Column,
//     valueType: ValueTypeUnion,
//     value: unknown,
//     insensitive?: boolean,
//     contains?: boolean,
//     isBackwards?: boolean
//   ) => Promise<number>;
// }

// export interface dh.TableViewportSubscription extends dh.HasEventHandling {
//   setViewport: (firstRow: number, lastRow: number, columns?: dh.Column[]) => void;
//   getViewportData: () => Promise<TableData>;
//   snapshot: (rows: RangeSet, columns: readonly dh.Column[]) => Promise<TableData>;
//   close: () => void;
// }

// export interface dh.ViewportData {
//   offset: number;
//   rows: Row[];
//   columns: dh.Column[];
// }

// export interface dh.TableSubscription extends dh.HasEventHandling {
//   readonly EVENT_UPDATED: string;

//   readonly columns: dh.Column[];
//   close: () => void;
// }

// export interface dh.RangeSet {
//   ofRange: (first: number, last: number) => dh.RangeSet;
//   ofItems: (rows: number[]) => dh.RangeSet;
//   ofRanges: (ranges: dh.RangeSet[]) => dh.RangeSet;

//   readonly size: number;
//   iterator: () => JsIterator<LongWrapper>;
// }

// export interface JsIterator<T> {
//   hasNext: () => boolean;
//   next: () => IteratorResult<T>;
// }

// export interface dh.LongWrapper {
//   asNumber: () => number;
//   valueOf: () => string;
//   toString: () => string;
//   ofString: (str: string) => dh.LongWrapper;
// }
// export interface dh.DateWrapper extends dh.LongWrapper {
//   ofJsDate: (date: Date) => dh.DateWrapper;
//   asDate: () => Date;
// }

// export interface dh.i18n.TimeZone {
//   adjustments: number[];
//   standardOffset: number;
//   timeZoneID: string;
//   id: string;
//   transitionPoints: number[];
//   tzNames: string[];
// }

// export interface i18nTimeZone {
//   getTimeZone: (tzCode: string) => dh.i18n.TimeZone;
// }

// export interface dh.i18n.DateTimeFormat {
//   format: (
//     pattern: string,
//     date: dh.DateWrapper | Date | number,
//     timeZone?: dh.i18n.TimeZone
//   ) => string;
//   parse: (pattern: string, text: string, timeZone?: dh.i18n.TimeZone) => dh.DateWrapper;
//   parseAsDate: (pattern: string, text: string) => Date;
// }

// export interface dh.i18n.NumberFormat {
//   format: (pattern: string, number: number) => string;
//   parse: (pattern: string, text: string) => number;
// }

// export interface dh.TableData {
//   readonly columns: dh.Column[];
//   readonly rows: Row[];

//   get: ((index: number) => Row) & ((index: dh.LongWrapper) => Row);

//   getData: ((index: number, column: dh.Column) => any) &
//     ((index: dh.LongWrapper, column: dh.Column) => any);

//   getFormat: ((index: number, column: dh.Column) => Format) &
//     ((index: dh.LongWrapper, column: dh.Column) => Format);
// }

// export interface dh.SubscriptionTableData extends dh.TableData {
//   readonly added: dh.RangeSet;
//   readonly removed: dh.RangeSet;
//   readonly modified: dh.RangeSet;
//   readonly fullIndex: dh.RangeSet;
// }

// export interface dh.Row {
//   readonly index: dh.LongWrapper;

//   get: (column: dh.Column) => any;

//   getFormat: (column: dh.Column) => Format;
// }

// export interface dh.Format {
//   readonly color: string;
//   readonly backgroundColor: string;
//   readonly formatString: string;
//   readonly formatDataBar: DatabarFormat;
// }

// export interface dh.DatabarFormat {
//   axis: string;
//   direction: string;
//   max: number;
//   min: number;
//   negativeColor: string | string[];
//   opacity: number;
//   positiveColor: string | string[];
//   valuePlacement: string;
//   value: number;
//   marker: number;
//   markerColor: string | string[];
// }

// export interface dh.ColumnStatistics {
//   readonly statisticsMap: Map<string, number>;
//   readonly uniqueValues: Map<string, number>;

//   getType: (name: string) => string;
// }

// export interface PartitionedTableStatic {
//   readonly EVENT_KEYADDED: string;
//   readonly EVENT_DISCONNECT: string;
//   readonly EVENT_RECONNECT: string;
//   readonly EVENT_RECONNECTFAILED: string;
// }

// export interface TreeTableStatic {
//   readonly EVENT_UPDATED: string;
//   readonly EVENT_DISCONNECT: string;
//   readonly EVENT_RECONNECT: string;
//   readonly EVENT_RECONNECTFAILED: string;
// }

// export interface dh.Table<T = dh.Table> extends dh.HasEventHandling {
//   readonly size: number;
//   readonly columns: dh.Column[];
//   readonly sort: dh.Sort[];
//   readonly filter: dh.FilterCondition[];
//   readonly totalsTableConfig: TotalsTableConfig;

//   findColumn: (name: string) => dh.Column;
//   findColumns: (names: string[]) => dh.Column[];

//   applySort: (sorts: dh.Sort[]) => dh.Sort[];
//   applyFilter: (filters: dh.FilterCondition[]) => dh.FilterCondition[];
//   selectDistinct: (columns: dh.Column[]) => Promise<dh.Table>;

//   getTotalsTable: (config?: TotalsTableConfig) => Promise<TotalsTable>;
//   getGrandTotalsTable: (config?: TotalsTableConfig) => Promise<TotalsTable>;

//   setViewport: (
//     firstRow: number,
//     lastRow: number,
//     columns?: dh.Column[],
//     updateIntervalMs?: number
//   ) => dh.TableViewportSubscription;

//   copy: () => Promise<T>;
//   close: () => void;
// }

// export interface dh.PartitionedTable
//   extends dh.HasEventHandling,
//     PartitionedTableStatic {
//   readonly size: number;
//   readonly columns: Column[];
//   readonly keyColumns: Column[];

//   getTable: (key: unknown) => Promise<Table>;
//   getMergedTable: () => Promise<Table>;
//   getKeys: () => Set<object>;
//   getKeyTable: () => Promise<Table>;

//   close: () => void;
// }

// export interface dh.TreeTable extends TableTemplate<dh.TreeTable>, TreeTableStatic {
//   readonly isIncludeConstituents: boolean;
//   readonly groupedColumns: Column[];

//   expand: ((row: number) => void) & ((row: TreeRow) => void);
//   collapse: ((row: number) => void) & ((row: TreeRow) => void);
//   setExpanded: ((
//     row: number,
//     isExpanded: boolean,
//     expandDescendants?: boolean
//   ) => void) &
//     ((row: TreeRow, isExpanded: boolean, expandDescendants?: boolean) => void);
//   expandAll?: () => void;
//   collapseAll?: () => void;
//   isExpanded: ((row: number) => boolean) & ((row: TreeRow) => boolean);

//   getViewportData: () => Promise<TreeTableData>;

//   saveExpandedState: () => string;
//   restoreExpandedState: (nodesToRestore: string) => void;
// }
// export interface TreeTableData extends dh.TableData {
//   readonly rows: TreeRow[];
// }
// export interface dh.TreeRow extends dh.Row {
//   readonly isExpanded: boolean;
//   readonly hasChildren: boolean;
//   readonly depth: number;
// }

// export interface dh.RollupConfig {
//   groupingColumns: string[] | null;
//   aggregations: Record<string, readonly string[]> | null;
//   includeConstituents: boolean;
//   includeOriginalColumns?: boolean;
//   includeDescriptions: boolean;
// }

// export interface TreeTableConfig {}

// export interface dh.TotalsTableConfig {
//   showTotalsByDefault?: boolean;
//   showGrandTotalsByDefault?: boolean;
//   defaultOperation?: string;
//   groupBy?: readonly string[];
//   operationMap: Record<string, readonly string[]>;
// }

// export interface dh.TotalsTable extends dh.HasEventHandling {
//   readonly size: number;
//   readonly columns: dh.Column[];

//   readonly sort: dh.Sort[];
//   readonly filter: dh.FilterCondition[];
//   customColumns: string[];

//   readonly totalsTableConfig: dh.TotalsTableConfig;

//   applySort: (sorts: dh.Sort[]) => dh.Sort[];
//   applyFilter: (filters: dh.FilterCondition[]) => dh.FilterCondition[];
//   applyCustomColumns: (columns: string[]) => string[];

//   setViewport: (
//     firstRow: number,
//     lastRow: number,
//     columns?: dh.Column[],
//     updateIntervalMs?: number
//   ) => void;
//   getViewportData: () => Promise<dh.TableData>;

//   close: () => void;
// }

// export interface dh.TableMap extends dh.HasEventHandling {
//   readonly size: number;
//   close: () => void;
//   getKeys: () => Promise<Set<object>>;
//   getTable: (key: object) => Promise<dh.Table>;
// }

// export interface dh.WorkerHeapInfo {
//   readonly maximumHeapSize: number;
//   readonly freeMemory: number;
//   readonly totalHeapSize: number;
// }

// export interface dh.IdeConnection extends dh.HasEventHandling {
//   getWorkerHeapInfo: () => Promise<dh.WorkerHeapInfo>;
//   getConsoleTypes: () => Promise<string[]>;
//   startSession: (type: string) => Promise<dh.IdeSession>;
// }

// export interface IdeConnectionOptions {
//   authoToken?: string;
//   serviceId?: string;
// }

// export interface IdeConnectionConstructor {
//   /** @deprecated Use EVENT_DISCONNECT and EVENT_RECONNECT instead */
//   HACK_CONNECTION_FAILURE: string;
//   EVENT_DISCONNECT: string;
//   EVENT_RECONNECT: string;
//   EVENT_SHUTDOWN: string;

//   new (serverUrl: string, options?: IdeConnectionOptions): IdeConnection;
// }

// export interface dh.IdeConnection
//   extends dh.IdeConnection,
//     IdeConnectionConstructor {
//   close: () => void;
//   running: () => Promise<dh.IdeConnection>;
//   disconnected: () => void;
//   getObject: ((
//     definition: dh.VariableDefinition<typeof VariableType.TABLE>
//   ) => Promise<dh.Table>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.FIGURE>
//     ) => Promise<dh.plot.Figure>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.TREETABLE>
//     ) => Promise<dh.TreeTable>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.HIERARCHICALTABLE>
//     ) => Promise<dh.TreeTable>) &
//     ((
//       definition: dh.VariableDefinition<typeof VariableType.PARTITIONEDTABLE>
//     ) => Promise<dh.PartitionedTable>) &
//     ((definition: dh.VariableDefinition) => Promise<unknown>);
//   subscribeToFieldUpdates: (
//     param: (changes: dh.ide.VariableChanges) => void
//   ) => () => void;
// }

// export interface dh.storage.ItemDetails {
//   filename: string;
//   basename: string;
//   dirname: string;
//   type: 'directory' | 'file';
//   size: number;
//   etag?: string;
// }

// export interface FileContentsStatic {
//   blob: (blob: Blob) => FileContents;
//   text: (...text: string[]) => FileContents;
//   arrayBuffers: (...buffers: ArrayBuffer[]) => FileContents;
// }

// export interface dh.storage.FileContents {
//   text: () => Promise<string>;
//   arrayBuffer: () => Promise<ArrayBuffer>;
//   etag?: string;
// }

// export interface dh.LoginCredentials {
//   type: string;
//   token?: string;
// }

// export interface dh.storage.StorageService {
//   listItems: (path: string, glob?: string) => Promise<dh.storage.ItemDetails[]>;
//   loadFile: (path: string, etag?: string) => Promise<dh.storage.FileContents>;
//   deleteItem: (path: string) => Promise<void>;
//   saveFile: (
//     path: string,
//     contents: dh.storage.FileContents,
//     allowOverwrite?: boolean
//   ) => Promise<void>;
//   moveItem: (path: string, newPath: string, newFile?: boolean) => Promise<void>;
//   createDirectory: (path: string) => Promise<void>;
// }

// export interface dh.ConnectOptions {
//   headers?: Record<string, string>;
// }

// export interface CoreClientContructor extends dh.HasEventHandling {
//   EVENT_CONNECT: string;
//   EVENT_DISCONNECT: string;
//   EVENT_RECONNECT: string;
//   EVENT_RECONNECT_AUTH_FAILED: string;
//   EVENT_REFRESH_TOKEN_UPDATED: string;
//   LOGIN_TYPE_ANONYMOUS: string;
//   new (serverUrl: string, options?: dh.ConnectOptions): CoreClient;
// }

// export interface dh.CoreClient extends CoreClientContructor {
//   login: (options: dh.LoginCredentials) => Promise<void>;
//   getAsIdeConnection: () => Promise<dh.IdeConnection>;
//   getStorageService: () => dh.storage.StorageService;
//   getServerConfigValues: () => Promise<[string, string][]>;
//   getAuthConfigValues: () => Promise<[string, string][]>;
//   disconnect: () => void;
// }

/**
 * Helper class to manage snapshots and deltas and keep not only a contiguous JS array of data per column in the
 * underlying table, but also support a mapping function to let client code translate data in some way for display and
 * keep that cached as well.
 */
// declare class ChartData {
//   constructor(table: dh.Table);

//   update(eventDetail: object): void;
//   getColumn(
//     columnName: string,
//     mappingFunc: (input: any) => any,
//     currentUpdate: dh.TableData
//   ): Array<any>;
//   /**
//    * Removes some column from the cache, avoiding extra computation on incoming events, and possibly freeing some
//    * memory. If this pair of column name and map function are requested again, it will be recomputed from scratch.
//    */
//   removeColumn(columnName: string, mappingFunc: (input: any) => any): void;
// }

// export type { ChartData };
