import React, { ReactElement, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import GoldenLayout, { ItemConfigType } from '@deephaven/golden-layout';
import { Provider, useStore } from 'react-redux';
import Log from '@deephaven/log';
import PanelManager from './PanelManager';
import PanelErrorBoundary from './PanelErrorBoundary';
import LayoutUtils from './layout/LayoutUtils';
import {
  dehydrate as dehydrateDefault,
  hydrate as hydrateDefault,
} from './DashboardUtils';

const log = Log.module('DashboardLayout');

export type DashboardLayoutProps = {
  id: string;
  layout: GoldenLayout;
  layoutConfig?: ItemConfigType[];
  children?: React.ReactNode | React.ReactNode[];
};

export const DashboardLayout = ({
  id,
  children,
  layout,
  layoutConfig = [],
}: DashboardLayoutProps): JSX.Element => {
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

  useEffect(() => {
    log.debug('Mounted, setting content...');
    const content = LayoutUtils.hydrateLayoutConfig(
      layoutConfig,
      hydrateComponent
    );
    layout.root.addChild(content[0]);
  }, [hydrateComponent, layout, layoutConfig, panelManager]);

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
  layout: PropTypes.shape({
    registerComponent: PropTypes.func,
    root: PropTypes.shape({ addChild: PropTypes.func }),
  }).isRequired,
  layoutConfig: PropTypes.arrayOf(PropTypes.shape({})),
};

export default DashboardLayout;
