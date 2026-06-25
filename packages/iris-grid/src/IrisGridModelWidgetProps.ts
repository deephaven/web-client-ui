import type IrisGridModel from './IrisGridModel';

/**
 * Transform applied to the model an IrisGrid host (panel or widget) builds,
 * before it is handed to `<IrisGrid>`. Lets middleware wrap or augment the
 * host-built model (e.g. wrap it in a proxy that swaps its inner model) without
 * taking over model construction, so the middleware can stay a chained layer
 * instead of replacing the base component.
 *
 * The returned model must be a drop-in for the input — the host owns its
 * lifecycle and will call `close()` on whatever this returns. May be async to
 * allow the transform to await dependencies before returning.
 */
export type IrisGridModelTransform = (
  model: IrisGridModel
) => IrisGridModel | Promise<IrisGridModel>;

/**
 * Opt-in prop for components that build an `IrisGridModel` from a `fetch`
 * (e.g. `IrisGridPanel`, `GridWidgetPlugin`). Threaded down the middleware
 * chain so IrisGrid-aware plugins can post-process the model without it being
 * added to the generic widget/panel prop surface.
 *
 * The transform is applied when the model is (re)built, so it must be
 * referentially stable — an unstable `transformModel` will rebuild the model.
 */
export interface IrisGridModelWidgetProps {
  transformModel?: IrisGridModelTransform;
}
