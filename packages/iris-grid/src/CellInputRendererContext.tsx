/* eslint-disable react-refresh/only-export-components -- context utility file intentionally exports non-component values */
import React, { createContext, type ReactNode } from 'react';
import {
  type CellInputFieldProps,
  type CellInputRendererFn,
  type CellInputRendererRegistry,
  type ColumnRestriction,
} from '@deephaven/grid';
import CellDropdownField from './CellDropdownField';
import {
  STRING_LIST_RESTRICTION_TYPE,
  type StringListRestriction,
} from './IrisGridModel';

export type { CellInputRendererFn, CellInputRendererRegistry };

const renderStringListRestriction: CellInputRendererFn = ({
  columnRestrictions,
  className,
  disabled,
  isQuickEdit,
  value,
  onChange,
  onCancel,
  onDone,
  style,
}: CellInputFieldProps & {
  columnRestrictions: ColumnRestriction[];
}): ReactNode => {
  const { allowedValues } = columnRestrictions[0] as StringListRestriction;
  return (
    <CellDropdownField
      className={className}
      disabled={disabled}
      isQuickEdit={isQuickEdit}
      value={value}
      options={allowedValues}
      onChange={onChange}
      onCancel={onCancel}
      onDone={onDone}
      style={style}
    />
  );
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
