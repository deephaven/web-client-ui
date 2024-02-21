import { Key, ReactElement, ReactNode, useMemo } from 'react';
import { Item, Picker as SpectrumPicker, Text } from '@adobe/react-spectrum';
import type { SpectrumPickerProps } from '@react-types/select';
import type { ItemProps } from '@react-types/shared';
import { PopperOptions, Tooltip } from './popper';
import stylesCommon from './SpectrumComponent.module.scss';

type ItemElement = ReactElement<ItemProps<unknown>>;
type PickerItem = number | string | ItemElement;

interface NormalizedItem {
  key: Key;
  display: ReactNode;
  textValue: string;
}

type TooltipOptions = { placement: PopperOptions['placement'] };

function getItemKey(item: PickerItem): Key {
  if (typeof item !== 'object') {
    return String(item);
  }

  if (item.key != null) {
    return item.key;
  }

  if (typeof item.props.children === 'string') {
    return item.props.children;
  }

  return item.props.textValue ?? '';
}

function getTextValue(item: PickerItem): string {
  if (typeof item !== 'object') {
    return String(item);
  }

  if (item.props.textValue != null) {
    return item.props.textValue;
  }

  if (typeof item.props.children === 'string') {
    return item.props.children;
  }

  return '';
}

/**
 * Normalize a picker item to an object form.
 * @param item item to normalize
 * @returns NormalizedItem object
 */
function normalizeItem<TItem extends PickerItem>(item: TItem): NormalizedItem {
  const key = getItemKey(item);
  const display = typeof item === 'object' ? item.props.children : String(item);
  const textValue = getTextValue(item);

  return {
    key,
    display,
    textValue,
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

interface PickerItemsProps<TItem extends PickerItem> {
  /** Items provided via the items prop can be primitives or Item elements */
  items: TItem[];

  // This is just here to keep items and children mutually exclusive
  children?: undefined;
}

interface PickerChildrenProps {
  /** Items provided via children prop have to be Item elements */
  children: ItemElement | ItemElement[];

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

  const normalizedItems = useMemo(
    () => itemsInternal.map(normalizeItem),
    [itemsInternal]
  );

  const tooltipOptions = useMemo(
    () => normalizeToolTipOptions(tooltip),
    [tooltip]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumPicker label {...spectrumPickerProps} items={normalizedItems}>
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
