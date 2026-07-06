/* eslint-disable react-refresh/only-export-components -- context utility file intentionally exports non-component values */
import React, { createContext, type ReactNode } from 'react';
import {
  type CellInputRendererFn,
  type CellInputRendererRegistry,
  type CellInputProps,
} from '@deephaven/grid';
import CellDropdownField from './CellDropdownField';
import {
  STRING_LIST_RESTRICTION_TYPE,
  type StringListRestriction,
} from './IrisGridModel';

export type { CellInputRendererFn, CellInputRendererRegistry };

const renderStringListRestriction: CellInputRendererFn = (
  props: CellInputProps
): ReactNode => {
  const { restrictions } = props;
  const { allowedValues } = restrictions[0] as StringListRestriction;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <CellDropdownField {...props} options={allowedValues} />;
};
renderStringListRestriction.preservesExistingValue = true;

/**
 * The default registry, installed as the context default value so that
 * consumers lower in the tree receive DHC's built-in renderers without
 * needing any provider.
 */
export const DEFAULT_REGISTRY: CellInputRendererRegistry = new Map([
  [STRING_LIST_RESTRICTION_TYPE, renderStringListRestriction],
]);

/**
 * Context that holds a registry of cell input renderer functions keyed by
 * column restriction type. Grid looks up the restriction type at render time
 * and falls back to its built-in CellInputField when there is no match.
 *
 * The default value includes DHC's built-in renderers (e.g. StringListRestriction
 * → CellDropdownField), so no provider is required for DHC apps.
 *
 * Enterprise (or any other consumer) can wrap part of the tree in a provider
 * to merge additional renderers on top of the defaults:
 *
 * ```tsx
 * const dhcRegistry = useContext(CellInputRendererContext);
 * const registry = useMemo(
 *   () => new Map([...dhcRegistry, [MY_TYPE, myRenderer]]),
 *   [dhcRegistry]
 * );
 * return (
 *   <CellInputRendererContext.Provider value={registry}>
 *     {children}
 *   </CellInputRendererContext.Provider>
 * );
 * ```
 */
const CellInputRendererContext =
  createContext<CellInputRendererRegistry>(DEFAULT_REGISTRY);

export default CellInputRendererContext;
