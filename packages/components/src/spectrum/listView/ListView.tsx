import { useMemo } from 'react';
import {
  ListView as SpectrumListView,
  SpectrumListViewProps,
} from '@adobe/react-spectrum';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  extractSpectrumHTMLElement,
  useOnScrollRef,
} from '@deephaven/react-hooks';
import cl from 'classnames';
import {
  ItemElementOrPrimitive,
  ItemKey,
  NormalizedItem,
  normalizeItemList,
  normalizeTooltipOptions,
  TooltipOptions,
  useRenderNormalizedItem,
  useStringifiedMultiSelection,
} from '../utils';

export type ListViewProps = {
  children:
    | ItemElementOrPrimitive
    | ItemElementOrPrimitive[]
    | NormalizedItem[];
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
  onChange?: (keys: 'all' | Set<ItemKey>) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (keys: 'all' | Set<ItemKey>) => void;
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
}: ListViewProps): JSX.Element {
  const normalizedItems = useMemo(
    () => normalizeItemList(children),
    [children]
  );

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip, 'bottom'),
    [tooltip]
  );

  const renderNormalizedItem = useRenderNormalizedItem(tooltipOptions);

  const {
    selectedStringKeys,
    defaultSelectedStringKeys,
    disabledStringKeys,
    onStringSelectionChange,
  } = useStringifiedMultiSelection({
    normalizedItems,
    selectedKeys,
    defaultSelectedKeys,
    disabledKeys,
    onChange: onChange ?? onSelectionChange,
  });

  const scrollRef = useOnScrollRef(onScroll, extractSpectrumHTMLElement);

  return (
    <SpectrumListView
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumListViewProps}
      ref={scrollRef}
      UNSAFE_className={cl('dh-list-view', UNSAFE_className)}
      items={normalizedItems}
      selectedKeys={selectedStringKeys}
      defaultSelectedKeys={defaultSelectedStringKeys}
      disabledKeys={disabledStringKeys}
      onSelectionChange={onStringSelectionChange}
    >
      {renderNormalizedItem}
    </SpectrumListView>
  );
}

export default ListView;
