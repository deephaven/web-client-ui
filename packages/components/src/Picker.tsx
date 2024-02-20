import {
  Item as SpectrumItem,
  Picker as SpectrumPicker,
} from '@adobe/react-spectrum';
import { ReactElement, useMemo } from 'react';
import type { ItemProps } from './Item';

export interface PickerProps<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
> {
  items: TItem[];
}

export function Picker<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
>({ items }: PickerProps<TID, TItem>): JSX.Element {
  const itemsWithKeys = useMemo(
    () =>
      items.map(item =>
        typeof item === 'object'
          ? { id: item.props.id, display: item.props.children }
          : { id: item, display: String(item) }
      ),
    [items]
  );

  return (
    <SpectrumPicker items={itemsWithKeys}>
      {({ display }) => <SpectrumItem>{display}</SpectrumItem>}
    </SpectrumPicker>
  );
}

export default Picker;
