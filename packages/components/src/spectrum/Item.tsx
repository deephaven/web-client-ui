/**
 * Wrapping Spectrum `Item` components will break functionality due to the way
 * they are consumed by collection components. They are only used to pass data
 * and don't render anything on their own, so they don't need to be wrapped.
 * See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Item.ts#L17
 */
import { Item } from '@adobe/react-spectrum';

export type { ItemProps } from '@react-types/shared';

export { Item };

export default Item;
