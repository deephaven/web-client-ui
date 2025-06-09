import { createContext, useContext } from 'react';
import Log from '@deephaven/log';
import { useFiber } from './useFiber';

const log = Log.module('useDhId');

export const DH_ID_PROP = '__dhId';

export const DhIdContext = createContext<string | null>(null);

/**
 * Gets the Deephaven ID of a component.
 * This is used to identify the component within a dashboard.
 * Usually this is just a panel ID, but in some contexts such as dh.ui,
 * it may be an ID for a component within a panel.
 *
 * Looks for a __dhId prop on the component, and if not found, looks in the DhIdContext.
 * @param props The props of the component using this hook
 * @returns The Deephaven ID of the component or null if not found.
 */
export function useDhId(): string | null {
  // pendingProps are the props passed to the fiber node
  const props =
    (useFiber()?.pendingProps as Record<string, unknown> | undefined) ?? {};
  const dhIdProp = props[DH_ID_PROP];
  const dhId = useContext(DhIdContext);

  if (dhIdProp != null) {
    if (typeof dhIdProp !== 'string') {
      throw new Error(
        `useDhId expected prop ${DH_ID_PROP} to be a string, but got ${typeof dhIdProp}`
      );
    }
    return dhIdProp;
  }

  if (dhId == null) {
    log.warn(
      `useDhId must be used within a DhIdContext provider if there is no ${DH_ID_PROP} prop. Defaulting to null.`
    );
    return null;
  }

  return dhId;
}
