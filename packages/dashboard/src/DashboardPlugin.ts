import type {
  Component,
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';
import { ConnectedComponent } from 'react-redux';
import GoldenLayout, { GLPanelProps } from '@deephaven/golden-layout';
import type { ReactComponentConfig } from '@deephaven/golden-layout';
import PanelManager from './PanelManager';

/**
 * Alias for the return type of React.forwardRef()
 */
export type ForwardRefComponentType<P, R> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<R>
>;

/**
 * Panel components can provide static props that provide meta data about the
 * panel.
 */
export interface PanelStaticMetaData {
  /**
   * Should be set to the same name as the component type.
   * @deprecated Use `displayName` instead.
   */
  COMPONENT?: string;

  /** Title of the panel. */
  TITLE?: string;
}

/**
 * Panels defined as functional components have to use React.forwardRef.
 */
export type PanelFunctionComponentType<P, R> = ForwardRefComponentType<P, R> &
  PanelStaticMetaData;

export type WrappedComponentType<
  P extends PanelProps,
  C extends ComponentType<P>
> = ConnectedComponent<C, P>;

export type PanelComponentType<
  P extends PanelProps = PanelProps,
  C extends ComponentType<P> = ComponentType<P>
> = (
  | ComponentType<P>
  | WrappedComponentType<P, C>
  | PanelFunctionComponentType<P, unknown>
) &
  PanelStaticMetaData;

export function isWrappedComponent<
  P extends PanelProps,
  C extends ComponentType<P>
>(type: PanelComponentType<P, C>): type is WrappedComponentType<P, C> {
  return (type as WrappedComponentType<P, C>)?.WrappedComponent !== undefined;
}

export type PanelMetadata = { id?: string; name?: string; type?: string };

export type PanelProps = GLPanelProps & {
  id: string;
  metadata?: PanelMetadata;
};

export type DehydratedPanelProps = Omit<PanelProps, keyof GLPanelProps>;

export type DashboardPanelProps = PanelProps & { localDashboardId: string };

export type DehydratedDashboardPanelProps = Omit<
  DashboardPanelProps,
  keyof GLPanelProps
>;

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

export type PanelHydrateFunction<
  T extends DehydratedDashboardPanelProps = DehydratedDashboardPanelProps,
  R extends T = T
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
    C extends ComponentType<P>
  >(
    name: string,
    ComponentType: PanelComponentType<P, C>,
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
