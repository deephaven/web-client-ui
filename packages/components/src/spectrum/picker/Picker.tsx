import { useMemo } from 'react';
import { Item, Picker as SpectrumPicker } from '@adobe/react-spectrum';
import type { SpectrumPickerProps } from '@react-types/select';
import { Tooltip } from '../../popper';
import {
  getNormalizedPickerItemsFromProps,
  NormalizedPickerItem,
  normalizeTooltipOptions,
  PickerChildrenOrItemsProps,
  TooltipOptions,
} from './PickerUtils';
import { PickerItemContent } from './PickerItemContent';

export type PickerProps = PickerChildrenOrItemsProps & {
  /* Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
} /* Support remaining SpectrumPickerProps */ & Omit<
    SpectrumPickerProps<NormalizedPickerItem>,
    'children' | 'items'
  >;

/**
 * Picker component for selecting items from a list of items. Items can be
 * provided via the `items` prop or as children. Each item can be a string,
 * number, or a Spectrum <Item> element. The remaining props are just pass
 * through props for the Spectrum Picker component.
 * See https://react-spectrum.adobe.com/react-spectrum/Picker.html
 */
export function Picker({
  children,
  items,
  tooltip,
  ...spectrumPickerProps
}: PickerProps): JSX.Element {
  const normalizedItems = useMemo(
    () =>
      getNormalizedPickerItemsFromProps({
        children,
        items,
      } as PickerChildrenOrItemsProps),
    [children, items]
  );

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumPicker label {...spectrumPickerProps} items={normalizedItems}>
      {({ content, textValue }) => (
        <Item textValue={textValue === '' ? 'Empty' : textValue}>
          <PickerItemContent>{content}</PickerItemContent>
          {tooltipOptions == null || content === '' ? null : (
            <Tooltip options={tooltipOptions}>{content}</Tooltip>
          )}
        </Item>
      )}
    </SpectrumPicker>
  );
}

export default Picker;
