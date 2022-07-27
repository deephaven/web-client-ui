import type ChartBuilderPlugin from './ChartBuilderPlugin';
import type ChartPlugin from './ChartPlugin';
import type ConsolePlugin from './ConsolePlugin';
import type FilterPlugin from './FilterPlugin';
import type GridPlugin from './GridPlugin';
import type LinkerPlugin from './LinkerPlugin';
import type MarkdownPlugin from './MarkdownPlugin';
import type PandasPlugin from './PandasPlugin';

export type Plugin =
  | typeof ChartBuilderPlugin
  | typeof ChartPlugin
  | typeof ConsolePlugin
  | typeof FilterPlugin
  | typeof GridPlugin
  | typeof LinkerPlugin
  | typeof MarkdownPlugin
  | typeof PandasPlugin;
