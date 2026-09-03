import {
  TableView as SpectrumTableView,
  type SpectrumTableProps,
} from '@adobe/react-spectrum';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  // Ref so callback identity changes don't retrigger updateViewport or the effect
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;
  const lastRangeRef = useRef<readonly [number, number] | null>(null);

  const updateViewport = useCallback(
    (element: HTMLElement) => {
      if (
        onViewportChangeRef.current == null ||
        rowHeight == null ||
        rowHeight <= 0 ||
        itemCount <= 0
      ) {
        return;
      }
      // Prefer the row height Spectrum actually laid out over the density/scale
      // constant: at max scroll the constant under-estimates the true row
      // height and collapses the reported range to the final row.
      const effectiveRowHeight =
        element.scrollHeight > 0 ? element.scrollHeight / itemCount : rowHeight;
      const top = Math.min(
        itemCount - 1,
        Math.max(0, Math.floor(element.scrollTop / effectiveRowHeight))
      );
      const visibleRowCount = Math.max(
        1,
        Math.ceil(element.clientHeight / effectiveRowHeight)
      );
      const bottom = Math.max(
        top,
        Math.min(itemCount - 1, top + visibleRowCount)
      );
      const last = lastRangeRef.current;
      if (last != null && last[0] === top && last[1] === bottom) {
        return;
      }
      lastRangeRef.current = [top, bottom];
      onViewportChangeRef.current(top, bottom);
    },
    [itemCount, rowHeight]
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
    if (scrollElement == null) {
      return undefined;
    }
    lastRangeRef.current = null;
    updateViewport(scrollElement);
    const resizeObserver = new ResizeObserver(() => {
      updateViewport(scrollElement);
    });
    resizeObserver.observe(scrollElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollElement, updateViewport]);

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
