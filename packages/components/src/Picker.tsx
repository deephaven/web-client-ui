import { Key, ReactElement, ReactNode, useMemo } from 'react';
import { Item, Picker as SpectrumPicker, Text } from '@adobe/react-spectrum';
import type { SpectrumPickerProps } from '@react-types/select';
import type { ItemProps } from '@react-types/shared';
import { PopperOptions, Tooltip } from './popper';
import stylesCommon from './SpectrumComponent.module.scss';

interface DisplayItemWithID {
  id: Key;
  display: ReactNode;
  textValue: string;
}

type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * Map a given item to an object compatible with the Picker component.
 * @param item
 * @returns DisplayItemWithID object
 */
function mapToDisplayItemWithId<TItem extends PickerItem>(
  item: TItem
): DisplayItemWithID {
  if (typeof item === 'object') {
    const id =
      item.key ??
      (typeof item.props.children === 'string'
        ? item.props.children
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          item.props.textValue!);

    return {
      id,
      display: item.props.children,
      textValue: item.props.textValue ?? String(item.props.children),
    };
  }

  return {
    id: item,
    display: String(item),
    textValue: String(item),
  };
}

/**
 * Returns a TooltipOptions object or null if options is false or null.
 * @param options
 * @returns TooltipOptions or null
 */
function normalizeToolTipOptions(
  options?: boolean | TooltipOptions | null
): PopperOptions | null {
  if (options == null || options === false) {
    return null;
  }

  if (options === true) {
    return { placement: 'top-start' };
  }

  return options;
}

type PickerItem = number | string | ReactElement<ItemProps<unknown>>;

interface PickerItemsProps<TItem extends PickerItem> {
  /** Items provided via the items prop can be primitives or Item elements */
  items: TItem[];

  // This is just here to keep items and children mutually exclusive
  children?: undefined;
}

interface PickerChildrenProps {
  /** Items provided via children prop have to be Item elements */
  children:
    | ReactElement<ItemProps<unknown>>
    | ReactElement<ItemProps<unknown>>[];

  // This is just here to keep items and children mutually exclusive
  items?: undefined;
}

export type PickerProps<TItem extends PickerItem> = (
  | PickerItemsProps<TItem>
  | PickerChildrenProps
) & {
  /* Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
} /* Support remaining SpectrumPickerProps */ & Omit<
    SpectrumPickerProps<{
      id: Key;
      display: ReactNode;
    }>,
    'children' | 'items'
  >;

export function Picker<TItem extends PickerItem>({
  children,
  items,
  tooltip,
  ...spectrumPickerProps
}: PickerProps<TItem>): JSX.Element {
  const itemsInternal = useMemo(() => {
    if (items == null) {
      return Array.isArray(children) ? children : [children];
    }

    return items;
  }, [children, items]);

  const itemsWithIds = useMemo(
    () => itemsInternal.map(mapToDisplayItemWithId),
    [itemsInternal]
  );

  const tooltipOptions = useMemo(
    () => normalizeToolTipOptions(tooltip),
    [tooltip]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumPicker label {...spectrumPickerProps} items={itemsWithIds}>
      {({ display, textValue }) => (
        <Item textValue={textValue === '' ? 'Empty' : textValue}>
          <Text UNSAFE_className={stylesCommon.spectrumEllipsis}>
            {display === '' ? (
              /* &nbsp; so that height doesn't collapse when empty */
              <>&nbsp;</>
            ) : (
              display
            )}
          </Text>
          {tooltipOptions == null || display === '' ? null : (
            <Tooltip options={tooltipOptions}>{display}</Tooltip>
          )}
        </Item>
      )}
    </SpectrumPicker>
  );
}

export default Picker;
