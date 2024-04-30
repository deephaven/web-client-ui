import {
  ListView as SpectrumListView,
  SpectrumListViewProps,
} from '@adobe/react-spectrum';
import {
  extractSpectrumHTMLElement,
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

  return (
    <Flex
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
      <SpectrumListView
        ref={scrollRef}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...ariaLabelProps}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...listViewProps}
      />
    </Flex>
  );
}

export default ListViewWrapper;
