import { Component, ComponentClass, ComponentType } from 'react';
import { ConnectedComponent } from 'react-redux';
import GoldenLayout, { ReactComponentConfig } from '@deephaven/golden-layout';
import PanelManager from './PanelManager';

export type WrappedComponentType<
  C extends ComponentClass,
  P extends PanelProps
> = ConnectedComponent<C, P>;

export type PanelComponentType<
  C extends ComponentClass = ComponentClass,
  P extends PanelProps = PanelProps
> = ComponentType | WrappedComponentType<C, P>;

export function isWrappedComponent<
  C extends ComponentClass,
  P extends PanelProps
>(type: PanelComponentType<C, P>): type is WrappedComponentType<C, P> {
  return (type as WrappedComponentType<C, P>)?.WrappedComponent !== undefined;
}

export type PanelProps = {
  glContainer: GoldenLayout.Container;
  glEventHub: GoldenLayout.EventEmitter;
};

export type PanelComponent<T extends PanelProps = PanelProps> = Component<T>;

export type PanelConfig = ReactComponentConfig & {
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

export type DeregisterComponentFunction = () => void;

export type PanelHydrateFunction = (
  props: PanelProps,
  dashboardId: string
) => PanelProps;

export type PanelDehydrateFunction = (
  config: PanelConfig,
  dashboardId: string
) => PanelConfig | null;

export type DashboardPluginComponentProps = {
  id: string;
  layout: GoldenLayout;
  panelManager: PanelManager;
  registerComponent: <C extends ComponentClass, P extends PanelProps>(
    name: string,
    ComponentType: PanelComponentType<C, P>,
    hydrate?: PanelHydrateFunction,
    dehydrate?: PanelDehydrateFunction
  ) => DeregisterComponentFunction;
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
