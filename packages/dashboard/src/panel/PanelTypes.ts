import type {
  Component,
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';
import { ConnectedComponent } from 'react-redux';
import type {
  GLPanelProps,
  ReactComponentConfig,
} from '@deephaven/golden-layout';

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

export type PanelComponent<T extends PanelProps = PanelProps> = Component<T>;

export type PanelConfig = ReactComponentConfig & {
  componentState?: Record<string, unknown> | null;
};
