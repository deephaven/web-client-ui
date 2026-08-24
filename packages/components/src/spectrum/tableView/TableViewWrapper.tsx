import {
  TableView as SpectrumTableView,
  type SpectrumTableProps,
} from '@adobe/react-spectrum';
import { useCallback, useEffect, useState } from 'react';
import type { DOMRefValue } from '@react-types/shared';
import {
  extractSpectrumLastChildHTMLElement,
  useOnScrollRef,
} from '@deephaven/react-hooks';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import cl from 'classnames';
import { useSpectrumThemeProvider } from '../../theme';
import './TableViewWrapper.scss';

export interface TableViewWrapperProps<T> extends SpectrumTableProps<T> {
  /** Total number of logical rows represented by a windowed collection. */
  itemCount?: number;
  /** Handler that is called when the table body is scrolled. */
  onScroll?: (event: Event) => void;
  /** Handler that is called when the visible row range changes. */
  onViewportChange?: (top: number, bottom: number) => void;
  /** Fixed row height used to calculate the visible viewport. */
  rowHeight?: number;
}

/**
 * Wraps a Spectrum TableView with consistent sizing and scroll handling.
 * Table data wrappers can provide windowed items while sharing the same
 * Spectrum integration.
 */
export function TableViewWrapper<T>(
  props: TableViewWrapperProps<T>
): JSX.Element {
  const {
    itemCount = 0,
    onScroll = EMPTY_FUNCTION,
    onViewportChange,
    rowHeight,
    UNSAFE_className,
    ...tableViewProps
  } = props;
  const { scale } = useSpectrumThemeProvider();
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  const updateViewport = useCallback(
    (element: HTMLElement) => {
      if (
        onViewportChange == null ||
        rowHeight == null ||
        rowHeight <= 0 ||
        itemCount <= 0
      ) {
        return;
      }
      const top = Math.max(0, Math.floor(element.scrollTop / rowHeight));
      const visibleRowCount = Math.max(
        1,
        Math.ceil(element.clientHeight / rowHeight)
      );
      const bottom = Math.max(
        top,
        Math.min(itemCount - 1, top + visibleRowCount)
      );
      onViewportChange(top, bottom);
    },
    [itemCount, onViewportChange, rowHeight]
  );

  const handleScroll = useCallback(
    (event: Event) => {
      onScroll(event);
      updateViewport(event.target as HTMLElement);
    },
    [onScroll, updateViewport]
  );

  const scrollRef = useOnScrollRef(
    handleScroll,
    extractSpectrumLastChildHTMLElement
  );
  const tableViewRef = useCallback(
    (ref: DOMRefValue<HTMLDivElement> | null) => {
      scrollRef(ref);
      setScrollElement(extractSpectrumLastChildHTMLElement(ref));
    },
    [scrollRef]
  );

  useEffect(() => {
    if (scrollElement == null || onViewportChange == null) {
      return undefined;
    }
    updateViewport(scrollElement);
    const resizeObserver = new ResizeObserver(() => {
      updateViewport(scrollElement);
    });
    resizeObserver.observe(scrollElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [onViewportChange, scrollElement, updateViewport]);

  return (
    <SpectrumTableView
      ref={tableViewRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...tableViewProps}
      UNSAFE_className={cl(
        'dh-table-view-wrapper',
        `dh-table-view-wrapper-density-${tableViewProps.density ?? 'regular'}`,
        `dh-table-view-wrapper-scale-${scale}`,
        UNSAFE_className
      )}
    />
  );
}

export default TableViewWrapper;
