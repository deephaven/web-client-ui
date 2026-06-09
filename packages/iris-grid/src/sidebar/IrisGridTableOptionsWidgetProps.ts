import { type OptionItem } from '../CommonTypes';

/**
 * Transform applied to the built-in Table Options items before they are
 * rendered. Receives the items already filtered by what the current model
 * supports and returns the items to actually render. Must be referentially
 * stable and side-effect-free (it's called inside memoization).
 */
export type TableOptionsTransform = (
  defaults: readonly OptionItem[]
) => readonly OptionItem[];

/**
 * Opt-in props for components that wrap `<IrisGrid>` (e.g. `IrisGridPanel`,
 * `GridWidgetPlugin`). Threaded down the middleware chain so IrisGrid-aware
 * hosts can forward the transform to `IrisGrid#transformTableOptions`
 * without it being added to the generic widget/panel prop surface.
 *
 * Middleware authors compose by reading the incoming `transformTableOptions`,
 * running it first, layering their own changes on top, and forwarding the
 * composed transform to the next component in the chain.
 */
export interface IrisGridTableOptionsWidgetProps {
  transformTableOptions?: TableOptionsTransform;
}

export default IrisGridTableOptionsWidgetProps;
