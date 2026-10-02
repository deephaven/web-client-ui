import type {
  BarData,
  HistogramData,
  IndicatorData,
  OhlcData,
  PieData,
  PlotType,
  MarkerSymbol,
  ScatterData,
  ScatterglData,
  TreemapData,
} from 'plotly.js';

/** The trace types registered in our partial plotly bundle. See `./Plotly`. */
type SupportedTraceData =
  | BarData
  | HistogramData
  | IndicatorData
  | OhlcData
  | PieData
  | ScatterData
  | ScatterglData
  | TreemapData;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/** The union of `T[K]` across every member of `T` that declares `K`. */
type PropOfUnion<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : never
  : never;

/** Flattens a union of object types into one type with all properties optional. */
type MergeUnion<T> = {
  [K in KeysOfUnion<T>]?: PropOfUnion<T, K>;
};

/**
 * plotly.js v4 replaced the catch-all `PlotData` type with one interface per
 * trace type. Chart code builds traces generically before their type is known,
 * so merge the trace interfaces we support back into a single type.
 *
 * `line` and `marker` are merged as well because styling is applied to them
 * before the trace type is known, and `type`/`marker.symbol` stay wide because
 * the server can send any plot style or shape.
 */
export type PlotData = Omit<
  MergeUnion<SupportedTraceData>,
  'type' | 'line' | 'marker'
> & {
  type?: PlotType;
  line?: MergeUnion<PropOfUnion<SupportedTraceData, 'line'>>;
  marker?: Omit<
    MergeUnion<PropOfUnion<SupportedTraceData, 'marker'>>,
    'symbol'
  > & {
    symbol?: MarkerSymbol;
  };
};
