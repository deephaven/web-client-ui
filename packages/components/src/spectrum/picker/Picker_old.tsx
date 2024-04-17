import { useMemo } from 'react';

import {
  normalizeTooltipOptions,
  TooltipOptions,
  isNormalizedItemsWithKeysList,
} from '../utils/itemUtils';
import { PickerCommonProps } from './PickerModel';
import { PickerFromChildrenProps, PickerFromChildren } from './Picker';
import PickerFromItems, { PickerFromItemsProps } from './PickerFromItems';

export type PickerProps = {
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;

  /** Function to retrieve initial scroll position when opening the picker */
  // getInitialScrollPosition?: () => Promise<number | null>;
} & PickerCommonProps &
  (
    | { children: PickerFromChildrenProps['children'] }
    | {
        children: PickerFromItemsProps['items'];
        getInitialScrollPosition: () => Promise<number | null | undefined>;
      }
  );

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
  // defaultSelectedKey,
  // selectedKey,
  // onChange,
  // onOpenChange,
  // onSelectionChange,
  // eslint-disable-next-line camelcase
  UNSAFE_className,
  ...props
}: PickerProps): JSX.Element {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  // const [uncontrolledSelectedKey, setUncontrolledSelectedKey] =
  //   useState(defaultSelectedKey);

  // const getInitialScrollPositionInternal = useCallback(async () => {
  //   if (getInitialScrollPosition != null) {
  //     return getInitialScrollPosition();
  //   }

  //   if (isNormalizedItemsWithKeysList(children)) {
  //     return null;
  //   }

  //   return getPositionOfSelectedItemElement({
  //     children: wrapItemChildren(children, tooltipOptions),
  //     itemHeight: PICKER_ITEM_HEIGHTS.noDescription,
  //     itemHeightWithDescription: PICKER_ITEM_HEIGHTS.withDescription,
  //     selectedKey: selectedKey ?? uncontrolledSelectedKey,
  //     topOffset: PICKER_TOP_OFFSET,
  //   });
  // }, [
  //   children,
  //   getInitialScrollPosition,
  //   selectedKey,
  //   tooltipOptions,
  //   uncontrolledSelectedKey,
  // ]);

  // const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
  //   usePickerScrollOnOpen({
  //     getInitialScrollPosition: getInitialScrollPositionInternal,
  //     onScroll,
  //     onOpenChange,
  //   });

  // const onChangeInternal = useCallback(
  //   (key: ItemKey): void => {
  //     // If our component is uncontrolled, track the selected key internally
  //     if (selectedKey == null) {
  //       setUncontrolledSelectedKey(key);
  //     }

  //     (onChange ?? onSelectionChange)?.(key);
  //   },
  //   [onChange, onSelectionChange, selectedKey]
  // );

  return isNormalizedItemsWithKeysList(children) ? (
    <PickerFromItems
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...(props as PickerFromItemsProps)}
      items={children}
      tooltipOptions={tooltipOptions}
    />
  ) : (
    <PickerFromChildren
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      tooltipOptions={tooltipOptions}
    >
      {children}
    </PickerFromChildren>
  );

  // return (
  //   <SpectrumPicker
  //     // eslint-disable-next-line react/jsx-props-no-spreading
  //     {...spectrumPickerProps}
  //     ref={scrollRef as unknown as DOMRef<HTMLDivElement>}
  //     onOpenChange={onOpenChangeInternal}
  //     UNSAFE_className={cl('dh-picker', UNSAFE_className)}
  //     items={normalizedItems}
  //     // Spectrum Picker treats keys as strings if the `key` prop is explicitly
  //     // set on `Item` elements. Since we do this in `renderItem`, we need to
  //     // ensure that `selectedKey` and `defaultSelectedKey` are strings in order
  //     // for selection to work.
  //     selectedKey={selectedKey == null ? selectedKey : selectedKey.toString()}
  //     defaultSelectedKey={
  //       defaultSelectedKey == null
  //         ? defaultSelectedKey
  //         : defaultSelectedKey.toString()
  //     }
  //     // `onChange` is just an alias for `onSelectionChange`
  //     onSelectionChange={
  //       onSelectionChangeInternal as NormalizedSpectrumPickerProps['onSelectionChange']
  //     }
  //   >
  //     {itemOrSection => {
  //       if (isNormalizedSection(itemOrSection)) {
  //         return (
  //           <Section
  //             key={getItemKey(itemOrSection)}
  //             title={itemOrSection.item?.title}
  //             items={itemOrSection.item?.items}
  //           >
  //             {renderNormalizedItem}
  //           </Section>
  //         );
  //       }

  //       return renderNormalizedItem(itemOrSection);
  //     }}
  //   </SpectrumPicker>
  // );
}

export default Picker;
