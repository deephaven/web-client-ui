import { useMemo } from 'react';
import { SpectrumListViewProps } from '@adobe/react-spectrum';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  ItemKey,
  ItemSelection,
  NormalizedItem,
  normalizeTooltipOptions,
  TooltipOptions,
  wrapItemChildren,
} from '../utils';
import { ListViewWrapper } from './ListViewWrapper';
import { ItemElementOrPrimitive } from '../shared';

export type ListViewProps = {
  children: ItemElementOrPrimitive | ItemElementOrPrimitive[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
  selectedKeys?: 'all' | Iterable<ItemKey>;
  defaultSelectedKeys?: 'all' | Iterable<ItemKey>;
  disabledKeys?: Iterable<ItemKey>;
  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (keys: ItemSelection) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (keys: ItemSelection) => void;
} & Omit<
  SpectrumListViewProps<NormalizedItem>,
  | 'children'
  | 'items'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'disabledKeys'
  | 'onSelectionChange'
>;

export function ListView({
  children,
  tooltip = true,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  UNSAFE_className,
  onChange,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange,
  ...spectrumListViewProps
}: ListViewProps): JSX.Element | null {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip, 'bottom'),
    [tooltip]
  );

  const wrappedItems = useMemo(
    () => wrapItemChildren(children, tooltipOptions),
    [children, tooltipOptions]
  );

  return (
    <ListViewWrapper
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumListViewProps}
      UNSAFE_className="dh-list-view"
      onScroll={onScroll}
    >
      {wrappedItems}
    </ListViewWrapper>
  );
}

export default ListView;
