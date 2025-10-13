import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import clamp from 'lodash.clamp';
import {
  DragDropContext,
  Droppable,
  type OnDragEndResponder,
} from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { vsChevronRight, vsChevronLeft, vsChevronDown } from '@deephaven/icons';
import { useResizeObserver } from '@deephaven/react-hooks';
import DragUtils from '../DragUtils';
import Button from '../Button';
import NavTab from './NavTab';
import './NavTabList.scss';
import {
  type ContextAction,
  type ResolvableContextAction,
  ContextActions,
} from '../context-actions';
import Popper from '../popper/Popper';
import DashboardList from './DashboardList';
import { GLOBAL_SHORTCUTS } from '../shortcuts';

// mouse hold timeout to act as hold instead of click
const CLICK_TIMEOUT = 500;

// mouse hold acceleration
const START_SPEED = 0.01;
const ACCELERATION = 0.0005;

export interface NavTabItem {
  /**
   * Unique key for the tab.
   */
  key: string;

  /**
   * Title to display on the tab.
   */
  title: string;

  /**
   * Icon to display on the tab.
   */
  icon?: IconDefinition | JSX.Element;

  /**
   * Whether the tab is closable.
   * If omitted, the tab will be closeable if onClose exists.
   */
  isClosable?: boolean;
}

type NavTabListProps<T extends NavTabItem = NavTabItem> = {
  /**
   * The key of the active tab.
   * If this does not match a tab key, no tab will be active.
   */
  activeKey: string;

  /**
   * Array of tabs to display.
   * @see {@link NavTabItem} for the minimum required properties.
   */
  tabs: T[];

  /**
   * Function called when a tab is selected.
   *
   * @param key The key of the tab to select
   */
  onSelect: (key: string) => void;

  /**
   * Function called when a tab is closed.
   * If the function is provided, all tabs will be closeable by default.
   * Tabs may set their own closeable property to override this behavior.
   *
   * @param key The key of the tab to close
   */
  onClose?: (key: string) => void;

  /**
   * Function called when a tab is reordered.
   * If the function is omitted, the tab list will not be reorderable.
   *
   * @param sourceIndex Index in the tab list the drag started from
   * @param destinationIndex Index in the tab list the drag ended at
   */
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;

  /**
   * Context actions to add to the tab in addition to the default actions.
   * The default actions are Close, Close to the Right, and Close All.
   * The default actions have a group value of 20.
   *
   * @param tab The tab to make context items for
   * @returns Additional context items for the tab
   */
  makeContextActions?: (tab: T) => ContextAction | ContextAction[];
};

function isScrolledLeft(element: HTMLElement): boolean {
  return element.scrollLeft === 0;
}

function isScrolledRight(element: HTMLElement): boolean {
  return (
    // single pixel buffer to account for sub-pixel rendering
    Math.abs(element.scrollLeft + element.clientWidth - element.scrollWidth) <=
      1 || element.scrollWidth === 0
  );
}

function makeBaseContextActions(
  tab: NavTabItem,
  tabs: NavTabItem[],
  onClose: ((key: string) => void) | undefined
): ContextAction[] {
  const { isClosable = false, key } = tab;
  const contextActions: ContextAction[] = [];
  if (isClosable && onClose != null) {
    contextActions.push({
      title: 'Close',
      order: 10,
      group: 20,
      action: () => {
        onClose(key);
      },
    });

    let disabled = true;
    for (let i = tabs.length - 1; i > 0; i -= 1) {
      if (tabs[i].key === tab.key) break;
      if (tabs[i].isClosable === true) {
        disabled = false;
        break;
      }
    }

    contextActions.push({
      title: 'Close to the Right',
      order: 20,
      group: 20,
      action: () => {
        for (let i = tabs.length - 1; i > 0; i -= 1) {
          if (tabs[i].key === key) break;
          if (tabs[i].isClosable === true) onClose(tabs[i].key);
        }
      },
      disabled,
    });

    contextActions.push({
      title: 'Close All',
      order: 30,
      group: 20,
      action: () => {
        tabs.forEach(t => {
          if (t.isClosable === true) onClose(t.key);
        });
      },
    });
  }

  return contextActions;
}

function NavTabList({
  activeKey,
  tabs,
  onSelect,
  onReorder,
  onClose,
  makeContextActions,
}: NavTabListProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>();
  const [isOverflowing, setIsOverflowing] = useState(true);
  const [isDashboardTabMenuShown, setIsDashboardTabMenuShown] = useState(false);
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

      onReorder?.(result.source.index, result.destination.index);
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

  const tabContextActionMap = useMemo(() => {
    const tabContextActions = new Map<string, ResolvableContextAction[]>();
    tabs.forEach(tab => {
      const { key } = tab;
      const contextActions = [
        () => makeBaseContextActions(tab, tabs, onClose),
        () => makeContextActions?.(tab) ?? [],
      ];
      tabContextActions.set(key, contextActions);
    });
    return tabContextActions;
  }, [makeContextActions, tabs, onClose]);

  const activeTabRef = useRef<HTMLDivElement>(null);
  const activeTab = tabs.find(tab => tab.key === activeKey);
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
        isDraggable={onReorder != null}
        contextActions={tabContextActionMap.get(key)}
      />
    );
  });

  useEffect(
    // Needs to be in a useEffect so the ref is updated
    function scrollActiveTabIntoView() {
      if (activeTabRef.current != null) {
        activeTabRef.current.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
        });
      }
    },
    [activeKey]
  );

  const handleDashboardMenuClick = () => {
    setIsDashboardTabMenuShown(!isDashboardTabMenuShown);
  };

  const handleDashboardMenuSelect = (tab: NavTabItem) => {
    setIsDashboardTabMenuShown(false);

    onSelect(tab.key);
  };

  const handleDashboardMenuClose = () => {
    setIsDashboardTabMenuShown(false);
  };

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
      <Button
        kind="ghost"
        icon={<FontAwesomeIcon icon={vsChevronDown} transform="grow-4" />}
        className="btn-dashboard-list-menu btn-show-dashboard-list"
        tooltip="Search open dashboards"
        onClick={handleDashboardMenuClick}
        disabled={tabs.length < 2}
        style={{
          visibility: isOverflowing ? 'visible' : 'hidden',
          marginLeft: 'auto',
        }}
      >
        <Popper
          isShown={isDashboardTabMenuShown}
          className="dashboard-list-menu-popper"
          onExited={handleDashboardMenuClose}
          options={{
            placement: 'bottom-start',
          }}
          closeOnBlur
          interactive
        >
          <DashboardList tabs={tabs} onSelect={handleDashboardMenuSelect} />
        </Popper>
      </Button>
      <ContextActions
        actions={[
          {
            action: () => {
              setIsDashboardTabMenuShown(!isDashboardTabMenuShown);
            },
            shortcut: GLOBAL_SHORTCUTS.OPEN_DASHBOARD_LIST,
            isGlobal: true,
          },
        ]}
      />
    </nav>
  );
}

export default NavTabList;
