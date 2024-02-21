import { Key, ReactNode, useMemo } from 'react';
import { Item, Picker as SpectrumPicker, Text } from '@adobe/react-spectrum';
import type { SpectrumPickerProps } from '@react-types/select';
import { Tooltip } from '../popper';
import {
  getNormalizedPickerItemsFromProps,
  normalizeToolTipOptions,
  PickerChildrenOrItemsProps,
  TooltipOptions,
} from './PickerUtils';
import stylesCommon from '../SpectrumComponent.module.scss';

export type PickerProps = PickerChildrenOrItemsProps & {
  /* Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
} /* Support remaining SpectrumPickerProps */ & Omit<
    SpectrumPickerProps<{
      id: Key;
      display: ReactNode;
    }>,
    'children' | 'items'
  >;

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
