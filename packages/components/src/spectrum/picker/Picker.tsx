import { Key, useCallback, useMemo } from 'react';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import cl from 'classnames';
import { Tooltip } from '../../popper';
import {
  NormalizedSpectrumPickerProps,
  normalizePickerItemList,
  normalizeTooltipOptions,
  PickerItemOrSection,
  PickerItemKey,
  TooltipOptions,
  NormalizedPickerItem,
  isNormalizedPickerSection,
} from './PickerUtils';
import { PickerItemContent } from './PickerItemContent';
import { Item } from '../Item';
import { Section } from '../Section';

export type PickerProps = {
  children: PickerItemOrSection | PickerItemOrSection[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
  /** The currently selected key in the collection (controlled). */
  selectedKey?: PickerItemKey | null;
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: PickerItemKey;
  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: PickerItemKey) => void;
  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: PickerItemKey) => void;
} /*
 * Support remaining SpectrumPickerProps.
 * Note that `selectedKey`, `defaultSelectedKey`, and `onSelectionChange` are
 * re-defined above to account for boolean types which aren't included in the
 * React `Key` type, but are actually supported by the Spectrum Picker component.
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
  tooltip = true,
  defaultSelectedKey,
  selectedKey,
  onChange,
  onSelectionChange,
  // eslint-disable-next-line camelcase
  UNSAFE_className,
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

  const renderItem = useCallback(
    ({ key, content, textValue }: NormalizedPickerItem) => (
      // The `textValue` prop gets used to provide the content of `<option>`
      // elements that back the Spectrum Picker. These are not visible in the UI,
      // but are used for accessibility purposes, so we set to an arbitrary
      // 'Empty' value so that they are not empty strings.
      <Item key={key as Key} textValue={textValue === '' ? 'Empty' : textValue}>
        <PickerItemContent>{content}</PickerItemContent>
        {tooltipOptions == null || content === '' ? null : (
          <Tooltip options={tooltipOptions}>
            {typeof content === 'boolean' ? String(content) : content}
          </Tooltip>
        )}
      </Item>
    ),
    [tooltipOptions]
  );

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumPickerProps}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      items={normalizedItems}
      // Type assertions are necessary for `selectedKey`, `defaultSelectedKey`,
      // and `onSelectionChange` due to Spectrum types not accounting for
      // `boolean` keys
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      // `onChange` is just an alias for `onSelectionChange`
      onSelectionChange={
        (onChange ??
          onSelectionChange) as NormalizedSpectrumPickerProps['onSelectionChange']
      }
    >
      {itemOrSection => {
        if (isNormalizedPickerSection(itemOrSection)) {
          return (
            <Section
              key={itemOrSection.key}
              title={itemOrSection.title}
              items={itemOrSection.items}
            >
              {renderItem}
            </Section>
          );
        }

        return renderItem(itemOrSection);
      }}
    </SpectrumPicker>
  );
}

export default Picker;
