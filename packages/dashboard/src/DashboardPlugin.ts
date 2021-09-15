import { ComponentType } from 'react';
import GoldenLayout from '@deephaven/golden-layout';
import PanelManager from './PanelManager';

export type PanelProps = {
  [keys: string]: unknown;
};

export type PanelConfig = {
  title: string;
  type: string;
  props: PanelProps;
  componentState?: Record<string, unknown> | null;
};

export type DashboardConfig = {
  id: string;
  layout: GoldenLayout;
  panelManager: PanelManager;
};

export interface DashboardPanelDefinition {
  name: string;
  definition: ComponentType;
}

export type DeregisterComponentFn = () => void;

export type DashboardPluginComponentProps = {
  id: string;
  layout: GoldenLayout;
  panelManager: PanelManager;
  registerComponent: (
    name: string,
    ComponentType: ComponentType,
    hydrate?: (props: PanelProps) => PanelProps,
    dehydrate?: (config: PanelConfig) => PanelConfig | null
  ) => DeregisterComponentFn;
};

export interface DashboardPlugin {
  panels?: DashboardPanelDefinition[];

  /** Hydrate the provided panel and props. Return the same object if no changes made. */
  hydrateComponent?: (name: string, props: PanelProps) => PanelProps;

  /** Dehydrate a component. Return the same object if no changes made, or `null` if the component should not be saved */
  dehydrateComponent?: (
    name: string,
    config: PanelConfig
  ) => PanelConfig | null;

  /** Called when the dashboard is initialized and layout is ready. */
  initialize?: (config: DashboardConfig) => void;

  /** Called when the dashboard is unintialized and layout is about to be destroyed */
  deinitialize?: (config: DashboardConfig) => void;
}
