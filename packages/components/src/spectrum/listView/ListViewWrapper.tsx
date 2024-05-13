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

/**
 * Helper component to wrap a ListView with the appropriate styling + scroll
 * handling. This is used by both the `@deephaven/components` `ListView` and
 * the `@deephaven/jsapi-components` `ListView` (via `ListViewNormalized`) to
 * ensure consistency.
 *
 * Note that This component will usually not be used directly. Instead, it is
 * recommended to use
 * - `@deephaven/components`'s `ListView` for non-table data sources
 * - `@deephaven/jsapi-components`'s `ListView` for table data sources
 */
export function ListViewWrapper<T>(
  props: ListViewWrapperProps<T>
): JSX.Element {
  const { ariaLabelProps, componentProps, styleProps } =
    separateSpectrumProps(props);

  const { onScroll = EMPTY_FUNCTION, ...listViewProps } = componentProps;

  const { scale } = useSpectrumThemeProvider();

  const scrollRef = useOnScrollRef(onScroll, extractSpectrumHTMLElement);

  // Spectrum ListView crashes when it has zero height. Track the contentRect
  // of the parent container and only render the ListView when it has a non-zero
  // height. See https://github.com/adobe/react-spectrum/issues/6213
  const { ref: contentRectRef, contentRect } = useContentRect(
    extractSpectrumHTMLElement
  );

  return (
    <Flex
      direction="column"
      ref={contentRectRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      // Set min-height to 1px so that `ListView` is rendered whenever container
      // is visible. This prevents the height from shrinking to zero as a result
      // of a parent grid or flex container calculating content sizes. The
      // container height can still be zero when it is not being displayed such
      // as when one of its parents have `display: none`.
      minHeight={styleProps.minHeight ?? 1}
      UNSAFE_className={cl(
        'dh-list-view-wrapper',
        `dh-list-view-wrapper-density-${listViewProps.density ?? 'regular'}`,
        `dh-list-view-wrapper-scale-${scale}`,
        styleProps.UNSAFE_className
      )}
    >
      {/**
       * Only render ListView if parent is visible. Some time in the future we
       * should consider using `checkVisibility()` once it has better browser
       * support.
       */}
      {contentRect.height === 0 ? null : (
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
