/* eslint-disable react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import memoize from 'memoizee';
import {
  FixedSizeList as List,
  type ListOnItemsRenderedProps,
  type ListOnScrollProps,
} from 'react-window';
import Log from '@deephaven/log';
import { RangeUtils, type Range } from '@deephaven/utils';
import ItemListItem from './ItemListItem';
import { ContextActionUtils } from './context-actions';
import './ItemList.scss';

const log = Log.module('ItemList');
const MIN_DRAG_DELTA = 5;

const DEBUG_NODE_IDS = new WeakMap<Node, number>();
let nextDebugNodeId = 1;
let nextItemListDebugInstanceId = 1;

type CallbackFlags = {
  inRequestAnimationFrame?: boolean;
  inResizeObserver?: boolean;
  inMutationObserver?: boolean;
  inReactRender?: boolean;
  inReactCommit?: boolean;
  inHandleScroll?: boolean;
  inComponentDidUpdate?: boolean;
  inGoldenLayout?: boolean;
};

type CallbackContext = {
  name: string;
  eventType: string;
  taskId: number;
  previousCallbackName: string | null;
  flags: Required<CallbackFlags>;
  enteredAt: number;
};

type ActiveElementSummary = {
  id: number | null;
  tagName: string;
  className: string;
  textPreview: string;
};

type ExecutionContextSnapshot = {
  currentTaskId: number | null;
  currentCallbackName: string | null;
  previousCallbackName: string | null;
  nextCallbackName: string | null;
  executingEventType: string | null;
  inRequestAnimationFrame: boolean;
  inResizeObserver: boolean;
  inMutationObserver: boolean;
  inReactRender: boolean;
  inReactCommit: boolean;
  inHandleScroll: boolean;
  inComponentDidUpdate: boolean;
  inGoldenLayout: boolean;
  activeElement: ActiveElementSummary | null;
};

type ChdbgRuntime = {
  callbackTaskSeq: number;
  callbackStack: CallbackContext[];
  lastCompletedCallbackName: string | null;
  scrollOwnerSampler?: (source: string) => void;
  scrollOwnerSamplerOwnerId?: number;
};

function getDefaultCallbackFlags(
  flags: CallbackFlags = {}
): Required<CallbackFlags> {
  return {
    inRequestAnimationFrame: flags.inRequestAnimationFrame ?? false,
    inResizeObserver: flags.inResizeObserver ?? false,
    inMutationObserver: flags.inMutationObserver ?? false,
    inReactRender: flags.inReactRender ?? false,
    inReactCommit: flags.inReactCommit ?? false,
    inHandleScroll: flags.inHandleScroll ?? false,
    inComponentDidUpdate: flags.inComponentDidUpdate ?? false,
    inGoldenLayout: flags.inGoldenLayout ?? false,
  };
}

function getChdbgRuntime(): ChdbgRuntime {
  const root = globalThis as typeof globalThis & {
    __chdbgRuntime?: ChdbgRuntime;
  };
  if (root.__chdbgRuntime == null) {
    root.__chdbgRuntime = {
      callbackTaskSeq: 0,
      callbackStack: [],
      lastCompletedCallbackName: null,
    };
  }
  return root.__chdbgRuntime;
}

function getChdbgSeq(): number {
  const root = globalThis as typeof globalThis & { chdbgSeq?: number };
  root.chdbgSeq = (root.chdbgSeq ?? 0) + 1;
  return root.chdbgSeq;
}

function getDebugNodeId(node: Node | null | undefined): number | null {
  if (node == null) {
    return null;
  }
  const existingId = DEBUG_NODE_IDS.get(node);
  if (existingId != null) {
    return existingId;
  }
  const id = nextDebugNodeId;
  nextDebugNodeId += 1;
  DEBUG_NODE_IDS.set(node, id);
  return id;
}

type NodeDebugInfo = {
  id: number | null;
  isConnected: boolean;
  scrollTop: number | null;
  scrollHeight: number | null;
  clientHeight: number | null;
  clientWidth: number | null;
};

type NodeScrollSample = {
  source: string;
  traceId: number | null;
  t: number;
  scrollTop: number;
};

type ScrollOwnerResolution = {
  node: HTMLDivElement | null;
  nodeId: number | null;
  reason: 'none' | 'single-candidate' | 'overflow-height' | 'fallback-first';
  candidateIds: number[];
};

type ScrollWriteProbe = {
  restore: () => void;
};

type ScrollWriteKind =
  | 'direct scrollTop assignment'
  | 'scrollTo()'
  | 'scrollBy()'
  | 'browser event'
  | 'unknown';

type ScrollOwnerStateSample = {
  nodeId: number | null;
  t: number;
  source: string;
  traceId: number | null;
  scrollTop: number | null;
  scrollHeight: number | null;
  clientHeight: number | null;
  writeSeq: number;
  nativeScrollSeq: number;
  handleScrollSeq: number;
  resizeSeq: number;
  mutationSeq: number;
  renderSeq: number;
};

type RenderSnapshot = {
  stateScrollOffset: number | null;
  stateHeight: number | null;
  itemCount: number;
  itemsLength: number;
  overscanStartIndex: number | null;
  visibleStartIndex: number | null;
  visibleStopIndex: number | null;
};

type VisibilityDebugInfo =
  | {
      id: number | null;
      exists: true;
      isConnected: boolean;
      display: string | null;
      visibility: string | null;
      opacity: string | null;
      width: number;
      height: number;
      offsetWidth: number | null;
      offsetHeight: number | null;
    }
  | { exists: false };

type RowVisibilitySummary = {
  sampledRows: number;
  detachedRows: number;
  zeroAreaRows: number;
  hiddenStyleRows: number;
};

function getNodeDebugInfo(
  node: Element | null | undefined
): NodeDebugInfo | null {
  if (node == null) {
    return null;
  }

  const maybeScrollable = node as HTMLElement;
  return {
    id: getDebugNodeId(node),
    isConnected: node.isConnected,
    scrollTop:
      typeof maybeScrollable.scrollTop === 'number'
        ? maybeScrollable.scrollTop
        : null,
    scrollHeight:
      typeof maybeScrollable.scrollHeight === 'number'
        ? maybeScrollable.scrollHeight
        : null,
    clientHeight:
      typeof maybeScrollable.clientHeight === 'number'
        ? maybeScrollable.clientHeight
        : null,
    clientWidth:
      typeof maybeScrollable.clientWidth === 'number'
        ? maybeScrollable.clientWidth
        : null,
  };
}

function getVisibilityDebugInfo(
  element: Element | null | undefined
): VisibilityDebugInfo {
  if (element == null) {
    return { exists: false };
  }

  const rect = element.getBoundingClientRect();
  const htmlElement =
    element instanceof HTMLElement ? (element as HTMLElement) : null;
  const computedStyle = window.getComputedStyle(element);

  return {
    id: getDebugNodeId(element),
    exists: true,
    isConnected: element.isConnected,
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    width: rect.width,
    height: rect.height,
    offsetWidth: htmlElement?.offsetWidth ?? null,
    offsetHeight: htmlElement?.offsetHeight ?? null,
  };
}

function summarizeRowVisibility(
  rowElements: readonly Element[],
  sampleLimit = 20
): RowVisibilitySummary {
  const sampled = rowElements.slice(0, sampleLimit);
  let detachedRows = 0;
  let zeroAreaRows = 0;
  let hiddenStyleRows = 0;

  sampled.forEach(row => {
    const rect = row.getBoundingClientRect();
    const style = window.getComputedStyle(row);
    if (!row.isConnected) {
      detachedRows += 1;
    }
    if (rect.width === 0 || rect.height === 0) {
      zeroAreaRows += 1;
    }
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0'
    ) {
      hiddenStyleRows += 1;
    }
  });

  return {
    sampledRows: sampled.length,
    detachedRows,
    zeroAreaRows,
    hiddenStyleRows,
  };
}

export interface DefaultListItem {
  value?: string;
  displayValue?: string;
}

export type RenderItemProps<T> = {
  item: T;
  itemIndex: number;
  isFocused: boolean;
  isSelected: boolean;
  style: React.CSSProperties;
};

export type RenderItemFn<T> = (props: RenderItemProps<T>) => React.ReactNode;

export type ItemDragEventHandler = (
  index: number,
  event: React.DragEvent<HTMLDivElement>
) => void;

export type ItemListProps<T> = {
  // Total item count
  itemCount: number;
  rowHeight: number;
  // Offset of the top item in the items array
  offset: number;
  // Item object format expected by the default renderItem function
  // Can be anything as long as it's supported by the renderItem
  // Default renderItem will look for a `displayValue` property, fallback
  // to the `value` property, or stringify the object if neither are defined
  items: readonly T[];
  // Whether clicking a selected item should deselect in the item list or not. Defaults to true
  isDeselectOnClick: boolean;
  // Whether selection requires a double click or not
  isDoubleClickSelect: boolean;
  // Whether to allow dragging to change the selection after clicking
  isDragSelect: boolean;
  // Whether to allow multiple selections in this item list
  isMultiSelect: boolean;
  // Set to true if you want the list to scroll when new items are added and it's already at the bottom
  isStickyBottom: boolean;
  // Fired when an item gets focused
  onFocusChange: (index: number | null) => void;

  // Fired when an item is clicked. With multiple selection, fired on double click.
  onSelect: (index: number, event: React.SyntheticEvent) => void;
  onSelectionChange: (ranges: readonly Range[]) => void;
  onViewportChange: (topRow: number, bottomRow: number) => void;
  overscanCount: number;
  selectedRanges: readonly Range[];
  disableSelect: boolean;
  renderItem: RenderItemFn<T>;
  focusSelector: string;
  'data-testid'?: string;
};

type ItemListState = {
  focusIndex: number | null;
  mouseDownIndex: number | null;
  selectedRanges: readonly Range[];
  overscanStartIndex: number;
  width: number | null;
  height: number | null;
  isDragging: boolean;
  isStuckToBottom: boolean;
  scrollOffset: number | null;
  mouseX: number | null;
  mouseY: number | null;
};

/**
 * Show items in a long scrollable list.
 * Can be navigated via keyboard or mouse.
 */
export class ItemList<T> extends PureComponent<
  ItemListProps<T>,
  ItemListState
> {
  static CACHE_SIZE = 1000;

  static DEFAULT_ROW_HEIGHT = 20;

  // By drawing an additional 10 items on each side, tab/keyboard navigation works better (as the next element exists)
  static DEFAULT_OVERSCAN = 10;

  // An unrequested scroll to the top that arrives within this window of a size
  // change is treated as the spurious scroll reset Golden Layout triggers when
  // it re-parents our DOM subtree, rather than a genuine user scroll.
  static REPARENT_SCROLL_GRACE = 250;

  static defaultProps = {
    offset: 0,
    items: [],
    rowHeight: ItemList.DEFAULT_ROW_HEIGHT,

    isDeselectOnClick: true,

    isDoubleClickSelect: false,

    isDragSelect: true,

    isMultiSelect: false,

    isStickyBottom: false,

    disableSelect: false,

    onFocusChange(): void {
      // no-op
    },
    onSelect(): void {
      // no-op
    },
    onSelectionChange(): void {
      // no-op
    },
    onViewportChange(): void {
      // no-op
    },

    overscanCount: ItemList.DEFAULT_OVERSCAN,

    renderItem: ItemList.renderItem,
    selectedRanges: [],

    focusSelector: '.item-list-item',

    'data-testid': undefined,
  };

  static renderItem<P extends DefaultListItem>({
    item,
  }: RenderItemProps<P>): JSX.Element {
    return (
      <div className="item-list-item-content">
        {item != null && (item.displayValue ?? item.value ?? `${item}`)}
      </div>
    );
  }

  constructor(props: ItemListProps<T>) {
    super(props);

    this.handleItemBlur = this.handleItemBlur.bind(this);
    this.handleItemContextMenu = this.handleItemContextMenu.bind(this);
    this.handleItemFocus = this.handleItemFocus.bind(this);
    this.handleItemDoubleClick = this.handleItemDoubleClick.bind(this);
    this.handleItemMouseDown = this.handleItemMouseDown.bind(this);
    this.handleItemMouseMove = this.handleItemMouseMove.bind(this);
    this.handleItemMouseUp = this.handleItemMouseUp.bind(this);
    this.handleItemsRendered = this.handleItemsRendered.bind(this);
    this.handleWindowMouseUp = this.handleWindowMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleResizeObserver = this.handleResizeObserver.bind(this);
    this.renderInnerElement = this.renderInnerElement.bind(this);

    this.list = React.createRef();
    this.listContainer = React.createRef();
    this.sizerContainer = React.createRef();

    const { isStickyBottom, selectedRanges } = props;

    this.state = {
      focusIndex: null,
      mouseDownIndex: null,
      selectedRanges,
      overscanStartIndex: 0,
      width: null,
      height: null,
      isDragging: false,
      isStuckToBottom: isStickyBottom,
      scrollOffset: null,
      mouseX: null,
      mouseY: null,
    };
  }

  componentDidMount(): void {
    this.runInCallbackContext(
      'ItemList.componentDidMount',
      'react-commit',
      { inReactCommit: true },
      () => {
        const sizer = this.sizerContainer.current;
        if (sizer != null) {
          this.resizeObserver = new ResizeObserver(this.handleResizeObserver);
          this.resizeObserver.observe(sizer);
        }
        this.syncScrollWriteProbes('componentDidMount');
        this.syncNativeScrollListeners('componentDidMount');
        this.sampleScrollOwnerState('componentDidMount');
        this.registerGlobalScrollOwnerSampler();
        this.handleWindowResizeForChdbg = () => {
          this.runInCallbackContext(
            'window.resize',
            'window-resize',
            { inGoldenLayout: true },
            () => {
              this.sampleScrollOwnerState('window.resize-event');
            }
          );
        };
        window.addEventListener('resize', this.handleWindowResizeForChdbg, {
          passive: true,
        });
      }
    );
  }

  componentDidUpdate(
    prevProps: ItemListProps<T>,
    prevState: ItemListState
  ): void {
    this.runInCallbackContext(
      'ItemList.componentDidUpdate',
      'react-commit',
      { inReactCommit: true, inComponentDidUpdate: true },
      () => {
        const { selectedRanges: propSelectedRanges, itemCount } = this.props;
        const {
          focusIndex,
          isStuckToBottom,
          scrollOffset,
          height,
          selectedRanges,
        } = this.state;
        if (isStuckToBottom && !this.isListAtBottom() && itemCount > 0) {
          this.scrollToBottom();
        }

        if (
          scrollOffset !== prevState.scrollOffset ||
          height !== prevState.height
        ) {
          // eslint-disable-next-line no-console
          console.log('[CHDBG][S3]', {
            seq: getChdbgSeq(),
            t: performance.now(),
            traceId: this.getTraceIdOrNull(),
            cb: 'ItemList.componentDidUpdate.beforeSendViewportUpdate',
            prevScrollOffset: prevState.scrollOffset,
            nextScrollOffset: scrollOffset,
            prevHeight: prevState.height,
            nextHeight: height,
            isStuckToBottom,
          });
          this.sendViewportUpdate();
          this.scheduleRenderAudit('componentDidUpdate.viewportChange');
        }

        this.syncScrollWriteProbes('componentDidUpdate');
        this.syncNativeScrollListeners('componentDidUpdate');
        this.sampleScrollOwnerState('componentDidUpdate');

        if (
          propSelectedRanges !== prevProps.selectedRanges &&
          propSelectedRanges !== selectedRanges
        ) {
          this.setSelectedRanges(propSelectedRanges);
        } else if (selectedRanges !== prevState.selectedRanges) {
          const { onSelectionChange } = this.props;
          onSelectionChange(selectedRanges);
        }

        if (focusIndex !== prevState.focusIndex) {
          const { onFocusChange } = this.props;
          onFocusChange(focusIndex);
        }
      }
    );
  }

  componentWillUnmount(): void {
    this.runInCallbackContext(
      'ItemList.componentWillUnmount',
      'react-commit',
      { inReactCommit: true },
      () => {
        window.removeEventListener('mouseup', this.handleWindowMouseUp);
        if (this.handleWindowResizeForChdbg != null) {
          window.removeEventListener('resize', this.handleWindowResizeForChdbg);
          this.handleWindowResizeForChdbg = null;
        }
        this.cancelPendingReparentScrollReset();
        if (this.debugRenderAuditRaf != null) {
          cancelAnimationFrame(this.debugRenderAuditRaf);
          this.debugRenderAuditRaf = null;
        }
        this.clearGlobalScrollOwnerSampler();
        this.clearScrollWriteProbes('componentWillUnmount');
        this.clearNativeScrollListeners('componentWillUnmount');
        this.resizeObserver?.disconnect();
      }
    );
  }

  list: React.RefObject<List>;

  listContainer: React.RefObject<HTMLDivElement>;

  sizerContainer: React.RefObject<HTMLDivElement>;

  resizeObserver: ResizeObserver | null = null;

  // Timestamp of the last size change reported by the ResizeObserver. Golden
  // Layout re-parents our DOM subtree when a sibling panel is closed, which
  // fires a resize and also resets the scroll container's scrollTop to 0. We
  // use this to reject that spurious scroll-to-top (DH-22991).
  lastResizeTime = 0;

  pendingReparentScrollResetTimer: ReturnType<typeof setTimeout> | null = null;

  pendingReparentWasStuckToBottom = false;

  debugResizeTraceId = 0;

  lastObservedResizeTarget: Element | null = null;

  lastListContainerRef: HTMLDivElement | null = null;

  debugRenderPassId = 0;

  debugRenderInnerCalls = 0;

  debugRenderInnerNullReturns = 0;

  debugRenderInnerElementReturns = 0;

  debugRenderVisibleCalls = 0;

  debugRenderVisibleNullReturns = 0;

  debugRenderVisibleElementReturns = 0;

  debugVisibleStartIndex: number | null = null;

  debugVisibleStopIndex: number | null = null;

  debugOverscanStartIndex: number | null = null;

  debugOverscanStopIndex: number | null = null;

  debugRenderAuditRaf: number | null = null;

  debugRenderAuditReason: string | null = null;

  debugRenderSuppressedKey = '';

  activeTraceId = 0;

  lastNativeScrollEventAt = 0;

  lastNativeScrollEventNodeId: number | null = null;

  lastNativeScrollEventScrollTop: number | null = null;

  lastReactWindowScrollAt = 0;

  lastReactWindowScrollOffset: number | null = null;

  lastResizeObserverAt = 0;

  lastMutationObserverAt = 0;

  lastRenderAt = 0;

  lastHandleScrollAt = 0;

  scrollWriteSeq = 0;

  nativeScrollSeq = 0;

  handleScrollSeq = 0;

  resizeObserverSeq = 0;

  mutationSeq = 0;

  renderSeq = 0;

  lastInterceptedWriteKind: ScrollWriteKind = 'unknown';

  lastScrollOwnerSample: ScrollOwnerStateSample | null = null;

  lastRenderSnapshot: RenderSnapshot | null = null;

  nativeScrollListeners = new Map<HTMLDivElement, EventListener>();

  scrollWriteProbes = new Map<HTMLDivElement, ScrollWriteProbe>();

  nodeScrollSamples = new WeakMap<Element, NodeScrollSample>();

  lastObservedScrollTopByNode = new WeakMap<Element, number>();

  debugInstanceId = nextItemListDebugInstanceId++;

  handleWindowResizeForChdbg: (() => void) | null = null;

  getTraceIdOrNull(): number | null {
    return this.activeTraceId > 0 ? this.activeTraceId : null;
  }

  getActiveElementSummary(): ActiveElementSummary | null {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return null;
    }
    return {
      id: getDebugNodeId(activeElement),
      tagName: activeElement.tagName,
      className: activeElement.className,
      textPreview: activeElement.innerText.slice(0, 120),
    };
  }

  getExecutionContextSnapshot(): ExecutionContextSnapshot {
    const runtime = getChdbgRuntime();
    const currentContext =
      runtime.callbackStack.length > 0
        ? runtime.callbackStack[runtime.callbackStack.length - 1]
        : null;
    const flags = getDefaultCallbackFlags(currentContext?.flags);
    return {
      currentTaskId: currentContext?.taskId ?? null,
      currentCallbackName: currentContext?.name ?? null,
      previousCallbackName:
        currentContext?.previousCallbackName ?? runtime.lastCompletedCallbackName,
      nextCallbackName: currentContext?.name ?? null,
      executingEventType: currentContext?.eventType ?? null,
      inRequestAnimationFrame: flags.inRequestAnimationFrame,
      inResizeObserver: flags.inResizeObserver,
      inMutationObserver: flags.inMutationObserver,
      inReactRender: flags.inReactRender,
      inReactCommit: flags.inReactCommit,
      inHandleScroll: flags.inHandleScroll,
      inComponentDidUpdate: flags.inComponentDidUpdate,
      inGoldenLayout: flags.inGoldenLayout,
      activeElement: this.getActiveElementSummary(),
    };
  }

  registerGlobalScrollOwnerSampler(): void {
    const runtime = getChdbgRuntime();
    runtime.scrollOwnerSampler = (source: string) => {
      this.sampleScrollOwnerState(`global-callback:${source}`);
    };
    runtime.scrollOwnerSamplerOwnerId = this.debugInstanceId;
  }

  clearGlobalScrollOwnerSampler(): void {
    const runtime = getChdbgRuntime();
    if (runtime.scrollOwnerSamplerOwnerId === this.debugInstanceId) {
      delete runtime.scrollOwnerSampler;
      delete runtime.scrollOwnerSamplerOwnerId;
    }
  }

  runInCallbackContext<R>(
    callbackName: string,
    eventType: string,
    flags: CallbackFlags,
    run: () => R
  ): R {
    const runtime = getChdbgRuntime();
    const parentContext =
      runtime.callbackStack.length > 0
        ? runtime.callbackStack[runtime.callbackStack.length - 1]
        : null;
    runtime.callbackTaskSeq += 1;
    const callbackContext: CallbackContext = {
      name: callbackName,
      eventType,
      taskId: runtime.callbackTaskSeq,
      previousCallbackName:
        parentContext?.name ?? runtime.lastCompletedCallbackName,
      flags: getDefaultCallbackFlags(flags),
      enteredAt: performance.now(),
    };
    runtime.callbackStack.push(callbackContext);
    this.sampleScrollOwnerState(`callback-enter:${callbackName}`);

    try {
      return run();
    } finally {
      const poppedContext = runtime.callbackStack.pop();
      if (poppedContext?.name !== callbackContext.name) {
        // Keep the stack internally consistent when nested callbacks unwind unexpectedly.
        runtime.callbackStack.length = 0;
      }
      runtime.lastCompletedCallbackName = callbackName;
      this.sampleScrollOwnerState(`callback-exit:${callbackName}`);
    }
  }

  getStackTrace(skip = 2): string | null {
    const stackText = new Error().stack;
    if (stackText == null) {
      return null;
    }
    return stackText
      .split('\n')
      .slice(skip)
      .join('\n');
  }

  getStackHead(skip = 2, limit = 4): string[] {
    const stackText = this.getStackTrace(skip);
    if (stackText == null) {
      return [];
    }
    return stackText
      .split('\n')
      .slice(0, limit)
      .map(line => line.trim());
  }

  classifyScrollWriteKind(source: string): ScrollWriteKind {
    if (source.startsWith('scrollTop.setter')) {
      return 'direct scrollTop assignment';
    }
    if (source.startsWith('scrollTo.call')) {
      return 'scrollTo()';
    }
    if (source.startsWith('scrollBy.call')) {
      return 'scrollBy()';
    }
    return 'unknown';
  }

  inferRenderReason(nextSnapshot: RenderSnapshot): string[] {
    const prev = this.lastRenderSnapshot;
    if (prev == null) {
      return ['initial-render'];
    }

    const reasons: string[] = [];
    if (prev.stateScrollOffset !== nextSnapshot.stateScrollOffset) {
      reasons.push('state.scrollOffset');
    }
    if (prev.stateHeight !== nextSnapshot.stateHeight) {
      reasons.push('state.height');
    }
    if (prev.itemCount !== nextSnapshot.itemCount) {
      reasons.push('props.itemCount');
    }
    if (prev.itemsLength !== nextSnapshot.itemsLength) {
      reasons.push('props.items.length');
    }
    if (prev.overscanStartIndex !== nextSnapshot.overscanStartIndex) {
      reasons.push('state.overscanStartIndex');
    }
    if (prev.visibleStartIndex !== nextSnapshot.visibleStartIndex) {
      reasons.push('visibleStartIndex');
    }
    if (prev.visibleStopIndex !== nextSnapshot.visibleStopIndex) {
      reasons.push('visibleStopIndex');
    }

    if (reasons.length === 0) {
      reasons.push('parent-render-or-context');
    }

    return reasons;
  }

  sampleScrollOwnerState(source: string): void {
    const t = performance.now();
    const traceId = this.getTraceIdOrNull();
    const owner = this.resolveScrollOwner();
    const node = owner.node;
    if (node == null) {
      return;
    }

    const nodeId = owner.nodeId;
    const nextSample: ScrollOwnerStateSample = {
      nodeId,
      t,
      source,
      traceId,
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
      writeSeq: this.scrollWriteSeq,
      nativeScrollSeq: this.nativeScrollSeq,
      handleScrollSeq: this.handleScrollSeq,
      resizeSeq: this.resizeObserverSeq,
      mutationSeq: this.mutationSeq,
      renderSeq: this.renderSeq,
    };

    const prev = this.lastScrollOwnerSample;
    if (prev != null && prev.nodeId === nextSample.nodeId) {
      const scrollTopChanged = prev.scrollTop !== nextSample.scrollTop;
      const scrollHeightChanged = prev.scrollHeight !== nextSample.scrollHeight;
      const clientHeightChanged = prev.clientHeight !== nextSample.clientHeight;
      const executionContext = this.getExecutionContextSnapshot();
      const isCallbackEntrySample = source.startsWith('callback-enter:');

      if (scrollTopChanged) {
        const hadInterceptedWriter = nextSample.writeSeq > prev.writeSeq;
        const hadNativeScrollEvent = nextSample.nativeScrollSeq > prev.nativeScrollSeq;
        const hadHandleScroll = nextSample.handleScrollSeq > prev.handleScrollSeq;
        const writeKind: ScrollWriteKind = hadInterceptedWriter
          ? this.lastInterceptedWriteKind
          : hadNativeScrollEvent
            ? 'browser event'
            : 'unknown';

        // eslint-disable-next-line no-console
        console.log('[CHDBG][S1W]', {
          seq: getChdbgSeq(),
          t,
          traceId,
          cb: 'ItemList.scrollOwner.scrollTop.transition',
          source,
          nodeId,
          before: prev.scrollTop,
          after: nextSample.scrollTop,
          writeKind,
          hadInterceptedWriter,
          hadNativeScrollEvent,
          hadHandleScroll,
          executingEventType: executionContext.executingEventType,
          currentTaskId: executionContext.currentTaskId,
          currentCallbackName: executionContext.currentCallbackName,
          previousCallbackName: executionContext.previousCallbackName,
          nextCallbackName: executionContext.nextCallbackName,
          stack: this.getStackTrace(3),
        });

        if (!hadInterceptedWriter) {
          // eslint-disable-next-line no-console
          console.log('[CHDBG][MYSTERY_SCROLL_RESET]', {
            seq: getChdbgSeq(),
            t,
            traceId,
            source,
            nodeId,
            previousScrollTop: prev.scrollTop,
            newScrollTop: nextSample.scrollTop,
            nativeScrollOccurred: hadNativeScrollEvent,
            handleScrollOccurred: hadHandleScroll,
            lastResizeObserverTimestamp: this.lastResizeObserverAt || null,
            lastMutationObserverTimestamp: this.lastMutationObserverAt || null,
            lastRenderTimestamp: this.lastRenderAt || null,
            stack: this.getStackTrace(2),
            activeElement: executionContext.activeElement,
            executingEventType: executionContext.executingEventType,
            inRequestAnimationFrame: executionContext.inRequestAnimationFrame,
            inResizeObserver: executionContext.inResizeObserver,
            inMutationObserver: executionContext.inMutationObserver,
            inReactRender: executionContext.inReactRender,
            inReactCommit: executionContext.inReactCommit,
            inHandleScroll: executionContext.inHandleScroll,
            inComponentDidUpdate: executionContext.inComponentDidUpdate,
            inGoldenLayout: executionContext.inGoldenLayout,
            currentTaskId: executionContext.currentTaskId,
            currentCallbackName: executionContext.currentCallbackName,
            previousCallbackName: executionContext.previousCallbackName,
            nextCallbackName: executionContext.nextCallbackName,
          });

          if (isCallbackEntrySample) {
            // eslint-disable-next-line no-console
            console.log('[CHDBG][BROWSER_TASK_BOUNDARY_RESET]', {
              seq: getChdbgSeq(),
              t,
              traceId,
              source,
              nodeId,
              previousScrollTop: prev.scrollTop,
              newScrollTop: nextSample.scrollTop,
              previousSampleSource: prev.source,
              previousSampleAgeMs: t - prev.t,
              activeElement: executionContext.activeElement,
              executingEventType: executionContext.executingEventType,
              currentTaskId: executionContext.currentTaskId,
              currentCallbackName: executionContext.currentCallbackName,
              previousCallbackName: executionContext.previousCallbackName,
              nextCallbackName: executionContext.nextCallbackName,
              inRequestAnimationFrame: executionContext.inRequestAnimationFrame,
              inResizeObserver: executionContext.inResizeObserver,
              inMutationObserver: executionContext.inMutationObserver,
              inReactRender: executionContext.inReactRender,
              inReactCommit: executionContext.inReactCommit,
              inHandleScroll: executionContext.inHandleScroll,
              inComponentDidUpdate: executionContext.inComponentDidUpdate,
              inGoldenLayout: executionContext.inGoldenLayout,
              stack: this.getStackTrace(2),
            });
          }
        }
      }

      if (scrollHeightChanged || clientHeightChanged) {
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S1]', {
          seq: getChdbgSeq(),
          t,
          traceId,
          cb: 'ItemList.scrollOwner.size.transition',
          source,
          nodeId,
          prevScrollHeight: prev.scrollHeight,
          nextScrollHeight: nextSample.scrollHeight,
          prevClientHeight: prev.clientHeight,
          nextClientHeight: nextSample.clientHeight,
          currentScrollTop: nextSample.scrollTop,
          stack: this.getStackTrace(3),
        });
      }
    }

    this.lastScrollOwnerSample = nextSample;
  }

  rememberNodeScrollSample(node: Element | null, source: string): void {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    this.nodeScrollSamples.set(node, {
      source,
      traceId: this.getTraceIdOrNull(),
      t: performance.now(),
      scrollTop: node.scrollTop,
    });
  }

  getNodeScrollSample(node: Element | null): NodeScrollSample | null {
    if (node == null) {
      return null;
    }
    return this.nodeScrollSamples.get(node) ?? null;
  }

  getNodeSampleSummary(node: Element | null):
    | {
        source: string;
        traceId: number | null;
        scrollTop: number;
        ageMs: number;
      }
    | null {
    const sample = this.getNodeScrollSample(node);
    if (sample == null) {
      return null;
    }
    return {
      source: sample.source,
      traceId: sample.traceId,
      scrollTop: sample.scrollTop,
      ageMs: performance.now() - sample.t,
    };
  }

  getScrollTopDescriptor(
    node: HTMLElement
  ): PropertyDescriptor | null {
    let current: object | null = node;
    while (current != null) {
      const descriptor = Object.getOwnPropertyDescriptor(current, 'scrollTop');
      if (descriptor != null) {
        return descriptor;
      }
      current = Object.getPrototypeOf(current) as object | null;
    }
    return null;
  }

  observeScrollTopChange(
    node: HTMLDivElement | null,
    source: string
  ): void {
    if (node == null) {
      return;
    }

    const traceId = this.getTraceIdOrNull();
    const currentScrollTop = node.scrollTop;
    const previousScrollTop = this.lastObservedScrollTopByNode.get(node);
    this.lastObservedScrollTopByNode.set(node, currentScrollTop);

    if (
      previousScrollTop != null &&
      previousScrollTop !== currentScrollTop
    ) {
      const lastSample = this.getNodeSampleSummary(node);
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S1W]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.scrollTop.changedObserved',
        source,
        nodeId: getDebugNodeId(node),
        prevScrollTop: previousScrollTop,
        nextScrollTop: currentScrollTop,
        previousSample: lastSample,
        writeKind: 'unknown' as ScrollWriteKind,
        stack: this.getStackTrace(3),
      });
    }

    this.rememberNodeScrollSample(node, source);
    this.sampleScrollOwnerState(`observeScrollTopChange:${source}`);
  }

  logScrollWrite(
    node: HTMLDivElement,
    source: string,
    extra: Record<string, unknown> = {}
  ): void {
    const traceId = this.getTraceIdOrNull();
    const nodeId = getDebugNodeId(node);
    const writeKind = this.classifyScrollWriteKind(source);
    const prevObserved = this.lastObservedScrollTopByNode.get(node) ?? null;
    const currentScrollTop = node.scrollTop;
    this.scrollWriteSeq += 1;
    this.lastInterceptedWriteKind = writeKind;
    this.lastObservedScrollTopByNode.set(node, currentScrollTop);
    this.rememberNodeScrollSample(node, `write:${source}`);
    // eslint-disable-next-line no-console
    console.log('[CHDBG][S1W]', {
      seq: getChdbgSeq(),
      t: performance.now(),
      traceId,
      cb: 'ItemList.scrollTop.write',
      source,
      writeKind,
      nodeId,
      prevObserved,
      nextObserved: currentScrollTop,
      stack: this.getStackTrace(3),
      ...extra,
    });
    this.sampleScrollOwnerState(`intercepted-write:${source}`);
  }

  installScrollWriteProbe(node: HTMLDivElement, reason: string): void {
    if (this.scrollWriteProbes.has(node)) {
      return;
    }

    const traceId = this.getTraceIdOrNull();
    const descriptor = this.getScrollTopDescriptor(node);
    if (descriptor?.get == null || descriptor?.set == null) {
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S1W]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.scrollWriteProbe.unavailable',
        reason,
        nodeId: getDebugNodeId(node),
      });
      return;
    }

    const originalScrollTo = node.scrollTo.bind(node) as (
      ...args: unknown[]
    ) => void;
    const originalScrollBy = node.scrollBy.bind(node) as (
      ...args: unknown[]
    ) => void;
    const originalScroll = node.scroll.bind(node) as (
      ...args: unknown[]
    ) => void;

    const self = this;
    Object.defineProperty(node, 'scrollTop', {
      configurable: true,
      enumerable: descriptor.enumerable ?? false,
      get(): number {
        return descriptor.get?.call(node) as number;
      },
      set(value: number) {
        const before = descriptor.get?.call(node) as number;
        descriptor.set?.call(node, value);
        const after = descriptor.get?.call(node) as number;
        self.logScrollWrite(node, 'scrollTop.setter', {
          requestedValue: value,
          before,
          after,
        });
      },
    });

    node.scrollTo = ((...args: unknown[]) => {
      self.logScrollWrite(node, 'scrollTo.call.before', { args });
      originalScrollTo(...args);
      self.logScrollWrite(node, 'scrollTo.call.after', { args });
    }) as typeof node.scrollTo;

    node.scrollBy = ((...args: unknown[]) => {
      self.logScrollWrite(node, 'scrollBy.call.before', { args });
      originalScrollBy(...args);
      self.logScrollWrite(node, 'scrollBy.call.after', { args });
    }) as typeof node.scrollBy;

    node.scroll = ((...args: unknown[]) => {
      self.logScrollWrite(node, 'scroll.call.before', { args });
      originalScroll(...args);
      self.logScrollWrite(node, 'scroll.call.after', { args });
    }) as typeof node.scroll;

    this.observeScrollTopChange(node, 'probe-installed');

    this.scrollWriteProbes.set(node, {
      restore: () => {
        delete (node as { scrollTop?: number }).scrollTop;
        node.scrollTo = originalScrollTo as typeof node.scrollTo;
        node.scrollBy = originalScrollBy as typeof node.scrollBy;
        node.scroll = originalScroll as typeof node.scroll;
      },
    });

    // eslint-disable-next-line no-console
    console.log('[CHDBG][S1W]', {
      seq: getChdbgSeq(),
      t: performance.now(),
      traceId,
      cb: 'ItemList.scrollWriteProbe.install',
      reason,
      nodeId: getDebugNodeId(node),
    });
  }

  syncScrollWriteProbes(reason: string): void {
    const traceId = this.getTraceIdOrNull();
    const candidates = this.getScrollCandidates();

    Array.from(this.scrollWriteProbes.entries()).forEach(([node, probe]) => {
      if (!candidates.includes(node)) {
        probe.restore();
        this.scrollWriteProbes.delete(node);
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S1W]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          traceId,
          cb: 'ItemList.scrollWriteProbe.remove',
          reason,
          nodeId: getDebugNodeId(node),
        });
      }
    });

    candidates.forEach(node => {
      this.installScrollWriteProbe(node, reason);
      this.observeScrollTopChange(node, `probe-sync:${reason}`);
    });
  }

  clearScrollWriteProbes(reason: string): void {
    const traceId = this.getTraceIdOrNull();
    Array.from(this.scrollWriteProbes.entries()).forEach(([node, probe]) => {
      probe.restore();
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S1W]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.scrollWriteProbe.remove',
        reason,
        nodeId: getDebugNodeId(node),
      });
    });
    this.scrollWriteProbes.clear();
  }

  getScrollCandidates(): HTMLDivElement[] {
    const listContainer = this.listContainer.current;
    const reactWindowOuterRef = this.getReactWindowOuterRef();
    const candidates = [listContainer, reactWindowOuterRef].filter(
      (node): node is HTMLDivElement => node != null
    );
    return candidates.filter(
      (node, index) => candidates.indexOf(node) === index
    );
  }

  resolveScrollOwner(candidates = this.getScrollCandidates()): ScrollOwnerResolution {
    if (candidates.length === 0) {
      return {
        node: null,
        nodeId: null,
        reason: 'none',
        candidateIds: [],
      };
    }

    if (candidates.length === 1) {
      return {
        node: candidates[0],
        nodeId: getDebugNodeId(candidates[0]),
        reason: 'single-candidate',
        candidateIds: candidates
          .map(node => getDebugNodeId(node))
          .filter((id): id is number => id != null),
      };
    }

    const overflowCandidates = candidates.filter(
      node => node.scrollHeight > node.clientHeight + 1
    );
    if (overflowCandidates.length > 0) {
      return {
        node: overflowCandidates[0],
        nodeId: getDebugNodeId(overflowCandidates[0]),
        reason: 'overflow-height',
        candidateIds: candidates
          .map(node => getDebugNodeId(node))
          .filter((id): id is number => id != null),
      };
    }

    return {
      node: candidates[0],
      nodeId: getDebugNodeId(candidates[0]),
      reason: 'fallback-first',
      candidateIds: candidates
        .map(node => getDebugNodeId(node))
        .filter((id): id is number => id != null),
    };
  }

  syncNativeScrollListeners(reason: string): void {
    const traceId = this.getTraceIdOrNull();
    const candidates = this.getScrollCandidates();

    Array.from(this.nativeScrollListeners.entries()).forEach(
      ([node, listener]) => {
        if (!candidates.includes(node)) {
          node.removeEventListener('scroll', listener, true);
          this.nativeScrollListeners.delete(node);
          // eslint-disable-next-line no-console
          console.log('[CHDBG][S2N]', {
            seq: getChdbgSeq(),
            t: performance.now(),
            traceId,
            cb: 'ItemList.nativeScrollListener.detach',
            reason,
            nodeId: getDebugNodeId(node),
          });
        }
      }
    );

    candidates.forEach(node => {
      if (this.nativeScrollListeners.has(node)) {
        return;
      }

      const listener: EventListener = () => {
        this.runInCallbackContext(
          'ItemList.nativeScrollListener',
          'scroll',
          {},
          () => {
            const currentTraceId = this.getTraceIdOrNull();
            const listContainer = this.listContainer.current;
            const reactWindowOuterRef = this.getReactWindowOuterRef();
            const owner = this.resolveScrollOwner();
            this.nativeScrollSeq += 1;
            this.lastNativeScrollEventAt = performance.now();
            this.lastNativeScrollEventNodeId = getDebugNodeId(node);
            this.lastNativeScrollEventScrollTop = node.scrollTop;
            this.rememberNodeScrollSample(node, 'native-scroll');
            this.sampleScrollOwnerState('native-scroll-event');

            // eslint-disable-next-line no-console
            console.log('[CHDBG][S2N]', {
              seq: getChdbgSeq(),
              t: this.lastNativeScrollEventAt,
              traceId: currentTraceId,
              cb: 'ItemList.nativeScroll',
              nodeId: getDebugNodeId(node),
              scrollTop: node.scrollTop,
              writeKind: 'browser event' as ScrollWriteKind,
              stack: this.getStackTrace(3),
              listContainerId: getDebugNodeId(listContainer),
              reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
              scrollOwnerId: owner.nodeId,
              scrollOwnerReason: owner.reason,
            });
          }
        );
      };

      node.addEventListener('scroll', listener, {
        passive: true,
        capture: true,
      });
      this.nativeScrollListeners.set(node, listener);
      this.rememberNodeScrollSample(node, 'native-listener-attach');
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S2N]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.nativeScrollListener.attach',
        reason,
        nodeId: getDebugNodeId(node),
      });
    });
  }

  clearNativeScrollListeners(reason: string): void {
    const traceId = this.getTraceIdOrNull();
    Array.from(this.nativeScrollListeners.entries()).forEach(
      ([node, listener]) => {
        node.removeEventListener('scroll', listener, true);
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S2N]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          traceId,
          cb: 'ItemList.nativeScrollListener.detach',
          reason,
          nodeId: getDebugNodeId(node),
        });
      }
    );
    this.nativeScrollListeners.clear();
  }

  getReactWindowOuterRef(): HTMLDivElement | null {
    const list = this.list.current as unknown as Record<string, unknown> | null;
    // eslint-disable-next-line no-underscore-dangle
    const outerRef = (list as { _outerRef?: unknown } | null)?._outerRef;
    return outerRef instanceof HTMLDivElement ? outerRef : null;
  }

  scheduleRenderAudit(reason: string): void {
    this.debugRenderAuditReason = reason;
    if (this.debugRenderAuditRaf != null) {
      return;
    }
    this.debugRenderAuditRaf = requestAnimationFrame(() => {
      this.runInCallbackContext(
        'ItemList.scheduleRenderAudit.raf',
        'animation-frame',
        { inRequestAnimationFrame: true },
        () => {
          this.debugRenderAuditRaf = null;
          const traceId = this.getTraceIdOrNull();
          const listContainer = this.listContainer.current;
          const reactWindowOuterRef = this.getReactWindowOuterRef();
          const scrollOwner = this.resolveScrollOwner();
          const rowElements = Array.from(
            listContainer?.querySelectorAll('.item-list-item') ?? []
          );
          const firstRow = rowElements[0] ?? null;
          const lastRow =
            rowElements.length > 0 ? rowElements[rowElements.length - 1] : null;
          const rowSummary = summarizeRowVisibility(rowElements);

          const { scrollOffset, height } = this.state;
          const { rowHeight } = this.props;
          const topVisibleRow =
            scrollOffset != null ? Math.floor(scrollOffset / rowHeight) : null;
          const bottomVisibleRow =
            topVisibleRow != null && height != null
              ? topVisibleRow + Math.ceil(height / rowHeight)
              : null;

          // eslint-disable-next-line no-console
          console.log('[CHDBG][S7]', {
            seq: getChdbgSeq(),
            t: performance.now(),
            traceId,
            cb: 'ItemList.renderAudit.raf',
            reason: this.debugRenderAuditReason,
            renderPassId: this.debugRenderPassId,
            renderInnerCalls: this.debugRenderInnerCalls,
            renderInnerNullReturns: this.debugRenderInnerNullReturns,
            renderInnerElementReturns: this.debugRenderInnerElementReturns,
            renderVisibleCalls: this.debugRenderVisibleCalls,
            renderVisibleNullReturns: this.debugRenderVisibleNullReturns,
            renderVisibleElementReturns: this.debugRenderVisibleElementReturns,
            stateTopVisibleRow: topVisibleRow,
            stateBottomVisibleRow: bottomVisibleRow,
            callbackVisibleStartIndex: this.debugVisibleStartIndex,
            callbackVisibleStopIndex: this.debugVisibleStopIndex,
            callbackOverscanStartIndex: this.debugOverscanStartIndex,
            callbackOverscanStopIndex: this.debugOverscanStopIndex,
            rowElementsInDom: rowElements.length,
            rowSummary,
            firstRow: getVisibilityDebugInfo(firstRow),
            lastRow: getVisibilityDebugInfo(lastRow),
            listContainerId: getDebugNodeId(listContainer),
            reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
            scrollOwnerId: scrollOwner.nodeId,
            scrollOwnerReason: scrollOwner.reason,
            scrollOwnerCandidateIds: scrollOwner.candidateIds,
            listContainer: getNodeDebugInfo(listContainer),
            reactWindowOuterRef: getNodeDebugInfo(reactWindowOuterRef),
            listContainerIsReactWindowOuterRef:
              listContainer != null && reactWindowOuterRef != null
                ? listContainer === reactWindowOuterRef
                : null,
          });
          this.sampleScrollOwnerState(
            `render-audit:${this.debugRenderAuditReason ?? 'unknown'}`
          );
          this.debugRenderAuditReason = null;
        }
      );
    });
  }

  logResizeFollowup(traceId: number, phase: 'microtask' | 'raf'): void {
    const listContainer = this.listContainer.current;
    const reactWindowOuterRef = this.getReactWindowOuterRef();
    const scrollOwner = this.resolveScrollOwner();
    const scrollOwnerNode = scrollOwner.node;
    const sizer = this.sizerContainer.current;
    const previousListContainerSample = this.getNodeSampleSummary(listContainer);
    const previousOuterRefSample = this.getNodeSampleSummary(reactWindowOuterRef);
    const previousScrollOwnerSample = this.getNodeSampleSummary(scrollOwnerNode);
    this.rememberNodeScrollSample(listContainer, `resize-followup:${phase}`);
    this.rememberNodeScrollSample(
      reactWindowOuterRef,
      `resize-followup:${phase}`
    );
    this.rememberNodeScrollSample(scrollOwnerNode, `resize-followup:${phase}`);
    // eslint-disable-next-line no-console
    console.log('[CHDBG][S1]', {
      seq: getChdbgSeq(),
      t: performance.now(),
      traceId,
      cb: 'ItemList.handleResizeObserver.followup',
      phase,
      listContainerId: getDebugNodeId(listContainer),
      reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
      scrollOwnerId: scrollOwner.nodeId,
      scrollOwnerReason: scrollOwner.reason,
      scrollOwnerCandidateIds: scrollOwner.candidateIds,
      sizerId: getDebugNodeId(sizer),
      listContainer: getNodeDebugInfo(listContainer),
      reactWindowOuterRef: getNodeDebugInfo(reactWindowOuterRef),
      scrollOwnerNode: getNodeDebugInfo(scrollOwnerNode),
      previousListContainerSample,
      previousOuterRefSample,
      previousScrollOwnerSample,
      lastNativeScrollAtAgeMs:
        this.lastNativeScrollEventAt > 0
          ? performance.now() - this.lastNativeScrollEventAt
          : null,
      lastNativeScrollEventNodeId: this.lastNativeScrollEventNodeId,
      lastNativeScrollEventScrollTop: this.lastNativeScrollEventScrollTop,
      listContainerIsReactWindowOuterRef:
        listContainer != null && reactWindowOuterRef != null
          ? listContainer === reactWindowOuterRef
          : null,
      listContainerContainsOuterRef:
        listContainer != null && reactWindowOuterRef != null
          ? listContainer.contains(reactWindowOuterRef)
          : null,
      outerRefContainsListContainer:
        listContainer != null && reactWindowOuterRef != null
          ? reactWindowOuterRef.contains(listContainer)
          : null,
    });
    this.sampleScrollOwnerState(`resize-followup:${phase}`);
  }

  beginResizeMutationWindow(
    traceId: number,
    observedTarget: Element,
    listContainer: HTMLDivElement | null,
    reactWindowOuterRef: HTMLDivElement | null
  ): void {
    const mutationRoot = this.sizerContainer.current?.parentElement;
    if (mutationRoot == null) {
      return;
    }

    let recordCount = 0;
    let addedNodes = 0;
    let removedNodes = 0;
    let touchedObservedTarget = false;
    let touchedListContainer = false;
    let touchedReactWindowOuterRef = false;

    const touchesNode = (candidate: Node, target: Node | null): boolean => {
      if (target == null) {
        return false;
      }
      if (candidate === target) {
        return true;
      }
      return candidate instanceof Element ? candidate.contains(target) : false;
    };

    const observer = new MutationObserver(records => {
      this.runInCallbackContext(
        'ItemList.handleResizeObserver.mutationObserver',
        'mutation-observer',
        { inMutationObserver: true },
        () => {
          records.forEach(record => {
            this.lastMutationObserverAt = performance.now();
            this.mutationSeq += 1;
            recordCount += 1;
            addedNodes += record.addedNodes.length;
            removedNodes += record.removedNodes.length;

            if (touchesNode(record.target, observedTarget)) {
              touchedObservedTarget = true;
            }
            if (touchesNode(record.target, listContainer)) {
              touchedListContainer = true;
            }
            if (touchesNode(record.target, reactWindowOuterRef)) {
              touchedReactWindowOuterRef = true;
            }

            const addedNodeArray = Array.from(record.addedNodes);
            if (
              !touchedObservedTarget &&
              addedNodeArray.some(node => touchesNode(node, observedTarget))
            ) {
              touchedObservedTarget = true;
            }
            if (
              !touchedListContainer &&
              addedNodeArray.some(node => touchesNode(node, listContainer))
            ) {
              touchedListContainer = true;
            }
            if (
              !touchedReactWindowOuterRef &&
              addedNodeArray.some(
                node => touchesNode(node, reactWindowOuterRef)
              )
            ) {
              touchedReactWindowOuterRef = true;
            }

            const removedNodeArray = Array.from(record.removedNodes);
            if (
              !touchedObservedTarget &&
              removedNodeArray.some(node => touchesNode(node, observedTarget))
            ) {
              touchedObservedTarget = true;
            }
            if (
              !touchedListContainer &&
              removedNodeArray.some(node => touchesNode(node, listContainer))
            ) {
              touchedListContainer = true;
            }
            if (
              !touchedReactWindowOuterRef &&
              removedNodeArray.some(
                node => touchesNode(node, reactWindowOuterRef)
              )
            ) {
              touchedReactWindowOuterRef = true;
            }
          });
        }
      );
    });

    observer.observe(mutationRoot, { childList: true, subtree: true });
    requestAnimationFrame(() => {
      this.runInCallbackContext(
        'ItemList.handleResizeObserver.mutationWindow.raf',
        'animation-frame',
        { inRequestAnimationFrame: true },
        () => {
          observer.disconnect();
          // eslint-disable-next-line no-console
          console.log('[CHDBG][S1]', {
            seq: getChdbgSeq(),
            t: performance.now(),
            cb: 'ItemList.handleResizeObserver.mutationWindow',
            traceId,
            resizeTargetId: getDebugNodeId(observedTarget),
            mutationRoot: getNodeDebugInfo(mutationRoot),
            mutationRecordCount: recordCount,
            mutationAddedNodes: addedNodes,
            mutationRemovedNodes: removedNodes,
            touchedObservedTarget,
            touchedListContainer,
            touchedReactWindowOuterRef,
            lastMutationObserverAt: this.lastMutationObserverAt,
          });
        }
      );
    });
  }

  getItemSelected = memoize(
    (index: number, selectedRanges: readonly Range[]) =>
      RangeUtils.isSelected(selectedRanges, index),
    { max: ItemList.CACHE_SIZE }
  );

  getCachedItem = memoize(
    (
      itemIndex: number,
      key: number,
      item: T,
      isFocused: boolean,
      isSelected: boolean,
      renderItem: RenderItemFn<T>,
      style: React.CSSProperties,
      disableSelect: boolean
    ) => {
      const content = renderItem({
        item,
        itemIndex,
        isFocused,
        isSelected,
        style,
      });

      return (
        <ItemListItem
          onContextMenu={this.handleItemContextMenu}
          onDoubleClick={this.handleItemDoubleClick}
          onMouseDown={this.handleItemMouseDown}
          onFocus={this.handleItemFocus}
          onBlur={this.handleItemBlur}
          disableSelect={disableSelect}
          onMouseMove={this.handleItemMouseMove}
          onMouseUp={this.handleItemMouseUp}
          isFocused={isFocused}
          isSelected={isSelected}
          itemIndex={itemIndex}
          style={style}
          key={key}
        >
          {content}
        </ItemListItem>
      );
    },
    { max: ItemList.CACHE_SIZE }
  );

  getOuterElement = memoize(
    (onKeyDown: React.KeyboardEventHandler) => {
      const component = React.forwardRef<HTMLDivElement>((props, ref) => (
        // We need to add the tabIndex to make sure it is focusable, otherwise we can't get key events
        <div
          ref={ref}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          role="presentation"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ));
      component.displayName = 'ItemListOuterElement';
      return component;
    },
    { max: 1000 }
  );

  getInnerElement = memoize(
    () => {
      const component = React.forwardRef<HTMLDivElement>((props, ref) => (
        <div
          className="item-list-inner-element"
          ref={ref}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ));
      component.displayName = 'ItemListInnerElement';
      return component;
    },
    { max: 1000 }
  );

  getItemData = memoize(
    (
      items: readonly T[],
      selectedRanges: readonly Range[],
      renderItem: RenderItemFn<T>
    ) => ({
      items,
      selectedRanges,
      renderItem,
    }),
    { max: 1000 }
  );

  focus(): void {
    this.listContainer.current?.focus();
  }

  restoreScrollPosition(): void {
    const { scrollOffset } = this.state;
    if (scrollOffset != null) {
      const traceId = this.getTraceIdOrNull();
      const listContainer = this.listContainer.current;
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S1W]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.restoreScrollPosition.intent',
        writeKind: 'scrollTo()' as ScrollWriteKind,
        stack: this.getStackTrace(3),
        nodeId: getDebugNodeId(listContainer),
        beforeScrollTop: listContainer?.scrollTop ?? null,
        requestedTop: scrollOffset,
      });
      // manually restore the scroll containers offset
      // virtual list doesn't restore scrolloffset in a re-render if it's the same
      this.listContainer.current?.scrollTo(0, scrollOffset);
    }
  }

  getElement(itemIndex: number): Element | null {
    if (this.listContainer.current == null) {
      return null;
    }

    const { focusSelector } = this.props;
    const { overscanStartIndex } = this.state;
    const elements = this.listContainer.current.querySelectorAll(focusSelector);
    const elementIndex = itemIndex - overscanStartIndex;
    return elements[elementIndex];
  }

  focusItem(itemIndex: number): void {
    const { disableSelect } = this.props;
    if (disableSelect) return;

    this.setState({ focusIndex: itemIndex });

    const element = this.getElement(itemIndex);
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  scrollToItem(itemIndex: number): void {
    const element = this.getElement(itemIndex);
    const traceId = this.getTraceIdOrNull();
    const listContainer = this.listContainer.current;
    // eslint-disable-next-line no-console
    console.log('[CHDBG][S1W]', {
      seq: getChdbgSeq(),
      t: performance.now(),
      traceId,
      cb: 'ItemList.scrollToItem.intent',
      itemIndex,
      writeKind: 'unknown' as ScrollWriteKind,
      nodeId: getDebugNodeId(listContainer),
      beforeScrollTop: listContainer?.scrollTop ?? null,
      stack: this.getStackTrace(3),
    });
    if (element != null) {
      element.scrollIntoView({ block: 'center' });
      this.sampleScrollOwnerState('scrollToItem-after-scrollIntoView');
    }
  }

  handleItemContextMenu(
    itemIndex: number,
    e: React.MouseEvent<HTMLDivElement>
  ): void {
    this.setState({ focusIndex: itemIndex });

    // Update the selection, but don't consume the mouse event - it will trigger the context menu
    const { selectedRanges } = this.state;
    const isSelected = RangeUtils.isSelected(selectedRanges, itemIndex);

    // When right-clicking, we want to maintain the current selection if the right click happened within the selection even if the modifier key isn't down
    const isModifierDown =
      isSelected || ContextActionUtils.isModifierKeyDown(e);
    this.toggleSelect(itemIndex, e.shiftKey, isModifierDown, false);
  }

  handleItemDoubleClick(itemIndex: number, e: React.MouseEvent): void {
    const { isDoubleClickSelect, onSelect } = this.props;

    if (isDoubleClickSelect) {
      this.setState(
        ({ selectedRanges }) => ({
          selectedRanges: RangeUtils.selectRange(selectedRanges, [
            itemIndex,
            itemIndex,
          ]),
        }),
        () => {
          onSelect(itemIndex, e);
        }
      );
    }
  }

  handleItemMouseDown(index: number, e: React.MouseEvent): void {
    const { selectedRanges } = this.state;

    if (
      e.target instanceof HTMLElement &&
      ['button', 'select', 'input', 'textarea'].indexOf(
        e.target.tagName.toLowerCase()
      ) !== -1
    ) {
      // allow these elements to do their own behaviours
      return;
    }

    if (e.button === 2 && selectedRanges.length === 0) {
      // allow right click to act as a selection if selection is empty
      this.focusItem(index);
      this.selectItem(index);
      return;
    }

    if (e.button != null && e.button !== 0) {
      return;
    }

    this.setState({
      mouseDownIndex: index,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });

    window.addEventListener('mouseup', this.handleWindowMouseUp);

    // Leave selection until mouse up, to allow for dragging behaviour
  }

  handleItemBlur(itemIndex: number, e: React.FocusEvent): void {
    log.debug2('item blur', itemIndex, e.currentTarget, e.relatedTarget);
    if (
      !e.relatedTarget ||
      (this.listContainer.current &&
        e.relatedTarget instanceof HTMLElement &&
        !this.listContainer.current.contains(e.relatedTarget))
    ) {
      // Next focused element is outside of the ItemList
      this.setState({ focusIndex: null });
    }
  }

  handleItemFocus(itemIndex: number, e: React.FocusEvent): void {
    log.debug2('item focus', itemIndex, e.target);
    this.setState(state => {
      const { focusIndex } = state;
      if (focusIndex !== itemIndex) {
        return { focusIndex: itemIndex };
      }
      return null;
    });
  }

  handleItemMouseMove(itemIndex: number, e: React.MouseEvent): void {
    const { isDragSelect, isMultiSelect, disableSelect } = this.props;
    const { mouseDownIndex, selectedRanges, mouseX, mouseY } = this.state;

    if (mouseDownIndex == null || disableSelect) return;

    const mouseMoveX = Math.abs(e.clientX - (mouseX ?? 0));
    const mouseMoveY = Math.abs(e.clientY - (mouseY ?? 0));
    if (mouseMoveX > MIN_DRAG_DELTA && mouseMoveY > MIN_DRAG_DELTA) {
      this.setState({ isDragging: true });
    }
    if (isDragSelect || mouseDownIndex === itemIndex) {
      this.focusItem(itemIndex);

      if (isMultiSelect) {
        if (
          !isDragSelect &&
          !this.getItemSelected(itemIndex, selectedRanges) &&
          !ContextActionUtils.isModifierKeyDown(e)
        ) {
          // If there's already a selection and they select outside of that range while dragging without a modifier key, start a new selection with just the new item
          this.deselectAll();
        }
        this.selectRange([
          Math.min(mouseDownIndex, itemIndex),
          Math.max(mouseDownIndex, itemIndex),
        ]);
      } else {
        this.toggleSelect(
          itemIndex,
          e.shiftKey,
          ContextActionUtils.isModifierKeyDown(e),
          false
        );
      }
    }
  }

  handleItemMouseUp(index: number, e: React.MouseEvent): void {
    const { isDeselectOnClick, isDoubleClickSelect, onSelect } = this.props;
    const { mouseDownIndex, isDragging } = this.state;

    if (
      e.target instanceof HTMLElement &&
      ['button', 'select', 'input', 'textarea'].indexOf(
        e.target.tagName.toLowerCase()
      ) !== -1
    ) {
      return;
    }

    if (mouseDownIndex === index && !isDragging) {
      const isShiftDown = e.shiftKey;
      const isModifierDown = ContextActionUtils.isModifierKeyDown(e);
      this.focusItem(index);
      this.toggleSelect(index, isShiftDown, isModifierDown, isDeselectOnClick);

      if (!isDoubleClickSelect && !isShiftDown && !isModifierDown) {
        onSelect(index, e);
      }
    }

    this.resetMouseState();
  }

  handleItemsRendered({
    overscanStartIndex,
    overscanStopIndex,
    visibleStartIndex,
    visibleStopIndex,
  }: ListOnItemsRenderedProps): void {
    this.runInCallbackContext(
      'ItemList.handleItemsRendered',
      'react-window',
      { inReactCommit: true },
      () => {
        const traceId = this.getTraceIdOrNull();
        const listContainer = this.listContainer.current;
        const reactWindowOuterRef = this.getReactWindowOuterRef();
        const scrollOwner = this.resolveScrollOwner();
        this.debugVisibleStartIndex = visibleStartIndex;
        this.debugVisibleStopIndex = visibleStopIndex;
        this.debugOverscanStartIndex = overscanStartIndex;
        this.debugOverscanStopIndex = overscanStopIndex;
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S7]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          traceId,
          cb: 'ItemList.handleItemsRendered',
          renderPassId: this.debugRenderPassId,
          visibleStartIndex,
          visibleStopIndex,
          overscanStartIndex,
          overscanStopIndex,
          listContainerId: getDebugNodeId(listContainer),
          reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
          scrollOwnerId: scrollOwner.nodeId,
          scrollOwnerReason: scrollOwner.reason,
          renderInnerCalls: this.debugRenderInnerCalls,
          renderInnerNullReturns: this.debugRenderInnerNullReturns,
          renderInnerElementReturns: this.debugRenderInnerElementReturns,
        });
        this.scheduleRenderAudit('handleItemsRendered');
        this.setState({ overscanStartIndex });
      }
    );
  }

  handleResizeObserver(entries: ResizeObserverEntry[]): void {
    this.runInCallbackContext(
      'ItemList.handleResizeObserver',
      'resize-observer',
      { inResizeObserver: true },
      () => {
    const entry = entries[0];
    if (entry == null) {
      return;
    }
    this.debugResizeTraceId += 1;
    const traceId = this.debugResizeTraceId;
    this.activeTraceId = traceId;
    this.resizeObserverSeq += 1;
    this.lastResizeObserverAt = performance.now();
    this.syncScrollWriteProbes('handleResizeObserver.enter');
    this.syncNativeScrollListeners('handleResizeObserver.enter');
    const { width, height } = entry.contentRect;
    const { scrollOffset: stateScrollOffset, height: stateHeight } = this.state;
    const observedTarget = entry.target;
    const listContainer = this.listContainer.current;
    const sizer = this.sizerContainer.current;
    const reactWindowOuterRef = this.getReactWindowOuterRef();
    const scrollOwner = this.resolveScrollOwner([
      ...this.getScrollCandidates(),
      ...(observedTarget instanceof HTMLDivElement ? [observedTarget] : []),
    ]);
    const scrollOwnerNode = scrollOwner.node;
    const beforeListContainerSample = this.getNodeSampleSummary(listContainer);
    const beforeOuterRefSample = this.getNodeSampleSummary(reactWindowOuterRef);
    const beforeScrollOwnerSample = this.getNodeSampleSummary(scrollOwnerNode);
    const previousScrollOwnerTop = this.lastScrollOwnerSample?.scrollTop ?? null;
    const scrollOwnerChangedSinceLastSample =
      previousScrollOwnerTop != null &&
      scrollOwnerNode != null &&
      previousScrollOwnerTop !== scrollOwnerNode.scrollTop;
    this.rememberNodeScrollSample(listContainer, 'resize-enter');
    this.rememberNodeScrollSample(reactWindowOuterRef, 'resize-enter');
    this.rememberNodeScrollSample(scrollOwnerNode, 'resize-enter');
    this.sampleScrollOwnerState('resize-observer-enter');
    this.beginResizeMutationWindow(
      traceId,
      observedTarget,
      listContainer,
      reactWindowOuterRef
    );
    // eslint-disable-next-line no-console
    console.log('[CHDBG][S1]', {
      seq: getChdbgSeq(),
      t: performance.now(),
      traceId,
      cb: 'ItemList.handleResizeObserver.enter',
      width,
      height,
      stack: this.getStackTrace(3),
      resizeTargetId: getDebugNodeId(observedTarget),
      listContainerId: getDebugNodeId(listContainer),
      reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
      scrollOwnerId: scrollOwner.nodeId,
      scrollOwnerReason: scrollOwner.reason,
      scrollOwnerCandidateIds: scrollOwner.candidateIds,
      domScrollTop: listContainer?.scrollTop ?? null,
      scrollOwnerTop: scrollOwnerNode?.scrollTop ?? null,
      previousSampledScrollTop: previousScrollOwnerTop,
      scrollTopChangedSinceLastSample: scrollOwnerChangedSinceLastSample,
      stateScrollOffset,
      stateHeight,
      pendingTimer: this.pendingReparentScrollResetTimer != null,
      observedTarget: getNodeDebugInfo(observedTarget),
      sizer: getNodeDebugInfo(sizer),
      listContainer: getNodeDebugInfo(listContainer),
      reactWindowOuterRef: getNodeDebugInfo(reactWindowOuterRef),
      scrollOwnerNode: getNodeDebugInfo(scrollOwnerNode),
      beforeListContainerSample,
      beforeOuterRefSample,
      beforeScrollOwnerSample,
      observedTargetIsSizer: sizer != null ? observedTarget === sizer : null,
      observedTargetIsListContainer:
        listContainer != null ? observedTarget === listContainer : null,
      observedTargetContainsListContainer:
        listContainer != null ? observedTarget.contains(listContainer) : null,
      listContainerContainsObservedTarget:
        listContainer != null ? listContainer.contains(observedTarget) : null,
      listContainerIsReactWindowOuterRef:
        listContainer != null && reactWindowOuterRef != null
          ? listContainer === reactWindowOuterRef
          : null,
      observedTargetChanged:
        this.lastObservedResizeTarget != null
          ? this.lastObservedResizeTarget !== observedTarget
          : null,
      listContainerRefChanged:
        this.lastListContainerRef != null && listContainer != null
          ? this.lastListContainerRef !== listContainer
          : null,
      observedTargetDetached: !observedTarget.isConnected,
      listContainerDetached: listContainer != null ? !listContainer.isConnected : null,
      reactWindowOuterRefDetached:
        reactWindowOuterRef != null ? !reactWindowOuterRef.isConnected : null,
      borderBoxInlineSize:
        Array.isArray(entry.borderBoxSize) && entry.borderBoxSize[0] != null
          ? entry.borderBoxSize[0].inlineSize
          : null,
      borderBoxBlockSize:
        Array.isArray(entry.borderBoxSize) && entry.borderBoxSize[0] != null
          ? entry.borderBoxSize[0].blockSize
          : null,
      lastNativeScrollAtAgeMs:
        this.lastNativeScrollEventAt > 0
          ? performance.now() - this.lastNativeScrollEventAt
          : null,
      lastNativeScrollEventNodeId: this.lastNativeScrollEventNodeId,
      lastNativeScrollEventScrollTop: this.lastNativeScrollEventScrollTop,
      lastReactWindowScrollAtAgeMs:
        this.lastReactWindowScrollAt > 0
          ? performance.now() - this.lastReactWindowScrollAt
          : null,
      lastReactWindowScrollOffset: this.lastReactWindowScrollOffset,
      lastResizeDeltaMs: Date.now() - this.lastResizeTime,
    });
    this.lastObservedResizeTarget = observedTarget;
    this.lastListContainerRef = listContainer;

    queueMicrotask(() => {
      this.runInCallbackContext(
        'ItemList.handleResizeObserver.followup.microtask',
        'microtask',
        {},
        () => {
          this.logResizeFollowup(traceId, 'microtask');
        }
      );
    });

    requestAnimationFrame(() => {
      this.runInCallbackContext(
        'ItemList.handleResizeObserver.followup.raf',
        'animation-frame',
        { inRequestAnimationFrame: true },
        () => {
          this.logResizeFollowup(traceId, 'raf');
        }
      );
    });

    const hadPendingReparentScrollReset =
      this.pendingReparentScrollResetTimer != null;
    const restoreToBottom = this.pendingReparentWasStuckToBottom;
    this.cancelPendingReparentScrollReset();
    this.lastResizeTime = Date.now();
    this.handleResize({ width, height });
    this.sampleScrollOwnerState('resize-observer-after-handleResize');
    if (hadPendingReparentScrollReset) {
      if (restoreToBottom) {
        this.scrollToBottom();
      } else {
        this.restoreScrollPosition();
      }
    }
    // eslint-disable-next-line no-console
    console.log('[CHDBG][S1]', {
      seq: getChdbgSeq(),
      t: performance.now(),
      traceId,
      cb: 'ItemList.handleResizeObserver.exit',
      hadPendingReparentScrollReset,
      restoreToBottom,
      stack: this.getStackTrace(3),
      resizeTargetId: getDebugNodeId(observedTarget),
      listContainerId: getDebugNodeId(this.listContainer.current),
      reactWindowOuterRefId: getDebugNodeId(this.getReactWindowOuterRef()),
      scrollOwnerId: this.resolveScrollOwner().nodeId,
      listContainer: getNodeDebugInfo(this.listContainer.current),
      reactWindowOuterRef: getNodeDebugInfo(this.getReactWindowOuterRef()),
    });
      }
    );
  }

  handleResize({ width, height }: { width: number; height: number }): void {
    this.setState({ width, height });
  }

  handleMouseLeave(): void {
    this.setState({ mouseDownIndex: null });
  }

  handleWindowMouseUp(): void {
    this.resetMouseState();
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  cancelPendingReparentScrollReset(): void {
    if (this.pendingReparentScrollResetTimer != null) {
      clearTimeout(this.pendingReparentScrollResetTimer);
      this.pendingReparentScrollResetTimer = null;
    }
    this.pendingReparentWasStuckToBottom = false;
  }

  commitScrollState({
    scrollUpdateWasRequested,
    scrollOffset,
  }: Pick<
    ListOnScrollProps,
    'scrollUpdateWasRequested' | 'scrollOffset'
  >): void {
    this.setState(state => {
      if (scrollUpdateWasRequested) {
        // The scroll was caused by scrollTo() or scrollToItem()
        // Don't re-calc isStuckToBottom
        return { scrollOffset } as ItemListState;
      }

      const { isStickyBottom } = this.props;
      const { height: stateHeight } = state;

      const nextIsStuckToBottom =
        isStickyBottom &&
        this.isListAtBottom({ scrollOffset, height: stateHeight });
      return {
        isStuckToBottom: nextIsStuckToBottom,
        scrollOffset,
      } as ItemListState;
    });
  }

  handleKeyDown(e: React.KeyboardEvent): void {
    const { isMultiSelect, itemCount, onSelect } = this.props;
    const { focusIndex: oldFocus } = this.state;
    let newFocus = oldFocus;

    if (e.key === 'Enter' || e.key === ' ') {
      if (!isMultiSelect && newFocus != null) {
        this.setState({ selectedRanges: [[newFocus, newFocus]] }, () => {
          if (newFocus != null) {
            onSelect(newFocus, e);
          }
        });
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (newFocus != null && newFocus >= 0) {
        newFocus = Math.max(0, newFocus - 1);
      } else {
        newFocus = itemCount - 1;
      }
    } else if (e.key === 'ArrowDown') {
      if (newFocus != null && newFocus >= 0) {
        newFocus = Math.min(newFocus + 1, itemCount - 1);
      } else {
        newFocus = 0;
      }
    } else {
      return;
    }

    if (oldFocus !== newFocus) {
      e.stopPropagation();
      e.preventDefault();

      this.focusItem(newFocus);

      const { selectedRanges } = this.state;
      if (e.shiftKey && selectedRanges.length > 0) {
        const lastRange = selectedRanges[selectedRanges.length - 1];
        this.selectRange([
          Math.min(newFocus, lastRange[0]),
          Math.max(newFocus, lastRange[1]),
        ]);
      } else {
        this.deselectAll();
        if (newFocus !== null) {
          this.selectItem(newFocus);
        } else {
          this.listContainer.current?.focus();
        }
      }

      this.scrollIntoView(newFocus);
    }
  }

  handleScroll({
    scrollUpdateWasRequested,
    scrollOffset,
  }: ListOnScrollProps): void {
    this.runInCallbackContext(
      'ItemList.handleScroll',
      'scroll',
      { inHandleScroll: true },
      () => {
    this.syncScrollWriteProbes('handleScroll.enter');
    this.syncNativeScrollListeners('handleScroll.enter');
    const traceId = this.getTraceIdOrNull();
    const {
      scrollOffset: prevScrollOffset,
      isStuckToBottom,
      height,
    } = this.state;
    this.handleScrollSeq += 1;
    const listContainer = this.listContainer.current;
    const reactWindowOuterRef = this.getReactWindowOuterRef();
    const scrollOwner = this.resolveScrollOwner();
    const scrollOwnerNode = scrollOwner.node;
    this.lastReactWindowScrollAt = performance.now();
    this.lastHandleScrollAt = this.lastReactWindowScrollAt;
    this.lastReactWindowScrollOffset = scrollOffset;
    this.rememberNodeScrollSample(listContainer, 'react-window-handleScroll');
    this.rememberNodeScrollSample(
      reactWindowOuterRef,
      'react-window-handleScroll'
    );
    this.rememberNodeScrollSample(scrollOwnerNode, 'react-window-handleScroll');
    this.sampleScrollOwnerState('react-window-handleScroll-enter');
    const { isStickyBottom } = this.props;
    const isPotentialReparentScrollReset =
      isStickyBottom &&
      !scrollUpdateWasRequested &&
      scrollOffset <= 0 &&
      prevScrollOffset != null &&
      height != null &&
      prevScrollOffset > height;

    // eslint-disable-next-line no-console
    console.log('[CHDBG][S2]', {
      seq: getChdbgSeq(),
      t: this.lastReactWindowScrollAt,
      traceId,
      cb: scrollUpdateWasRequested
        ? 'ItemList.reactWindowScroll.requested'
        : 'ItemList.reactWindowScroll.unrequested',
      scrollOffset,
      prevScrollOffset,
      stateHeight: height,
      domScrollTop: listContainer?.scrollTop ?? null,
      scrollOwnerTop: scrollOwnerNode?.scrollTop ?? null,
      scrollOwnerId: scrollOwner.nodeId,
      scrollOwnerReason: scrollOwner.reason,
      stack: this.getStackTrace(3),
    });

    // eslint-disable-next-line no-console
    console.log('[CHDBG][S2]', {
      seq: getChdbgSeq(),
      t: this.lastReactWindowScrollAt,
      traceId,
      cb: 'ItemList.handleScroll.enter',
      scrollUpdateWasRequested,
      scrollOffset,
      prevScrollOffset,
      stateHeight: height,
      domScrollTop: listContainer?.scrollTop ?? null,
      listContainerId: getDebugNodeId(listContainer),
      reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
      scrollOwnerId: scrollOwner.nodeId,
      scrollOwnerReason: scrollOwner.reason,
      scrollOwnerTop: scrollOwnerNode?.scrollTop ?? null,
      isStuckToBottom,
      isPotentialReparentScrollReset,
      lastNativeScrollAtAgeMs:
        this.lastNativeScrollEventAt > 0
          ? this.lastReactWindowScrollAt - this.lastNativeScrollEventAt
          : null,
      lastNativeScrollEventNodeId: this.lastNativeScrollEventNodeId,
      lastNativeScrollEventScrollTop: this.lastNativeScrollEventScrollTop,
      lastResizeDeltaMs: Date.now() - this.lastResizeTime,
      lastMutationObserverDeltaMs:
        this.lastMutationObserverAt > 0
          ? this.lastReactWindowScrollAt - this.lastMutationObserverAt
          : null,
      stack: this.getStackTrace(3),
    });
    // Golden Layout resets the scroll container's scrollTop to 0 when it
    // re-parents our DOM subtree (which happens when a sibling panel is
    // closed), which react-window reports as an unrequested scroll to the top.
    // We only see this immediately after a resize, so if we get an unrequested
    // scroll to the top right after a size change while we were scrolled well
    // past the top, treat it as spurious and restore our position rather than
    // jumping to the top with an out-of-view data window (DH-22991).
    if (isPotentialReparentScrollReset) {
      if (Date.now() - this.lastResizeTime < ItemList.REPARENT_SCROLL_GRACE) {
        this.cancelPendingReparentScrollReset();
        if (isStuckToBottom) {
          this.scrollToBottom();
        } else {
          this.restoreScrollPosition();
        }
        this.sampleScrollOwnerState('react-window-handleScroll-spurious-reset-restored');
        return;
      }

      // If the reset arrives before the corresponding resize callback, defer
      // committing it briefly and resolve once we know whether a resize follows.
      this.cancelPendingReparentScrollReset();
      this.pendingReparentWasStuckToBottom = isStuckToBottom;
      this.pendingReparentScrollResetTimer = setTimeout(() => {
        this.runInCallbackContext(
          'ItemList.handleScroll.deferredCommit.timeout',
          'timeout',
          {},
          () => {
            this.pendingReparentScrollResetTimer = null;
            this.pendingReparentWasStuckToBottom = false;
            this.commitScrollState({
              scrollUpdateWasRequested,
              scrollOffset,
            });
            this.sampleScrollOwnerState('react-window-handleScroll-deferred-commit');
          }
        );
      }, ItemList.REPARENT_SCROLL_GRACE);
      return;
    }

    this.cancelPendingReparentScrollReset();
    this.commitScrollState({ scrollUpdateWasRequested, scrollOffset });
    this.sampleScrollOwnerState('react-window-handleScroll-commit');
      }
    );
  }

  resetMouseState(): void {
    this.setState({ mouseDownIndex: null, isDragging: false });
  }

  scrollToBottom(): void {
    const { itemCount } = this.props;
    if (this.list.current) {
      const traceId = this.getTraceIdOrNull();
      const listContainer = this.listContainer.current;
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S1W]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.scrollToBottom.intent',
        itemCount,
        writeKind: 'unknown' as ScrollWriteKind,
        stack: this.getStackTrace(3),
        nodeId: getDebugNodeId(listContainer),
        beforeScrollTop: listContainer?.scrollTop ?? null,
      });
      this.list.current.scrollToItem(itemCount);
      this.sampleScrollOwnerState('scrollToBottom-after-scrollToItem');
    }
  }

  scrollIntoView(itemIndex: number): void {
    if (this.list.current) {
      const traceId = this.getTraceIdOrNull();
      const listContainer = this.listContainer.current;
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S1W]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.scrollIntoView.intent',
        itemIndex,
        writeKind: 'unknown' as ScrollWriteKind,
        stack: this.getStackTrace(3),
        nodeId: getDebugNodeId(listContainer),
        beforeScrollTop: listContainer?.scrollTop ?? null,
      });
      this.list.current.scrollToItem(itemIndex);
      this.sampleScrollOwnerState('scrollIntoView-after-scrollToItem');
    }
  }

  /**
   * @param index The index to toggle selection for
   * @param isShiftDown True if the shift modifier key is down
   * @param isModifierDown True if the meta modifier key is down
   * @param isDeselectable True if item should be deselected if already selected
   */
  toggleSelect(
    index: number,
    isShiftDown: boolean,
    isModifierDown: boolean,
    isDeselectable = true
  ): void {
    const { isMultiSelect } = this.props;
    const { selectedRanges } = this.state;

    if (isMultiSelect && isShiftDown && selectedRanges.length > 0) {
      const lastRange = selectedRanges[selectedRanges.length - 1];
      this.selectRange([
        Math.min(lastRange[0], index),
        Math.max(index, lastRange[1]),
      ]);
    } else if (
      isMultiSelect &&
      selectedRanges.length === 1 &&
      selectedRanges[0][0] === index &&
      selectedRanges[0][1] === index
    ) {
      if (isDeselectable) {
        this.deselectItem(index);
      }
    } else if (isMultiSelect && isModifierDown) {
      if (this.getItemSelected(index, selectedRanges)) {
        if (isDeselectable) {
          this.deselectItem(index);
        }
      } else {
        this.selectItem(index);
      }
    } else {
      this.deselectAll();
      this.selectItem(index);
    }
  }

  deselectAll(): void {
    const { itemCount } = this.props;
    this.deselectRange([0, itemCount]);
  }

  deselectItem(index: number): void {
    this.deselectRange([index, index]);
  }

  deselectRange(range: Range): void {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.deselectRange(selectedRanges, range),
    }));
  }

  selectItem(index: number): void {
    const { disableSelect } = this.props;
    if (disableSelect) return;

    this.selectRange([index, index]);
  }

  selectRange(range: Range): void {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.selectRange(selectedRanges, range),
    }));
  }

  setSelectedRanges(selectedRanges: readonly Range[]): void {
    this.setState({ selectedRanges });
  }

  sendViewportUpdate(): void {
    const { scrollOffset, height } = this.state;
    if (scrollOffset != null && height != null) {
      const { onViewportChange, rowHeight } = this.props;
      const topRow = Math.floor(scrollOffset / rowHeight);
      const bottomRow = topRow + Math.ceil(height / rowHeight);
      const traceId = this.getTraceIdOrNull();
      const listContainer = this.listContainer.current;
      const reactWindowOuterRef = this.getReactWindowOuterRef();
      const scrollOwner = this.resolveScrollOwner();
      // eslint-disable-next-line no-console
      console.log('[CHDBG][S4]', {
        seq: getChdbgSeq(),
        t: performance.now(),
        traceId,
        cb: 'ItemList.sendViewportUpdate',
        scrollOffset,
        height,
        rowHeight,
        topRow,
        bottomRow,
        domScrollTop: listContainer?.scrollTop ?? null,
        listContainerId: getDebugNodeId(listContainer),
        reactWindowOuterRefId: getDebugNodeId(reactWindowOuterRef),
        scrollOwnerId: scrollOwner.nodeId,
        scrollOwnerReason: scrollOwner.reason,
        scrollOwnerTop: scrollOwner.node?.scrollTop ?? null,
      });
      onViewportChange(topRow, bottomRow);
    }
  }

  isListAtBottom(
    {
      scrollOffset,
      height,
    }: Pick<ItemListState, 'scrollOffset' | 'height'> = this.state
  ): boolean {
    if (height == null || scrollOffset == null) {
      return false;
    }

    const { itemCount, rowHeight } = this.props;
    return scrollOffset + height >= itemCount * rowHeight;
  }

  renderInnerElement({
    index: itemIndex,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }): React.ReactElement | null {
    return this.runInCallbackContext(
      'ItemList.renderInnerElement',
      'react-render',
      { inReactRender: true },
      () => {
    const traceId = this.getTraceIdOrNull();
    const scrollOwner = this.resolveScrollOwner();
    this.debugRenderInnerCalls += 1;
    const { items, offset, renderItem, disableSelect } = this.props;
    const { focusIndex, selectedRanges, scrollOffset, height } = this.state;
    const { rowHeight } = this.props;
    const topVisibleRow =
      scrollOffset != null ? Math.floor(scrollOffset / rowHeight) : null;
    const bottomVisibleRow =
      topVisibleRow != null && height != null
        ? topVisibleRow + Math.ceil(height / rowHeight)
        : null;
    const isVisibleByState =
      topVisibleRow != null &&
      bottomVisibleRow != null &&
      itemIndex >= topVisibleRow &&
      itemIndex <= bottomVisibleRow;
    if (isVisibleByState) {
      this.debugRenderVisibleCalls += 1;
      if (this.debugRenderVisibleCalls === 1) {
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S7]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          traceId,
          cb: 'ItemList.renderInnerElement.firstVisibleCall',
          renderPassId: this.debugRenderPassId,
          scrollOwnerId: scrollOwner.nodeId,
          scrollOwnerReason: scrollOwner.reason,
          itemIndex,
          topVisibleRow,
          bottomVisibleRow,
          offset,
          itemsLength: items.length,
          stateScrollOffset: scrollOffset,
          stateHeight: height,
        });
      }
    }
    if (itemIndex < offset || itemIndex >= offset + items.length) {
      this.debugRenderInnerNullReturns += 1;
      if (
        topVisibleRow != null &&
        bottomVisibleRow != null &&
        itemIndex >= topVisibleRow &&
        itemIndex <= bottomVisibleRow
      ) {
        this.debugRenderVisibleNullReturns += 1;
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S7]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          traceId,
          cb: 'ItemList.renderInnerElement.visibleNull',
          renderPassId: this.debugRenderPassId,
          scrollOwnerId: scrollOwner.nodeId,
          scrollOwnerReason: scrollOwner.reason,
          itemIndex,
          topVisibleRow,
          bottomVisibleRow,
          offset,
          itemsLength: items.length,
          stateScrollOffset: scrollOffset,
          stateHeight: height,
        });
      }
      return null;
    }

    this.debugRenderInnerElementReturns += 1;
    if (isVisibleByState) {
      this.debugRenderVisibleElementReturns += 1;
    }

    const item = items[itemIndex - offset];
    return this.getCachedItem(
      itemIndex,
      itemIndex,
      item,
      itemIndex === focusIndex && !disableSelect,
      this.getItemSelected(itemIndex, selectedRanges),
      renderItem,
      style,
      disableSelect
    );
      }
    );
  }

  render(): JSX.Element {
    return this.runInCallbackContext(
      'ItemList.render',
      'react-render',
      { inReactRender: true },
      () => {
    this.debugRenderPassId += 1;
    this.debugRenderInnerCalls = 0;
    this.debugRenderInnerNullReturns = 0;
    this.debugRenderInnerElementReturns = 0;
    this.debugRenderVisibleCalls = 0;
    this.debugRenderVisibleNullReturns = 0;
    this.debugRenderVisibleElementReturns = 0;

    const {
      items,
      itemCount,
      overscanCount,
      renderItem,
      rowHeight,
      'data-testid': dataTestId,
    } = this.props;
    const { selectedRanges, isStuckToBottom, width, height } = this.state;
    const traceId = this.getTraceIdOrNull();
    const scrollOwner = this.resolveScrollOwner();
    const domScrollTop = scrollOwner.node?.scrollTop ?? null;
    const topVisibleRow =
      this.state.scrollOffset != null
        ? Math.floor(this.state.scrollOffset / rowHeight)
        : null;
    const bottomVisibleRow =
      topVisibleRow != null && height != null
        ? topVisibleRow + Math.ceil(height / rowHeight)
        : null;
    const nextRenderSnapshot: RenderSnapshot = {
      stateScrollOffset: this.state.scrollOffset,
      stateHeight: this.state.height,
      itemCount,
      itemsLength: items.length,
      overscanStartIndex: this.state.overscanStartIndex,
      visibleStartIndex: this.debugVisibleStartIndex,
      visibleStopIndex: this.debugVisibleStopIndex,
    };
    const renderReasons = this.inferRenderReason(nextRenderSnapshot);
    this.lastRenderSnapshot = nextRenderSnapshot;
    this.renderSeq += 1;
    this.lastRenderAt = performance.now();
    const domStateMismatch =
      domScrollTop != null &&
      this.state.scrollOffset != null &&
      Math.abs(domScrollTop - this.state.scrollOffset) > 1;
    // eslint-disable-next-line no-console
    console.log('[CHDBG][S7]', {
      seq: getChdbgSeq(),
      t: this.lastRenderAt,
      traceId,
      cb: 'ItemList.render.enter',
      renderPassId: this.debugRenderPassId,
      renderReason: renderReasons,
      stateScrollOffset: this.state.scrollOffset,
      domScrollTop,
      stateHeight: this.state.height,
      visibleRowRange: {
        top: topVisibleRow,
        bottom: bottomVisibleRow,
      },
      scrollOwnerId: scrollOwner.nodeId,
      scrollOwnerReason: scrollOwner.reason,
      domStateMismatch,
      stack: domStateMismatch ? this.getStackTrace(3) : null,
    });
    this.sampleScrollOwnerState('render-enter');

    if (width == null || height == null) {
      const key = `${width ?? 'null'}:${height ?? 'null'}:${itemCount}`;
      if (key !== this.debugRenderSuppressedKey) {
        // eslint-disable-next-line no-console
        console.log('[CHDBG][S7]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          traceId,
          cb: 'ItemList.render.listSuppressed',
          renderPassId: this.debugRenderPassId,
          width,
          height,
          itemCount,
          itemsLength: items.length,
        });
        this.debugRenderSuppressedKey = key;
      }
    } else {
      this.debugRenderSuppressedKey = '';
    }

    return (
      <div
        className="item-list-auto-sizer"
        ref={this.sizerContainer}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      >
        {width != null && height != null && (
          <List
            className="item-list-scroll-pane"
            height={height}
            width={width}
            initialScrollOffset={isStuckToBottom ? itemCount * rowHeight : 0}
            itemCount={itemCount}
            itemSize={rowHeight}
            // This prop isn't actually used by us, it is passed to the render function by react-window
            // Used here to force a re-render of the List component.
            // Otherwise it doesn't know to call the render again when selection or renderItem changes
            itemData={this.getItemData(items, selectedRanges, renderItem)}
            onScroll={this.handleScroll}
            onItemsRendered={this.handleItemsRendered}
            ref={this.list}
            outerElementType={this.getOuterElement(this.handleKeyDown)}
            outerRef={this.listContainer}
            innerElementType={this.getInnerElement()}
            overscanCount={overscanCount}
            data-testid={dataTestId}
          >
            {this.renderInnerElement}
          </List>
        )}
      </div>
    );
      }
    );
  }
}

export default ItemList;
