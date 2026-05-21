import { createContext, type ComponentType } from 'react';
import { type OptionItem } from '../CommonTypes';

/**
 * Contribution from a parent context (typically a
 * `WidgetMiddlewarePlugin`) into the Table Options menu of any
 * descendant `<IrisGrid>` rendered via a panel host that consumes
 * this context (`IrisGridPanel`, `GridWidgetPlugin`).
 *
 * Today the contract is a single optional `transformTableOptions`
 * transform that mirrors the `IrisGrid#transformTableOptions` prop.
 * Adding a new field here is non-breaking as long as consumers treat
 * unknown keys as absent. Middleware authors that want to compose
 * with an already-present context value should read it via
 * `useContext`, merge, and publish the merged value through a new
 * Provider.
 */
export interface IrisGridTableOptionsExtension {
  transformTableOptions?: (
    defaults: readonly OptionItem[]
  ) => readonly OptionItem[];
}

/**
 * Context published by middleware authors to inject sidebar
 * extensions into descendant `<IrisGrid>` instances without having
 * to drive the `transformTableOptions` prop directly. A `null` value
 * (the default) means "no extension"; descendant consumers treat
 * that the same as an empty extension.
 */
export const IrisGridTableOptionsContext =
  createContext<IrisGridTableOptionsExtension | null>(null);

/**
 * Convenience type for plugin authors who want to type their
 * middleware's contribution explicitly.
 */
export type TableOptionsExtensionProvider = ComponentType<{
  value: IrisGridTableOptionsExtension;
  children?: React.ReactNode;
}>;
