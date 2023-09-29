import type React from 'react';
import type {
  ColumnName,
  InputFilter,
  IrisGridContextMenuData,
  IrisGridModel,
} from '@deephaven/iris-grid';
import type { ResolvableContextAction } from '@deephaven/components';
import type { Table } from '@deephaven/jsapi-types';

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
  model: IrisGridModel;

  /**
   * The table this plugin was associated with.
   */
  table: Table;

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
