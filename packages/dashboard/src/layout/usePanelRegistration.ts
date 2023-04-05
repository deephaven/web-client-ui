import React from 'react';
import {
  DashboardPluginComponentProps,
  PanelComponentType,
  PanelDehydrateFunction,
  PanelHydrateFunction,
  PanelProps,
} from '../DashboardPlugin';

/**
 * Registers a given panel component. Also runs a `useEffect` that will
 * automatically de-register then panel on unmount.
 * @param registerComponent
 * @param ComponentType
 * @param hydrate
 * @param dehydrate
 */
export default function usePanelRegistration<
  P extends PanelProps,
  C extends React.ComponentType<P>
>(
  registerComponent: DashboardPluginComponentProps['registerComponent'],
  ComponentType: PanelComponentType<P, C> | React.NamedExoticComponent<P>,
  hydrate?: PanelHydrateFunction<P>,
  dehydrate?: PanelDehydrateFunction
) {
  // Look for static `COMPONENT` or `displayName` attribute
  const name =
    'COMPONENT' in ComponentType
      ? ComponentType.COMPONENT
      : ComponentType.displayName;

  if (name == null) {
    throw new Error(
      'ComponentType must have a `COMPONENT` or `displayName` attribute.'
    );
  }

  React.useEffect(() => {
    const deregister = registerComponent(
      name,
      ComponentType,
      hydrate,
      dehydrate
    );

    return () => {
      deregister();
    };
  }, [ComponentType, dehydrate, hydrate, name, registerComponent]);
}
