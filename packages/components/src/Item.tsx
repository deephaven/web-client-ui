import { Fragment, ReactNode } from 'react';

export interface ItemProps<TID extends number | string> {
  id: TID;
  children: ReactNode;
}

/**
 * General item component that can be used in a collection component such as a
 * Picker.
 */
export function Item<TID extends number | string>({
  id,
  children,
}: ItemProps<TID>): JSX.Element {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <Fragment key={id}>{children}</Fragment>;
}

export default Item;
