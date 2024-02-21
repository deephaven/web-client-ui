import { ReactNode } from 'react';

interface TextItemProps<TID extends number | string> {
  id: TID;
  children: string;
  textValue?: string;
}

interface NodeItemProps<TID extends number | string> {
  id: TID;
  children: ReactNode;
  /** Non text items require a `textValue` */
  textValue: string;
}

export type ItemProps<TID extends number | string> =
  | TextItemProps<TID>
  | NodeItemProps<TID>;

/**
 * General item component that can be used in a collection component such as a
 * Picker. It is not directly rendered, but it's props will be used by the
 * parent component to render the item (see Picker component for an example).
 */
export function Item<TID extends number | string>(
  _props: ItemProps<TID>
): null {
  // This shouldn't be rendered directly, only used in a collection component
  return null;
}

export default Item;
