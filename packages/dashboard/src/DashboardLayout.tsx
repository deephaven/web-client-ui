import React, {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import GoldenLayout from '@deephaven/golden-layout';
import type {
  Container,
  ItemConfigType,
  ReactComponentConfig,
} from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import { usePrevious } from '@deephaven/react-hooks';
import { RootState } from '@deephaven/redux';
import { useDispatch, useSelector } from 'react-redux';
import PanelManager, { ClosedPanels } from './PanelManager';
import PanelErrorBoundary from './PanelErrorBoundary';
import LayoutUtils from './layout/LayoutUtils';
import {
  dehydrate as dehydrateDefault,
  hydrate as hydrateDefault,
} from './DashboardUtils';
import PanelEvent from './PanelEvent';
import { GLPropTypes, useListener } from './layout';
import { getDashboardData, updateDashboardData } from './redux';
import {
  PanelComponentType,
  PanelDehydrateFunction,
  PanelHydrateFunction,
  PanelProps,
} from './DashboardPlugin';

export type DashboardLayoutConfig = ItemConfigType[];

const log = Log.module('DashboardLayout');

const EMPTY_OBJECT = Object.freeze({});

const DEFAULT_LAYOUT_CONFIG: DashboardLayoutConfig = [];

const DEFAULT_CALLBACK = () => undefined;

// If a component isn't registered, just pass through the props so they are saved if a plugin is loaded later
const FALLBACK_CALLBACK = (props: unknown) => props;

type DashboardData = {
  closed?: ClosedPanels;
};

interface DashboardLayoutProps {
  id: string;

  // Default hydrate/dehydration functions
  hydrate?: PanelHydrateFunction;
  dehydrate?: PanelDehydrateFunction;
  layout: GoldenLayout;
  layoutConfig?: DashboardLayoutConfig;
  onLayoutChange?: (dehydratedLayout: DashboardLayoutConfig) => void;
  onLayoutInitialized?: () => void;
  data?: DashboardData;
  children?: React.ReactNode | React.ReactNode[];
  emptyDashboard?: React.ReactNode;

  /** Component to wrap each panel with */
  panelWrapper?: ComponentType;
}

/**
 * DashboardLayout component. Handles hydrating, dehydrating components, listening for dragging panels.
 */
export function DashboardLayout({
  id,
  children,
  emptyDashboard = <div>Dashboard is empty.</div>,
  layout,
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
  onLayoutChange = DEFAULT_CALLBACK,
  onLayoutInitialized = DEFAULT_CALLBACK,
  hydrate = hydrateDefault,
  dehydrate = dehydrateDefault,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  panelWrapper = ({ children: panelChildren }) => <>{panelChildren}</>,
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
  const [isDashboardInitialized, setIsDashboardInitialized] = useState(false);
  const [layoutChildren, setLayoutChildren] = useState(
    layout.getReactChildren()
  );

  const hydrateMap = useMemo(() => new Map(), []);
  const dehydrateMap = useMemo(() => new Map(), []);
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

      function renderComponent(props: PanelProps, ref: unknown) {
        // Cast it to an `any` type so we can pass the ref in correctly.
        // ComponentType doesn't seem to work right, ReactNode is also incorrect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const CType = componentType as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PanelWrapperType = panelWrapper as any;

        // Props supplied by GoldenLayout
        // eslint-disable-next-line react/prop-types
        const { glContainer, glEventHub } = props;
        return (
          <PanelErrorBoundary glContainer={glContainer} glEventHub={glEventHub}>
            <PanelWrapperType>
              {/* eslint-disable-next-line react/jsx-props-no-spreading */}
              <CType {...props} ref={ref} />
            </PanelWrapperType>
          </PanelErrorBoundary>
        );
      }

      const wrappedComponent = React.forwardRef(renderComponent);
      const cleanup = layout.registerComponent(name, wrappedComponent);
      hydrateMap.set(name, componentHydrate);
      dehydrateMap.set(name, componentDehydrate);
      return cleanup;
    },
    [hydrate, dehydrate, hydrateMap, dehydrateMap, layout, panelWrapper]
  );
  const hydrateComponent = useCallback(
    (name, props) => (hydrateMap.get(name) ?? FALLBACK_CALLBACK)(props, id),
    [hydrateMap, id]
  );
  const dehydrateComponent = useCallback(
    (name, config) => (dehydrateMap.get(name) ?? FALLBACK_CALLBACK)(config, id),
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

  const handleLayoutStateChanged = useCallback(() => {
    // we don't want to emit stateChanges that happen during item drags or else
    // we risk the last saved state being one without that panel in the layout entirely
    if (isItemDragging) return;

    if (!isDashboardInitialized) {
      onLayoutInitialized();
      setIsDashboardInitialized(true);
    }

    const glConfig = layout.toConfig();
    const contentConfig = glConfig.content;
    const dehydratedLayoutConfig = LayoutUtils.dehydrateLayoutConfig(
      contentConfig,
      dehydrateComponent
    );
    const hasChanged =
      lastConfig == null ||
      !LayoutUtils.isEqual(lastConfig, dehydratedLayoutConfig);

    log.debug(
      'handleLayoutStateChanged',
      hasChanged,
      contentConfig,
      dehydratedLayoutConfig
    );

    if (hasChanged) {
      setIsDashboardEmpty(layout.root.contentItems.length === 0);

      setLastConfig(dehydratedLayoutConfig);

      onLayoutChange(dehydratedLayoutConfig);

      setLayoutChildren(layout.getReactChildren());
    }
  }, [
    dehydrateComponent,
    isDashboardInitialized,
    isItemDragging,
    lastConfig,
    layout,
    onLayoutChange,
    onLayoutInitialized,
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

  const handleComponentCreated = useCallback(item => {
    log.debug2('handleComponentCreated', item);

    if (
      item == null ||
      item.config == null ||
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

  return (
    <>
      {isDashboardEmpty && emptyDashboard}
      {layoutChildren}
      {React.Children.map(children, child =>
        child != null
          ? React.cloneElement(child as ReactElement, {
              id,
              layout,
              panelManager,
              registerComponent,
            })
          : null
      )}
    </>
  );
}

DashboardLayout.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  data: PropTypes.shape({}),
  emptyDashboard: PropTypes.node,
  layout: GLPropTypes.Layout.isRequired,
  layoutConfig: PropTypes.arrayOf(PropTypes.shape({})),
  onLayoutChange: PropTypes.func,
  onLayoutInitialized: PropTypes.func,
};

export default DashboardLayout;
