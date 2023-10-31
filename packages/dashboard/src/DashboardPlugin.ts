import type {
  Component,
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';
import { ConnectedComponent } from 'react-redux';
import GoldenLayout from '@deephaven/golden-layout';
import type {
  GLPanelProps,
  ReactComponentConfig,
} from '@deephaven/golden-layout';
import PanelManager from './PanelManager';
import { PanelComponentType, PanelConfig, PanelProps } from './panel';

export type DashboardPanelProps = PanelProps & { localDashboardId: string };

export type DehydratedDashboardPanelProps = Omit<
  DashboardPanelProps,
  keyof GLPanelProps
>;

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

export type PanelHydrateFunction<
  T extends DehydratedDashboardPanelProps = DehydratedDashboardPanelProps,
  R extends T = T,
> = (props: T, dashboardId: string) => R;

export type PanelDehydrateFunction = (
  config: PanelConfig,
  dashboardId: string
) => PanelConfig | null;

export type DashboardPluginComponentProps = {
  id: string;
  layout: GoldenLayout;
  panelManager: PanelManager;
  registerComponent: <
    P extends DashboardPanelProps,
    C extends ComponentType<P>,
  >(
    name: string,
    ComponentType: PanelComponentType<P, C>,
    hydrate?: PanelHydrateFunction,
    dehydrate?: PanelDehydrateFunction
  ) => DeregisterComponentFunction;
};

/**
 * Takes a partial DashboardPluginComponentProps and verifies all the dashboard component fields are filled in.
 * @param props The props to check
 * @returns True if the props are valid DashboardPluginComponentProps, false otherwise
 */
export function isDashboardPluginProps(
  props: Partial<DashboardPluginComponentProps>
): props is DashboardPluginComponentProps {
  return (
    typeof props.id === 'string' &&
    props.layout instanceof GoldenLayout &&
    props.panelManager instanceof PanelManager &&
    typeof props.registerComponent === 'function'
  );
}

export function assertIsDashboardPluginProps(
  props: Partial<DashboardPluginComponentProps>
): asserts props is DashboardPluginComponentProps {
  if (!isDashboardPluginProps(props)) {
    throw new Error(
      `Expected dashboard plugin props, but instead received ${props}`
    );
  }
}
