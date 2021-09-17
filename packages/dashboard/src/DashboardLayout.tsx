import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import GoldenLayout, { ItemConfigType } from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import { usePrevious } from '@deephaven/react-hooks';
import { Provider, useStore } from 'react-redux';
import PanelManager from './PanelManager';
import PanelErrorBoundary from './PanelErrorBoundary';
import LayoutUtils from './layout/LayoutUtils';
import {
  dehydrate as dehydrateDefault,
  hydrate as hydrateDefault,
} from './DashboardUtils';
import PanelEvent from './PanelEvent';
import { GLPropTypes, useListener } from './layout';

export type DashboardLayoutConfig = ItemConfigType[];

const log = Log.module('DashboardLayout');

const DEFAULT_LAYOUT_CONFIG: DashboardLayoutConfig = [];

const DEFAULT_CALLBACK = () => undefined;

export type DashboardLayoutProps = {
  id: string;
  layout: GoldenLayout;
  layoutConfig?: DashboardLayoutConfig;
  onLayoutChange?: (dehydratedLayout: DashboardLayoutConfig) => void;
  children?: React.ReactNode | React.ReactNode[];
};

/**
 * DashboardLayout component. Handles hydrating, dehydrating components, listening for dragging panels.
 */
export const DashboardLayout = ({
  id,
  children,
  layout,
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
  onLayoutChange = DEFAULT_CALLBACK,
}: DashboardLayoutProps): JSX.Element => {
  const [isItemDragging, setIsItemDragging] = useState(false);
  const [lastConfig, setLastConfig] = useState<DashboardLayoutConfig>();

  const hydrateMap = useMemo(() => new Map(), []);
  const dehydrateMap = useMemo(() => new Map(), []);
  const store = useStore();
  const registerComponent = useCallback(
    (
      name,
      ComponentType,
      hydrate = hydrateDefault,
      dehydrate = dehydrateDefault
    ) => {
      log.debug2('registerComponent', name, ComponentType, hydrate, dehydrate);

      function renderComponent(
        props: { glContainer: unknown; glEventHub: unknown },
        ref: unknown
      ) {
        // Props supplied by GoldenLayout
        // eslint-disable-next-line react/prop-types
        const { glContainer, glEventHub } = props;
        return (
          <Provider store={store}>
            <PanelErrorBoundary
              glContainer={glContainer}
              glEventHub={glEventHub}
            >
              {/* eslint-disable-next-line react/jsx-props-no-spreading */}
              <ComponentType {...props} ref={ref} />
            </PanelErrorBoundary>
          </Provider>
        );
      }

      const wrappedComponent = React.forwardRef(renderComponent);
      const cleanup = layout.registerComponent(name, wrappedComponent);
      hydrateMap.set(name, hydrate);
      dehydrateMap.set(name, dehydrate);
      return cleanup;
    },
    [hydrateMap, dehydrateMap, layout, store]
  );
  const hydrateComponent = useCallback(
    (name, props) => hydrateMap.get(name)?.(props),
    [hydrateMap]
  );
  const dehydrateComponent = useCallback(
    (name, props) => dehydrateMap.get(name)?.(props),
    [dehydrateMap]
  );
  const panelManager = useMemo(
    // TODO: Hook up data.closed here
    () =>
      new PanelManager(
        layout,
        hydrateComponent,
        dehydrateComponent,
        new Map(),
        [],
        () => undefined
      ),
    [dehydrateComponent, hydrateComponent, layout]
  );

  const handleLayoutStateChanged = useCallback(() => {
    // we don't want to emit stateChanges that happen during item drags or else
    // we risk the last saved state being one without that panel in the layout entirely
    if (isItemDragging) return;

    const glConfig = layout.toConfig();
    const contentConfig = glConfig.content;
    const dehydratedLayoutConfig = LayoutUtils.dehydrateLayoutConfig(
      contentConfig
    );
    log.debug(
      'handleLayoutStateChanged',
      contentConfig,
      dehydratedLayoutConfig
    );

    setLastConfig(dehydratedLayoutConfig);

    onLayoutChange(dehydratedLayoutConfig);
  }, [isItemDragging, layout, onLayoutChange]);

  const handleLayoutItemPickedUp = useCallback(() => {
    setIsItemDragging(true);
  }, []);

  const handleLayoutItemDropped = useCallback(() => {
    setIsItemDragging(false);
  }, []);

  const handleComponentCreated = useCallback(item => {
    log.debug2('handleComponentCreated', item);

    if (!item || !item.config || !item.config.component || !item.element) {
      return;
    }

    const cssComponent = item.config.component
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    const cssClass = `${cssComponent}-component`;
    item.element.addClass(cssClass);
  }, []);

  useListener(layout, 'stateChanged', handleLayoutStateChanged);
  useListener(layout, 'itemPickedUp', handleLayoutItemPickedUp);
  useListener(layout, 'itemDropped', handleLayoutItemDropped);
  useListener(layout, 'componentCreated', handleComponentCreated);
  useListener(
    layout.eventHub,
    PanelEvent.TITLE_CHANGED,
    handleLayoutStateChanged
  );

  const previousLayoutConfig = usePrevious(layoutConfig);
  useEffect(() => {
    if (previousLayoutConfig !== layoutConfig && layoutConfig !== lastConfig) {
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

      // TODO: Wire up empty dashboard?
    }
  }, [
    hydrateComponent,
    layout,
    layoutConfig,
    lastConfig,
    panelManager,
    previousLayoutConfig,
  ]);

  return (
    <>
      {React.Children.map(children, child =>
        child
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
};

DashboardLayout.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  layout: GLPropTypes.Layout.isRequired,
  layoutConfig: PropTypes.arrayOf(PropTypes.shape({})),
  onLayoutChange: PropTypes.func,
};

export default DashboardLayout;
