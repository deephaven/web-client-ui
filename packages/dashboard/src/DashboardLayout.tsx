import React, {
  type ComponentType,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type GoldenLayout from '@deephaven/golden-layout';
import type {
  Container,
  ItemConfig,
  ReactComponentConfig,
  AbstractContentItem,
} from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import { usePrevious, useThrottledCallback } from '@deephaven/react-hooks';
import { ErrorBoundary } from '@deephaven/components';
import { type RootState } from '@deephaven/redux';
import { useDispatch, useSelector } from 'react-redux';
import PanelManager, { type ClosedPanels } from './PanelManager';
import PanelErrorBoundary from './PanelErrorBoundary';
import LayoutUtils, { isReactComponentConfig } from './layout/LayoutUtils';
import {
  canHaveRef,
  dehydrate as dehydrateDefault,
  hydrate as hydrateDefault,
} from './DashboardUtils';
import PanelEvent from './PanelEvent';
import { useListener } from './layout';
import { getDashboardData, updateDashboardData } from './redux';
import {
  type PanelConfig,
  type PanelComponentType,
  type PanelDehydrateFunction,
  type PanelHydrateFunction,
  type PanelProps,
  type DehydratedPanelProps,
} from './DashboardPlugin';
import DashboardPanelWrapper from './DashboardPanelWrapper';
import { PanelIdContext } from './usePanelId';

export type DashboardLayoutConfig = ItemConfig[];

const log = Log.module('DashboardLayout');

const EMPTY_OBJECT = Object.freeze({});

const DEFAULT_LAYOUT_CONFIG: DashboardLayoutConfig = [];

const DEFAULT_CALLBACK = (): void => undefined;

const STATE_CHANGE_THROTTLE_MS = 1000;

// If a component isn't registered, just pass through the props so they are saved if a plugin is loaded later
const FALLBACK_CALLBACK = <P,>(props: P): P => props;

type DashboardData = {
  closed?: ClosedPanels;
};

type DashboardLayoutProps = React.PropsWithChildren<{
  id: string;

  // Default hydrate/dehydration functions
  hydrate?: PanelHydrateFunction;
  dehydrate?: PanelDehydrateFunction;
  layout: GoldenLayout;
  layoutConfig?: DashboardLayoutConfig;
  onLayoutChange?: (dehydratedLayout: DashboardLayoutConfig) => void;
  onLayoutInitialized?: () => void;
  data?: DashboardData;
  emptyDashboard?: React.ReactNode;

  /** Component to wrap each panel with */
  panelWrapper?: ComponentType<React.PropsWithChildren<PanelProps>>;
}>;

/**
 * DashboardLayout component. Handles hydrating, dehydrating components, listening for dragging panels.
 */
export function DashboardLayout({
  id,
  children,
  emptyDashboard = <div className="dashboard-empty">Dashboard is empty.</div>,
  layout,
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
  onLayoutChange = DEFAULT_CALLBACK,
  onLayoutInitialized = DEFAULT_CALLBACK,
  hydrate = hydrateDefault,
  dehydrate = dehydrateDefault,
  panelWrapper,
}: DashboardLayoutProps): JSX.Element {
  const dispatch = useDispatch();
  const data =
    useSelector<RootState>(state => getDashboardData(state, id)) ??
    EMPTY_OBJECT;

  const [isDashboardEmpty, setIsDashboardEmpty] = useState(false);
  const [isItemDragging, setIsItemDragging] = useState(false);
  const [lastConfig, setLastConfig] = useState<DashboardLayoutConfig>();
  const [initialClosedPanels] = useState<ReactComponentConfig[] | undefined>(
    (data as DashboardData)?.closed ?? []
  );
  const [layoutChildren, setLayoutChildren] = useState(
    layout.getReactChildren()
  );

  const hydrateMap = useMemo(() => new Map<string, PanelHydrateFunction>(), []);
  const dehydrateMap = useMemo(
    () => new Map<string, PanelDehydrateFunction>(),
    []
  );
  const registerComponent = useCallback(
    (
      name: string,
      componentType: PanelComponentType,
      componentHydrate = hydrate,
      componentDehydrate = dehydrate
    ) => {
      log.debug2(
        'registerComponent',
        name,
        componentType,
        componentHydrate,
        componentDehydrate
      );

      function wrappedComponent(
        props: PanelProps,
        ref: React.Ref<unknown>
      ): JSX.Element {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const CType = componentType as any;
        const PanelWrapperType = panelWrapper;

        /**
         * The ref is used to detect changes to class component state so we
         * can track changes to panelState. We should opt for more explicit
         * state changes in the future and in functional components.
         */
        const hasRef = canHaveRef(CType);

        const innerElem = hasRef ? (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <CType {...props} ref={ref} />
        ) : (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <CType {...props} />
        );

        // Props supplied by GoldenLayout
        const { glContainer, glEventHub } = props;
        const panelId = LayoutUtils.getIdFromContainer(glContainer);
        return (
          <PanelErrorBoundary glContainer={glContainer} glEventHub={glEventHub}>
            <PanelIdContext.Provider value={panelId as string | null}>
              {/* eslint-disable-next-line react/jsx-props-no-spreading */}
              <DashboardPanelWrapper {...props}>
                {PanelWrapperType == null ? (
                  innerElem
                ) : (
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  <PanelWrapperType {...props}>{innerElem}</PanelWrapperType>
                )}
              </DashboardPanelWrapper>
            </PanelIdContext.Provider>
          </PanelErrorBoundary>
        );
      }

      wrappedComponent.displayName = `DashboardWrapper(${
        componentType.displayName ?? name
      })`;

      const cleanup = layout.registerComponent(
        name,
        React.forwardRef(wrappedComponent)
      );
      hydrateMap.set(name, componentHydrate);
      dehydrateMap.set(name, componentDehydrate);
      return cleanup;
    },
    [hydrate, dehydrate, hydrateMap, dehydrateMap, layout, panelWrapper]
  );
  const hydrateComponent = useCallback(
    (name: string, props: DehydratedPanelProps) =>
      (hydrateMap.get(name) ?? (FALLBACK_CALLBACK as PanelHydrateFunction))(
        props,
        id
      ),
    [hydrateMap, id]
  );
  const dehydrateComponent = useCallback(
    (name: string, config: PanelConfig) =>
      (dehydrateMap.get(name) ?? (FALLBACK_CALLBACK as PanelDehydrateFunction))(
        config,
        id
      ),
    [dehydrateMap, id]
  );
  const panelManager = useMemo(
    () =>
      new PanelManager(
        layout,
        hydrateComponent,
        dehydrateComponent,
        new Map(),
        initialClosedPanels,
        ({ closed, openedMap }) => {
          dispatch(updateDashboardData(id, { closed, openedMap }));
        }
      ),
    [
      dehydrateComponent,
      dispatch,
      hydrateComponent,
      id,
      initialClosedPanels,
      layout,
    ]
  );

  // Throttle the calls so that we don't flood comparing these layouts
  const throttledProcessDehydratedLayoutConfig = useThrottledCallback(
    (dehydratedLayoutConfig: DashboardLayoutConfig) => {
      const hasChanged =
        lastConfig == null ||
        !LayoutUtils.isEqual(lastConfig, dehydratedLayoutConfig);

      log.debug('handleLayoutStateChanged', hasChanged, dehydratedLayoutConfig);

      if (hasChanged) {
        setIsDashboardEmpty(layout.root.contentItems.length === 0);

        setLastConfig(dehydratedLayoutConfig);

        onLayoutChange(dehydratedLayoutConfig);

        setLayoutChildren(layout.getReactChildren());
      }
    },
    STATE_CHANGE_THROTTLE_MS,
    { flushOnUnmount: true }
  );

  useEffect(
    () => () => throttledProcessDehydratedLayoutConfig.flush(),
    [throttledProcessDehydratedLayoutConfig]
  );

  const handleLayoutStateChanged = useCallback(() => {
    // we don't want to emit stateChanges that happen during item drags or else
    // we risk the last saved state being one without that panel in the layout entirely
    if (isItemDragging) return;

    const glConfig = layout.toConfig();
    const contentConfig = glConfig.content;
    const dehydratedLayoutConfig = LayoutUtils.dehydrateLayoutConfig(
      contentConfig,
      dehydrateComponent
    );
    throttledProcessDehydratedLayoutConfig(dehydratedLayoutConfig);
  }, [
    dehydrateComponent,
    isItemDragging,
    layout,
    throttledProcessDehydratedLayoutConfig,
  ]);

  const handleLayoutItemPickedUp = useCallback(
    (component: Container) => {
      const componentId = LayoutUtils.getIdFromContainer(component);
      layout.eventHub.emit(PanelEvent.DRAGGING, componentId);
      setIsItemDragging(true);
    },
    [layout.eventHub]
  );

  const handleLayoutItemDropped = useCallback(
    (component: Container) => {
      const componentId = LayoutUtils.getIdFromContainer(component);
      layout.eventHub.emit(PanelEvent.DROPPED, componentId);
      setIsItemDragging(false);
    },
    [layout.eventHub]
  );

  const handleComponentCreated = useCallback((item: AbstractContentItem) => {
    log.debug2('handleComponentCreated', item);

    if (
      item == null ||
      item.config == null ||
      !isReactComponentConfig(item.config) ||
      item.config.component == null ||
      item.element == null
    ) {
      return;
    }

    const cssComponent = item.config.component
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    const cssClass = `${cssComponent}-component`;
    item.element.addClass(cssClass);
  }, []);

  const handleReactChildrenChange = useCallback(() => {
    setLayoutChildren(layout.getReactChildren());
  }, [layout]);

  useListener(layout, 'stateChanged', handleLayoutStateChanged);
  useListener(layout, 'itemPickedUp', handleLayoutItemPickedUp);
  useListener(layout, 'itemDropped', handleLayoutItemDropped);
  useListener(layout, 'componentCreated', handleComponentCreated);
  useListener(
    layout.eventHub,
    PanelEvent.TITLE_CHANGED,
    handleLayoutStateChanged
  );
  useListener(layout, 'reactChildrenChanged', handleReactChildrenChange);

  const previousLayoutConfig = usePrevious(layoutConfig);
  useEffect(
    function loadNewConfig() {
      if (
        previousLayoutConfig !== layoutConfig &&
        layoutConfig !== lastConfig
      ) {
        log.debug('Setting new layout content...');
        const content = LayoutUtils.hydrateLayoutConfig(
          layoutConfig,
          hydrateComponent
        );
        // Remove the old layout before add the new one
        while (layout.root.contentItems.length > 0) {
          layout.root.contentItems[0].remove();
        }

        // Add the new content. It is usally just one item from the root
        for (let i = 0; i < content.length; i += 1) {
          layout.root.addChild(content[i]);
        }

        setIsDashboardEmpty(layout.root.contentItems.length === 0);
      }
    },
    [
      hydrateComponent,
      layout,
      layoutConfig,
      lastConfig,
      panelManager,
      previousLayoutConfig,
    ]
  );

  // This should be the last hook called in this component
  // Ensures it runs after any other effects on mount
  // Fire only once after the layout is mounted
  // This should ensure DashboardPlugins have been mounted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onLayoutInitialized(), []);

  return (
    <>
      {isDashboardEmpty && emptyDashboard}
      {layoutChildren}
      {React.Children.map(children, child =>
        child != null ? (
          // Have fallback be an empty array so that we don't show the error message over entire app
          // Look into using toast message in the future
          <ErrorBoundary fallback={[]}>
            {React.cloneElement(child as ReactElement, {
              id,
              layout,
              panelManager,
              registerComponent,
            })}
          </ErrorBoundary>
        ) : null
      )}
    </>
  );
}

export default DashboardLayout;
