import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import clamp from 'lodash.clamp';
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder,
} from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsChevronRight, vsChevronLeft } from '@deephaven/icons';
import { useResizeObserver } from '@deephaven/react-hooks';
import DragUtils from '../DragUtils';
import Button from '../Button';
import NavTab from './NavTab';

// mouse hold timeout to act as hold instead of click
const CLICK_TIMEOUT = 500;

// mouse hold acceleration
const START_SPEED = 0.01;
const ACCELERATION = 0.0005;

export interface NavTabItem {
  key: string;
  title: string;
  isClosable?: boolean;
}

type NavTabListProps = {
  activeKey: string;
  tabs: NavTabItem[];
  onSelect: (key: string) => void;
  onClose: (key: string) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  isReorderAllowed: boolean;
};

function isScrolledLeft(element: HTMLElement): boolean {
  return element.scrollLeft === 0;
}

function isScrolledRight(element: HTMLElement): boolean {
  return (
    element.scrollLeft + element.clientWidth === element.scrollWidth ||
    element.scrollWidth === 0
  );
}

function NavTabList({
  activeKey,
  tabs,
  onSelect,
  onReorder,
  onClose,
  isReorderAllowed,
}: NavTabListProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>();
  const [isOverflowing, setIsOverflowing] = useState(true);
  const [disableScrollLeft, setDisableScrollLeft] = useState(true);
  const [disableScrollRight, setDisableScrollRight] = useState(true);
  const handleResize = useCallback(() => {
    if (containerRef.current == null) {
      return;
    }

    if (
      containerRef.current.clientWidth < containerRef.current.scrollWidth &&
      tabs.length > 0
    ) {
      setIsOverflowing(true);
    } else {
      setIsOverflowing(false);
    }

    setDisableScrollLeft(isScrolledLeft(containerRef.current));
    setDisableScrollRight(isScrolledRight(containerRef.current));
  }, [tabs]);
  useResizeObserver(containerRef.current, handleResize);

  const onDragEnd: OnDragEndResponder = useCallback(
    result => {
      DragUtils.stopDragging();

      // dropped outside the list
      if (!result.destination) {
        return;
      }

      onReorder(result.source.index, result.destination.index);
    },
    [onReorder]
  );

  const handleScroll = useCallback(() => {
    if (containerRef.current == null) {
      return;
    }

    const shouldDisableScrollLeft = isScrolledLeft(containerRef.current);
    if (shouldDisableScrollLeft !== disableScrollLeft) {
      setDisableScrollLeft(shouldDisableScrollLeft);
    }

    const shouldDisableScrollRight = isScrolledRight(containerRef.current);
    if (shouldDisableScrollRight !== disableScrollRight) {
      setDisableScrollRight(shouldDisableScrollRight);
    }
  }, [disableScrollLeft, disableScrollRight]);

  const continuousScrollRef = useRef<{
    holdTimer?: number;
    rAF?: number;
    cancelClick: boolean;
  }>({ cancelClick: false });

  const handleLeftClick = useCallback(() => {
    if (
      containerRef.current == null ||
      continuousScrollRef.current.cancelClick
    ) {
      return;
    }

    const { children } = containerRef.current;
    for (let i = children.length - 1; i >= 0; i -= 1) {
      const child = children[i] as HTMLElement;
      // Subtract 5px from left edge to account for rounding of offset values
      if (child.offsetLeft < containerRef.current.scrollLeft - 5) {
        child.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start',
        });
        return;
      }
    }
  }, []);

  const handleRightClick = useCallback(() => {
    if (
      containerRef.current == null ||
      continuousScrollRef.current.cancelClick
    ) {
      return;
    }

    const { children } = containerRef.current;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i] as HTMLElement;
      // Add 5px to right edge to account for rounding of offset values
      if (
        child.offsetLeft + 5 >
        containerRef.current.scrollLeft + containerRef.current.offsetWidth
      ) {
        child.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'end',
        });
        return;
      }
    }
  }, []);

  /**
   * Recurively called after initial timeout on mousedown. Continuously scroll with acceleration.
   * Cancelled by mouseup handler cancelling the animationFrame.
   * @param direction of scroll, left or right
   * @param startX starting position of scroll
   * @param deltaX delta from intial startX calculated recursively
   * @param prevTimestamp called on subsequent delta frames
   */
  const handleMouseRepeat = useCallback(
    (
      direction: 'left' | 'right',
      startX: number,
      deltaX = 0,
      prevTimestamp?: number
    ) => {
      const container = containerRef.current;
      if (container == null) {
        return;
      }

      continuousScrollRef.current.cancelClick = true;

      if (direction === 'left') {
        // eslint-disable-next-line no-param-reassign
        container.scrollLeft = startX - deltaX;
      } else if (direction === 'right') {
        // eslint-disable-next-line no-param-reassign
        container.scrollLeft = startX + deltaX;
      }

      // eslint-disable-next-line no-param-reassign
      continuousScrollRef.current.rAF = requestAnimationFrame(timestamp => {
        const startTime = prevTimestamp ?? timestamp;
        const deltaTime = timestamp - startTime;
        let newDeltaX =
          START_SPEED * deltaTime + 0.5 * ACCELERATION * deltaTime ** 2;
        newDeltaX = Math.min(newDeltaX, container.scrollWidth);
        // scrollLeft enforces a limit but no point letting delta increment beyond scrollWidth

        handleMouseRepeat(direction, startX, newDeltaX, startTime);
      });
    },
    []
  );

  const endContinuousScroll = useCallback(() => {
    const { holdTimer, rAF } = continuousScrollRef.current;
    if (holdTimer != null) {
      clearTimeout(holdTimer);
      continuousScrollRef.current.holdTimer = undefined;
    }
    if (rAF != null) {
      cancelAnimationFrame(rAF);
      continuousScrollRef.current.rAF = undefined;
    }
    window.removeEventListener('mouseup', endContinuousScroll);
  }, []);

  useEffect(
    () => () => window.removeEventListener('mouseup', endContinuousScroll),
    [endContinuousScroll]
  );

  const handleMouseDown = useCallback(
    (direction: 'left' | 'right') => {
      if (containerRef.current != null) {
        continuousScrollRef.current.holdTimer = window.setTimeout(
          handleMouseRepeat,
          CLICK_TIMEOUT,
          direction,
          containerRef.current.scrollLeft
        );
      }
      continuousScrollRef.current.cancelClick = false;
      window.addEventListener('mouseup', endContinuousScroll);
    },
    [endContinuousScroll, handleMouseRepeat]
  );

  const handleMouseDownLeft = useCallback(() => {
    handleMouseDown('left');
  }, [handleMouseDown]);

  const handleMouseDownRight = useCallback(() => {
    handleMouseDown('right');
  }, [handleMouseDown]);

  // React binds to the root as a passive listener for wheel
  // This prevents the wheel event from being canceled
  // Bypass React's event system so we can prevent the default behavior
  // https://github.com/facebook/react/issues/14856
  useEffect(function handleWheel() {
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const nav = e.currentTarget as HTMLDivElement;
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      // Scrolling jumps too far sometimes, so clamp to get a smoother scroll
      nav.scrollLeft += clamp(delta, -30, 30);
    };

    containerRef.current?.addEventListener('wheel', onWheel);
    return () => {
      containerRef.current?.removeEventListener('wheel', onWheel);
    };
  }, []);

  const activeTabRef = useRef<HTMLDivElement>(null);
  const activeTab = tabs.find(tab => tab.key === activeKey) ?? tabs[0];
  const navTabs = tabs.map((tab, index) => {
    const { key } = tab;
    const isActive = tab === activeTab;

    return (
      <NavTab
        tab={tab}
        key={key}
        index={index}
        isActive={isActive}
        activeRef={activeTabRef}
        onSelect={onSelect}
        onClose={onClose}
        isDraggable={isReorderAllowed}
      />
    );
  });

  useEffect(
    // Needs to be in a useEffect so the ref is updated
    function scrollActiveTabIntoView() {
      if (activeTabRef.current != null) {
        activeTabRef.current.scrollIntoView({ inline: 'nearest' });
      }
    },
    [activeKey]
  );

  return (
    <nav className="nav-container">
      {isOverflowing && (
        <Button
          kind="ghost"
          icon={<FontAwesomeIcon icon={vsChevronLeft} transform="grow-4" />}
          className="tab-controls-btn tab-controls-btn-left"
          tooltip="Scroll left"
          onClick={handleLeftClick}
          onMouseDown={handleMouseDownLeft}
          disabled={disableScrollLeft}
        />
      )}
      <DragDropContext
        onDragStart={DragUtils.startDragging}
        onDragEnd={onDragEnd}
      >
        <Droppable
          droppableId="droppable-tab-navigation"
          direction="horizontal"
        >
          {(provided, snapshot) => (
            <div
              ref={r => {
                if (r == null) {
                  return;
                }
                containerRef.current = r;
                provided.innerRef(r);
              }}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...provided.droppableProps}
              className={classNames('nav nav-tabs', {
                dragging: snapshot.draggingFromThisWith,
              })}
              role="tablist"
              onScroll={handleScroll}
            >
              {navTabs}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {isOverflowing && (
        <Button
          kind="ghost"
          icon={<FontAwesomeIcon icon={vsChevronRight} transform="grow-4" />}
          className="tab-controls-btn tab-controls-btn-right"
          tooltip="Scroll right"
          onClick={handleRightClick}
          onMouseDown={handleMouseDownRight}
          disabled={disableScrollRight}
        />
      )}
    </nav>
  );
}

export default NavTabList;
