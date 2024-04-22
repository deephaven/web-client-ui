import {
  ListView as SpectrumListView,
  SpectrumListViewProps,
} from '@adobe/react-spectrum';
import {
  extractSpectrumHTMLElement,
  useContentRect,
  useOnScrollRef,
} from '@deephaven/react-hooks';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import cl from 'classnames';
import { Flex } from '../layout';

export interface ListViewWrapperProps<T> extends SpectrumListViewProps<T> {
  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;
}

export function ListViewWrapper<T>({
  UNSAFE_className,
  flex,
  onScroll = EMPTY_FUNCTION,
  ...props
}: ListViewWrapperProps<T>): JSX.Element {
  // Spectrum ListView crashes when it has zero height. Track the contentRect
  // of the parent container and only render the ListView when it has a non-zero
  // height. See https://github.com/adobe/react-spectrum/issues/6213
  const { ref: contentRectRef, contentRect } = useContentRect(
    extractSpectrumHTMLElement
  );

  const scrollRef = useOnScrollRef(onScroll, extractSpectrumHTMLElement);

  return (
    <Flex
      ref={contentRectRef}
      direction="column"
      flex={flex ?? 1}
      minHeight={0}
      UNSAFE_className={cl('dh-list-view-wrapper', UNSAFE_className)}
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
          {...props}
          ref={scrollRef}
        />
      )}
    </Flex>
  );
}

export default ListViewWrapper;
