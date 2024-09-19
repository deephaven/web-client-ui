import { useMemo } from 'react';
import { type SpectrumListViewProps } from '@adobe/react-spectrum';
import cl from 'classnames';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  type MultipleItemSelectionProps,
  type NormalizedItem,
  normalizeTooltipOptions,
  type TooltipOptions,
  wrapItemChildren,
} from '../utils';
import { ListViewWrapper, type ListViewWrapperProps } from './ListViewWrapper';
import { type ItemElementOrPrimitive } from '../shared';

export type ListViewProps = MultipleItemSelectionProps & {
  children: ItemElementOrPrimitive | ItemElementOrPrimitive[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;
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
      UNSAFE_className={cl('dh-list-view', UNSAFE_className)}
      selectedKeys={
        selectedKeys as ListViewWrapperProps<unknown>['selectedKeys']
      }
      defaultSelectedKeys={
        defaultSelectedKeys as ListViewWrapperProps<unknown>['defaultSelectedKeys']
      }
      disabledKeys={
        disabledKeys as ListViewWrapperProps<unknown>['disabledKeys']
      }
      onScroll={onScroll}
      onSelectionChange={onChange ?? onSelectionChange}
    >
      {wrappedItems}
    </ListViewWrapper>
  );
}

export default ListView;
