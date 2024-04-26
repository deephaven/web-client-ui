/**
 * Wrapping Spectrum `Item` and `Section` components will break functionality
 * due to the way they are consumed by collection components. They are only used
 * to pass data and don't render anything on their own, so they don't need to be
 * wrapped. If we do ever need to wrap them for whatever reason, the static
 * `getCollectionNode` method will need to be implemented.
 * See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Item.ts#L17
 *     https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Section.ts#L18
 */
import { Section as SpectrumSection } from '@adobe/react-spectrum';
import type {
  ItemElement,
  ItemRenderer,
  SectionProps as SpectrumSectionProps,
} from '@react-types/shared';

export { Item } from '@adobe/react-spectrum';
export type { ItemProps } from '@react-types/shared';

/*
 * We support primitive values as shorthand for `Item` elements in certain
 * components. This type represents this augmentation of the Spectrum types.
 */
export type ItemElementOrPrimitive<T = unknown> =
  | number
  | string
  | boolean
  | ItemElement<T>;

export type ItemsChildren<T> =
  | ItemElement<T>
  | ItemElement<T>[]
  | ItemRenderer<T>;

export type ItemsOrPrimitiveChildren<T> =
  | ItemElementOrPrimitive<T>
  | ItemElementOrPrimitive<T>[]
  | ItemRenderer<T>;

// export type AugmentItemChildrenWithPrimitives<
//   T,
//   U extends T extends {
//     children: ItemsChildren<infer A>;
//   }
//     ? A
//     : never = T extends {
//     children: ItemsChildren<infer A>;
//   }
//     ? A
//     : never,
// > = Omit<T, 'children'> & {
//   children: ItemsOrPrimitiveChildren<U>;
// };

// /**
//  * Spectrum SectionProps augmented with support for primitive item children.
//  */
// export type SectionProps<T> = AugmentItemChildrenWithPrimitives<
//   SpectrumSectionProps<T>
// >;

/**
 * Spectrum SectionProps augmented with support for primitive item children.
 */
export type SectionProps<T> = Omit<SpectrumSectionProps<T>, 'children'> & {
  children: ItemsOrPrimitiveChildren<T>;
};

/**
 * Re-export Spectrum Section component with augmented props type.
 */
export const Section = SpectrumSection as <T>(
  props: SectionProps<T>
) => JSX.Element;
