/**
 * Wrapping Spectrum `Item` and `Section` components will break functionality
 * due to the way they are consumed by collection components. They are only used
 * to pass data and don't render anything on their own, so they don't need to be
 * wrapped. If we do ever need to wrap them for whatever reason, the static
 * `getCollectionNode` method will need to be implemented.
 * See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Item.ts#L17
 *     https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Section.ts#L18
 */
export { Item, Section } from '@adobe/react-spectrum';
export type { ItemProps, SectionProps } from '@react-types/shared';
