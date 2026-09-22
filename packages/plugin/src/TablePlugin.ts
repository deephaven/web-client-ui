import type React from 'react';
// Type-only: `@deephaven/iris-grid` and `@deephaven/grid` are optional peers so table
// plugin types don't pull those dependency trees into every `@deephaven/plugin` consumer.
import type {
  ColumnName,
  InputFilter,
  IrisGridContextMenuData,
  IrisGridTableModelTemplate,
} from '@deephaven/iris-grid';
import type { GridRange, Selection } from '@deephaven/grid';
import type { ResolvableContextAction } from '@deephaven/components';
import type { dh } from '@deephaven/jsapi-types';
import type {
  LegacyTablePlugin,
  TablePlugin as TablePluginRegistration,
} from './PluginTypes';

export interface TablePluginElement {
  getMenu?: (data: IrisGridContextMenuData) => ResolvableContextAction[];
}

export interface TablePluginProps<S = unknown> {
  /**
   * Apply filters to the table
   * @param filters Filters to apply to the table
   */
  filter: (filters: InputFilter[]) => void;

  /**
   * Set columns that should always be fetched, even if they're outside the viewport
   * @param pluginFetchColumns Names of columns to always fetch
   */
  fetchColumns: (pluginFetchColumns: ColumnName[]) => void;

  /**
   * The model for the table this plugin is associated with.
   */
  model: IrisGridTableModelTemplate;

  /**
   * The table this plugin was associated with.
   */
  table: dh.Table;

  /**
   * The name of the table this plugin is associated with.
   */
  tableName: string;

  /**
   * The currently selected ranges in the table.
   * @deprecated Use `selection` instead.
   */
  selectedRanges: readonly GridRange[] | undefined;

  /**
   * The current grid selection, including keyed selections for tables with key columns.
   */
  selection?: Selection | null;

  /**
   * Notify of a state change in the plugin state. Will be saved with the panel data.
   * Should be an object that can be serialized to JSON.
   * @param pluginState State of the plugin to save
   */
  onStateChange: (pluginState: S) => void;

  /**
   * Current plugin state. Use to load.
   */
  pluginState: S;
}

export type TablePluginComponent<S = unknown> = React.ComponentType<
  TablePluginProps<S> & React.RefAttributes<TablePluginElement>
>;

/**
 * `TablePlugin` registration with `component` checked against the full table
 * plugin contract.
 */
export type TablePluginDefinition<S = unknown> = TablePluginRegistration<
  TablePluginComponent<S>
>;

/**
 * @deprecated Use TablePluginDefinition instead
 */
export type LegacyTablePluginDefinition<S = unknown> = LegacyTablePlugin<
  TablePluginComponent<S>
>;
