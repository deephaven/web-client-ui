/* eslint-disable react-refresh/only-export-components -- exports non-component values alongside the provider */
import React, { createContext, type ReactNode, useMemo } from 'react';
import { useTheme } from '@deephaven/components';
import {
  type CellInputRendererFn,
  type CellInputRendererRegistry,
  type CellInputProps,
} from '@deephaven/grid';
import CellDropdownField from './CellDropdownField';
import {
  createDefaultIrisGridTheme,
  type IrisGridThemeType,
} from './IrisGridTheme';
import {
  STRING_LIST_RESTRICTION_TYPE,
  type StringListRestriction,
} from './IrisGridModel';

export type { CellInputRendererFn, CellInputRendererRegistry, CellInputProps };

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
 * The default registry containing DHC's built-in cell input renderers.
 * Pass this (or a superset of it) as the `registry` prop of
 * {@link IrisGridContextProvider} to include the DHC defaults.
 */
export const DEFAULT_REGISTRY: CellInputRendererRegistry = new Map([
  [STRING_LIST_RESTRICTION_TYPE, renderStringListRestriction],
]);

/**
 * The context value for the IrisGridContextProvider.
 * This must be a full object and not a partial so that we
 * can createDefaultIrisGridTheme once, and not per grid.
 */
export type IrisGridThemeContextValue = IrisGridThemeType;

/**
 * The context for the IrisGrid, providing the theme, density, and cell input renderer registry.
 */
export const IrisGridContext = createContext<{
  theme: IrisGridThemeContextValue | null;
  density: 'compact' | 'regular' | 'spacious';
  cellInputRendererRegistry: CellInputRendererRegistry;
}>({
  theme: null,
  density: 'regular',
  cellInputRendererRegistry: DEFAULT_REGISTRY,
});
IrisGridContext.displayName = 'IrisGridContext';

export interface IrisGridContextProviderProps {
  children: ReactNode;
  /* The density of the grid. Defaults to regular */
  density?: 'compact' | 'regular' | 'spacious';
  /** Registry of cell input renderer functions. Defaults to the DHC built-in renderers. */
  registry?: CellInputRendererRegistry;
}

export function IrisGridContextProvider({
  children,
  density = 'regular',
  registry = DEFAULT_REGISTRY,
}: IrisGridContextProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  const gridTheme = useMemo(
    () => createDefaultIrisGridTheme(),
    // When the theme changes, we need to update the grid theme which reads CSS variables to JS
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThemes]
  );

  const contextValue = useMemo(
    () => ({
      theme: gridTheme,
      density,
      cellInputRendererRegistry: registry,
    }),
    [gridTheme, density, registry]
  );

  return (
    <IrisGridContext.Provider value={contextValue}>
      {children}
    </IrisGridContext.Provider>
  );
}
