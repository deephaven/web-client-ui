import { ForwardRef } from 'react-is';
import {
  DehydratedDashboardPanelProps,
  isWrappedComponent,
  PanelComponentType,
  PanelConfig,
} from './DashboardPlugin';

/**
 * Dehydrate an existing panel to allow it to be serialized/saved.
 * Just takes what's in the panels `metadata` in the props and `panelState` in
 * the component state, assumes it's serializable, and saves it.
 * @param config The panel config to dehydrate
 * @returns The dehydrated PanelConfig
 */
export function dehydrate(config: PanelConfig): PanelConfig | null {
  const { props, componentState } = config;
  const { metadata } = props;
  let { panelState = null } = props;
  if (componentState) {
    ({ panelState } = componentState);
  }
  const newProps: Record<string, unknown> = {};
  if (metadata != null) {
    newProps.metadata = metadata;
  }
  if (panelState != null) {
    newProps.panelState = panelState;
  }

  return {
    ...config,
    componentState: null,
    props: newProps,
    type: 'react-component',
  };
}

/**
 * Default hydration function. Just applies the dashboard ID. When used with dehydrate above,
 * the panels state will be stored in `panelState` prop.
 * @param props Panel props to hydrate
 * @param localDashboardId The local dashboard ID to hydrate the panel with
 * @returns The hydrated panel props
 */
export function hydrate<T extends DehydratedDashboardPanelProps>(
  props: T,
  localDashboardId = ''
): T {
  return {
    metadata: {},
    ...props,
    localDashboardId,
  };
}

/**
 * Checks if a panel component can take a ref. Helps silence react dev errors
 * if a ref is passed to a functional component without forwardRef.
 * @param component The panel component to check if it can take a ref
 * @returns Wheter the component can take a ref or not
 */
export function canHaveRef(component: PanelComponentType): boolean {
  // Might be a redux connect wrapped component
  const isClassComponent =
    (isWrappedComponent(component) &&
      component.WrappedComponent.prototype != null &&
      component.WrappedComponent.prototype.isReactComponent != null) ||
    (component.prototype != null &&
      component.prototype.isReactComponent != null);

  const isForwardRef =
    !isWrappedComponent(component) &&
    '$$typeof' in component &&
    component.$$typeof === ForwardRef;

  return isClassComponent || isForwardRef;
}

export default {
  dehydrate,
  hydrate,
};
