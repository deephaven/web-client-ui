import { useMemo } from 'react';
import cl from 'classnames';
import {
  ListView as SpectrumListView,
  SpectrumListViewProps,
} from '@adobe/react-spectrum';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  extractSpectrumHTMLElement,
  useContentRect,
  useOnScrollRef,
} from '@deephaven/react-hooks';
import { Flex } from '../layout';
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

  // Spectrum ListView crashes when it has zero height. Track the contentRect
  // of the parent container and only render the ListView when it has a non-zero
  // height. See https://github.com/adobe/react-spectrum/issues/6213
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
        // Use &nbsp; to ensure content has a non-zero height. This ensures the
        // container will also have a non-zero height unless its height is
        // explicitly set to zero. Example use case:
        // 1. Tab containing ListView is visible. Container height is non-zero.
        //    ListView is rendered.
        // 2. Tab is hidden. Container height is explicitly constrained to zero.
        //    ListView is not rendered.
        // 3. Tab is shown again. Height constraint is removed. Resize observer
        //    fires and shows non-zero height due to the &nbsp; (without this,
        //    the height would remain zero forever since ListView hasn't rendered yet)
        // 4. ListView is rendered again.
        <>&nbsp;</>
      ) : (
        <SpectrumListView
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...spectrumListViewProps}
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
