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

/**
 * Spectrum SectionProps augmented with support for primitive item children.
 */
export type SectionProps<T> = Omit<SpectrumSectionProps<T>, 'children'> & {
  children:
    | ItemElement<T>
    | ItemElement<T>[]
    | ItemRenderer<T>
    | ItemElementOrPrimitive<T>
    | ItemElementOrPrimitive<T>[];
};

/**
 * Re-export Spectrum Section component with augmented props type.
 */
export const Section = SpectrumSection as <T>(
  props: SectionProps<T>
) => JSX.Element;
