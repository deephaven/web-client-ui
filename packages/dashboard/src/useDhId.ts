import Log from '@deephaven/log';
import { useFiber } from './useFiber';
import { usePanelId } from './usePanelId';

const log = Log.module('useDhId');

export const DH_ID_PROP = '__dhId';

/**
 * Gets the Deephaven ID of a component.
 * This is used to identify the component within a dashboard.
 * Usually this is just a panel ID, but in some contexts such as dh.ui,
 * it may be an ID for a component within a panel.
 *
 * Looks for a __dhId prop on the component, and if not found, looks in the PanelIdContext.
 * @param props The props of the component using this hook
 * @returns The Deephaven ID of the component or null if not found.
 */
export function useDhId(): string | null {
  // pendingProps are the props passed to the fiber node
  const props =
    (useFiber()?.pendingProps as Record<string, unknown> | undefined) ?? {};
  const dhIdProp = props[DH_ID_PROP];
  const panelId = usePanelId();

  if (dhIdProp != null) {
    if (typeof dhIdProp !== 'string') {
      throw new Error(
        `useDhId expected prop ${DH_ID_PROP} to be a string, but got ${typeof dhIdProp}`
      );
    }
    return dhIdProp;
  }

  if (panelId == null) {
    log.warn(
      `useDhId must be used within a PanelIdContext provider if there is no ${DH_ID_PROP} prop. Defaulting to null.`
    );
    return null;
  }

  return panelId;
}
