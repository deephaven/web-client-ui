import React from 'react';
import {
  type DashboardPanelProps,
  type DashboardPluginComponentProps,
  type PanelComponentType,
  type PanelDehydrateFunction,
  type PanelHydrateFunction,
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
  P extends DashboardPanelProps,
  C extends React.ComponentType<P>,
>(
  registerComponent: DashboardPluginComponentProps['registerComponent'],
  ComponentType: PanelComponentType<P, C>,
  hydrate?: PanelHydrateFunction,
  dehydrate?: PanelDehydrateFunction
): void {
  const name = ComponentType.COMPONENT ?? ComponentType.displayName;

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
