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
 * Alias for the return type of React.forwardRef()
 */
type ForwardRefComponentType<P, R> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<R>
>;

/**
 * @deprecated Use `PanelComponentType` instead and add generic types to forwardRef call.
 */
export type PanelFunctionComponentType<P, R> = ForwardRefComponentType<P, R> &
  PanelStaticMetaData;

export type WrappedComponentType<
  P extends PanelProps,
  C extends ComponentType<P>,
> = ConnectedComponent<C, P>;

export type PanelComponentType<
  P extends PanelProps = PanelProps,
  C extends ComponentType<P> = ComponentType<P>,
> = (ComponentType<P> | WrappedComponentType<P, C>) & PanelStaticMetaData;

export function isWrappedComponent<
  P extends PanelProps,
  C extends ComponentType<P>,
>(type: PanelComponentType<P, C>): type is WrappedComponentType<P, C> {
  return (type as WrappedComponentType<P, C>)?.WrappedComponent !== undefined;
}

export type PanelMetadata = { id?: string; name?: string; type?: string };

export type PanelProps = GLPanelProps & {
  metadata?: PanelMetadata;
};

export type DehydratedPanelProps = Omit<PanelProps, keyof GLPanelProps>;

export type DashboardPanelProps = PanelProps & { localDashboardId: string };

export type DehydratedDashboardPanelProps = Omit<
  DashboardPanelProps,
  keyof GLPanelProps
>;

export type PanelComponent<T extends PanelProps = PanelProps> =
  | Component<T>
  | { props: T; state: unknown };

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
