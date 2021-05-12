import { ComponentType } from 'react';
import GoldenLayout from 'golden-layout';
import { PanelManager } from './panels';

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
