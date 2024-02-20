import { ReactElement, ReactNode, useMemo } from 'react';
import {
  Item as SpectrumItem,
  Picker as SpectrumPicker,
  Text,
} from '@adobe/react-spectrum';
import type { SpectrumPickerProps } from '@react-types/select';
import type { ItemProps } from './Item';
import { PopperOptions, Tooltip } from './popper';
import stylesCommon from './SpectrumComponent.module.scss';

interface DisplayItemWithID<TID extends number | string> {
  id: TID;
  display: ReactNode;
}

type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * Map a given item to an object compatible with the Picker component.
 * @param item
 * @returns DisplayItemWithID object
 */
function mapToDisplayItemWithId<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
>(item: TItem): DisplayItemWithID<TID> {
  return typeof item === 'object'
    ? { id: item.props.id, display: item.props.children }
    : { id: item as TID, display: String(item) };
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

export type PickerProps<
  TID extends number | string,
  TItem extends TID | ReactElement<ItemProps<TID>>,
> = (
  | {
      /* Items provided via the items prop can be primitives or Item elements */
      items: TItem[];
      children?: undefined;
    }
  | {
      /* Items provided via children prop have to be Item elements */
      children: ReactElement<ItemProps<TID>> | ReactElement<ItemProps<TID>>[];
      items?: undefined;
    }
) & {
  /* Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
} /* Support remaining SpectrumPickerProps */ & Omit<
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
  tooltip,
  ...spectrumPickerProps
}: PickerProps<TID, TItem>): JSX.Element {
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
      {({ display }) => (
        <SpectrumItem>
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
        </SpectrumItem>
      )}
    </SpectrumPicker>
  );
}

export default Picker;
