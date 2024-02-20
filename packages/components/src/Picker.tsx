import { ReactElement, ReactNode, useMemo } from 'react';
import {
  Item as SpectrumItem,
  Picker as SpectrumPicker,
} from '@adobe/react-spectrum';
import type { SpectrumPickerProps } from '@react-types/select';
import type { ItemProps } from './Item';

function mapItem<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
>(
  item: TItem
): {
  id: TID;
  display: ReactNode;
} {
  return typeof item === 'object'
    ? { id: item.props.id, display: item.props.children }
    : { id: item as TID, display: String(item) };
}

export type PickerProps<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
> = (
  | {
      // Items provided via the items prop can be primitives or Item elements
      items: TItem[];
      children?: undefined;
    }
  | {
      // Items provided via children prop have to be Item elements
      children: ReactElement<ItemProps<TID>> | ReactElement<ItemProps<TID>>[];
      items?: undefined;
    }
) &
  Omit<
    SpectrumPickerProps<{
      id: TID;
      display: ReactNode;
    }>,
    'children' | 'items'
  >;

export function Picker<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
>({
  children,
  items,
  ...spectrumPickerProps
}: PickerProps<TID, TItem>): JSX.Element {
  const itemsInternal = useMemo(() => {
    if (items == null) {
      return Array.isArray(children) ? children : [children];
    }

    return items;
  }, [children, items]);

  const itemsWithIds = useMemo(
    () => itemsInternal.map(mapItem),
    [itemsInternal]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumPicker label {...spectrumPickerProps} items={itemsWithIds}>
      {({ display }) => <SpectrumItem>{display}</SpectrumItem>}
    </SpectrumPicker>
  );
}

export default Picker;
