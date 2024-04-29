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
import { useSpectrumThemeProvider } from '../../theme';
import { Flex } from '../layout';
import { separateSpectrumProps } from '../utils';
import './ListViewWrapper.scss';

export interface ListViewWrapperProps<T> extends SpectrumListViewProps<T> {
  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;
}

export function ListViewWrapper<T>(
  props: ListViewWrapperProps<T>
): JSX.Element {
  const { ariaLabelProps, componentProps, styleProps } =
    separateSpectrumProps(props);

  const { onScroll = EMPTY_FUNCTION, ...listViewProps } = componentProps;

  const { scale } = useSpectrumThemeProvider();

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
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      UNSAFE_className={cl(
        'dh-list-view-wrapper',
        `dh-list-view-wrapper-density-${listViewProps.density ?? 'regular'}`,
        `dh-list-view-wrapper-scale-${scale}`,
        styleProps.UNSAFE_className
      )}
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
          ref={scrollRef}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...ariaLabelProps}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...listViewProps}
        />
      )}
    </Flex>
  );
}

export default ListViewWrapper;
