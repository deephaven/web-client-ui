import { useMemo } from 'react';
import { Item, Picker as SpectrumPicker } from '@adobe/react-spectrum';
import { Tooltip } from '../../popper';
import {
  NormalizedSpectrumPickerProps,
  normalizePickerItemList,
  normalizeTooltipOptions,
  PickerItem,
  PickerItemKey,
  TooltipOptions,
} from './PickerUtils';
import { PickerItemContent } from './PickerItemContent';

export type PickerProps = {
  children: PickerItem | PickerItem[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
  /** The currently selected key in the collection (controlled). */
  selectedKey?: PickerItemKey | null;
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: PickerItemKey;
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (key: PickerItemKey) => void;
} /*
 * Support remaining SpectrumPickerProps.
 * Note that `selectedKey`, `defaultSelectedKey`, and `onSelectionChange` are
 * re-defined above to account for boolean types which aren't included in the
 * React `key` type, but are actually supported by the Spectrum Picker component.
 */ & Omit<
  NormalizedSpectrumPickerProps,
  | 'children'
  | 'items'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
>;

/**
 * Picker component for selecting items from a list of items. Items can be
 * provided via the `items` prop or as children. Each item can be a string,
 * number, boolean, or a Spectrum <Item> element. The remaining props are just
 * pass through props for the Spectrum Picker component.
 * See https://react-spectrum.adobe.com/react-spectrum/Picker.html
 */
export function Picker({
  children,
  tooltip,
  defaultSelectedKey,
  selectedKey,
  onSelectionChange,
  ...spectrumPickerProps
}: PickerProps): JSX.Element {
  const normalizedItems = useMemo(
    () => normalizePickerItemList(children),
    [children]
  );

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumPickerProps}
      items={normalizedItems}
      // Type assertions are necessary for `selectedKey`, `defaultSelectedKey`,
      // and `onSelectionChange` due to Spectrum types not accounting for
      // `boolean` keys
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      onSelectionChange={
        onSelectionChange as NormalizedSpectrumPickerProps['onSelectionChange']
      }
    >
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
