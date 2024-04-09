import { useMemo } from 'react';
import {
  Flex,
  ListView as SpectrumListView,
  SpectrumListViewProps,
} from '@adobe/react-spectrum';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  extractSpectrumHTMLElement,
  useContentRect,
  useOnScrollRef,
} from '@deephaven/react-hooks';
import cl from 'classnames';
import {
  ItemElementOrPrimitive,
  ItemKey,
  ItemSelection,
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

  // Spectrum ListView crashes when it has zero height. Trac the contentRect
  // of the parent container and only render the ListView when it has a height.
  const { ref: contentRectRef, contentRect } = useContentRect(
    extractSpectrumHTMLElement
  );

  return (
    <Flex
      ref={contentRectRef}
      direction="column"
      flex={spectrumListViewProps.flex ?? 1}
      minHeight={0}
      UNSAFE_className={cl('dh-list-view', UNSAFE_className)}
    >
      {contentRect.height === 0 ? (
        // Ensure content has a non-zero height so that the container has a height
        // whenever it is visible. This helps differentiate when the container
        // height has been set to zero (e.g. when a tab is not visible) vs when
        // the container height has not been constrained but has not yet rendered
        // the ListView.
        <>&nbsp;</>
      ) : (
        <SpectrumListView
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...spectrumListViewProps}
          minHeight={10}
          ref={scrollRef}
          items={normalizedItems}
          selectedKeys={selectedStringKeys}
          defaultSelectedKeys={defaultSelectedStringKeys}
          disabledKeys={disabledStringKeys}
          onSelectionChange={onStringSelectionChange}
        >
          {renderNormalizedItem}
        </SpectrumListView>
      )}
    </Flex>
  );
}

export default ListView;
