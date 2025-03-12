import { type TabEvent as DashboardTabEvent } from '@deephaven/dashboard';

export { default as ChartEvent } from './ChartEvent';
export { default as ConsoleEvent } from './ConsoleEvent';
export { default as InputFilterEvent } from './InputFilterEvent';
export { default as IrisGridEvent } from './IrisGridEvent';
export { default as MarkdownEvent } from './MarkdownEvent';
export { default as NotebookEvent } from './NotebookEvent';
export { default as PandasEvent } from './PandasEvent';

/**
 * @deprecated Use TabEvent from @deephaven/dashboard
 */
export type TabEvent = typeof DashboardTabEvent;
