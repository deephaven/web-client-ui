import React from 'react';
import IrisGrid, {
  ColumnName,
  InputFilter,
  IrisGridContextMenuData,
  IrisGridModel,
  IrisGridTableModel,
} from '@deephaven/iris-grid';
import {
  ContextMenuRoot,
  ResolvableContextAction,
} from '@deephaven/components';
import type { Table } from '@deephaven/jsapi-types';
import { User, Workspace } from '@deephaven/redux';
import { IrisGridPanel, PanelState } from './IrisGridPanel';

export interface TablePluginElement {
  getMenu?: (data: IrisGridContextMenuData) => ResolvableContextAction[];
}

export interface TablePluginProps extends DeprecatedTablePluginProps {
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
   * The IrisGridPanel displaying this table
   */
  panel: IrisGridPanel;

  /**
   * Notify of a state change in the plugin state. Will be saved with the panel data.
   * Should be an object that can be serialized to JSON.
   * @param pluginState State of the plugin to save
   */
  onStateChange: (pluginState: PanelState['pluginState']) => void;

  /**
   * Current plugin state. Use to load.
   */
  pluginState: PanelState['pluginState'];
}

export interface DeprecatedTablePluginProps {
  /** @deprecated Import components from @deephaven/components and @deephaven/iris-grid packages instead */
  components: {
    IrisGrid: typeof IrisGrid;
    IrisGridTableModel: typeof IrisGridTableModel;
    ContextMenuRoot: typeof ContextMenuRoot;
  };

  /** @deprecated Use `fetchColumns` instead */
  onFetchColumns: (pluginFetchColumns: ColumnName[]) => void;

  /** @deprecated Use `filter` instead */
  onFilter: (filters: InputFilter[]) => void;

  /**
   * Current user information
   * @deprecated Use `getUser` from `@deephaven/redux` instead
   */
  user: User;

  /**
   * Current user workspace data
   * @deprecated Use `getWorkspace` from `@deephaven/redux` instead
   */
  workspace: Workspace;
}

export type TablePlugin = React.ForwardRefExoticComponent<
  TablePluginProps & React.RefAttributes<TablePluginElement>
>;

export default TablePlugin;
