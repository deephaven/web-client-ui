import { createContext, useContext, type ComponentType } from 'react';
import { type OptionItem } from '../CommonTypes';

/**
 * Contribution from a parent context (typically a
 * `WidgetMiddlewarePlugin`) into the Table Options sidebar of any
 * descendant `<IrisGrid>` rendered via a panel host that consumes
 * this context (`IrisGridPanel`, `GridWidgetPlugin`).
 *
 * Today the contract is a single optional `transformItems` transform
 * that mirrors the `IrisGrid#sidebarItems` prop. Adding a new field
 * here is non-breaking as long as consumers treat unknown keys as
 * absent. Middleware authors that want to compose with an
 * already-present context value should read it via `useContext`,
 * merge, and publish the merged value through a new Provider.
 */
export interface IrisGridSidebarExtension {
  transformItems?: (defaults: readonly OptionItem[]) => readonly OptionItem[];
}

/**
 * Context published by middleware authors to inject sidebar
 * extensions into descendant `<IrisGrid>` instances without having
 * to drive the `sidebarItems` prop directly. A `null` value (the
 * default) means "no extension"; descendant consumers treat that
 * the same as an empty extension.
 */
export const IrisGridSidebarContext =
  createContext<IrisGridSidebarExtension | null>(null);

const EMPTY_EXTENSION: IrisGridSidebarExtension = Object.freeze({});

/**
 * Returns the current `IrisGridSidebarExtension` from context, or a
 * frozen empty extension when no Provider is present. Always returns
 * a non-null value so call sites can destructure
 * `transformItems` without a null guard.
 */
export function useResolvedSidebarExtension(): IrisGridSidebarExtension {
  return useContext(IrisGridSidebarContext) ?? EMPTY_EXTENSION;
}

/**
 * Convenience type for plugin authors who want to type their
 * middleware's contribution explicitly.
 */
export type SidebarExtensionProvider = ComponentType<{
  value: IrisGridSidebarExtension;
  children?: React.ReactNode;
}>;
