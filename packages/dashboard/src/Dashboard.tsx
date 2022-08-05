import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import throttle from 'lodash.throttle';
import GoldenLayout from '@deephaven/golden-layout';
import type { ItemConfigType } from '@deephaven/golden-layout';
import './layout/golden-layout';
import LayoutUtils from './layout/LayoutUtils';
import PanelPlaceholder from './PanelPlaceholder';
import DashboardLayout from './DashboardLayout';
import {
  PanelDehydrateFunction,
  PanelHydrateFunction,
  PanelProps,
} from './DashboardPlugin';
import './Dashboard.scss';

const RESIZE_THROTTLE = 100;

const DEFAULT_CALLBACK = () => undefined;

const EMPTY_OBJECT = Object.freeze({});

export type DashboardProps = {
  id?: string;
  children?: React.ReactNode | React.ReactNode[];
  emptyDashboard?: React.ReactNode;
  layoutConfig?: ItemConfigType[];
  layoutSettings?: Record<string, unknown>;
  onLayoutConfigChange?: () => void;
  onGoldenLayoutChange?: (goldenLayout: GoldenLayout) => void;
  onLayoutInitialized?: () => void;
  fallbackComponent?: ForwardRefExoticComponent<
    PanelProps & RefAttributes<HTMLDivElement>
  >;
  hydrate?: PanelHydrateFunction;
  dehydrate?: PanelDehydrateFunction;
};

export const Dashboard = ({
  id = 'default',
  children,
  emptyDashboard,
  layoutConfig,
  layoutSettings = EMPTY_OBJECT,
  onLayoutConfigChange = DEFAULT_CALLBACK,
  onGoldenLayoutChange = DEFAULT_CALLBACK,
  onLayoutInitialized = DEFAULT_CALLBACK,
  fallbackComponent = PanelPlaceholder,
  hydrate,
  dehydrate,
}: DashboardProps): JSX.Element => {
  const layoutElement = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [layout, setLayout] = useState<GoldenLayout>();

  useEffect(
    function initDashboard() {
      if (!layoutElement.current) {
        setLayout(undefined);
        return;
      }
      const config: GoldenLayout.Config = {
        ...LayoutUtils.makeDefaultLayout(),
      };
      Object.assign(config.settings, layoutSettings);
      // Load our content later after plugins have registered
      config.content = [];

      const newLayout = new GoldenLayout(config, layoutElement.current);

      const onInit = () => {
        newLayout.off('initialised', onInit);
        setIsInitialized(true);
      };
      newLayout.on('initialised', onInit);

      if (fallbackComponent) {
        newLayout.setFallbackComponent(fallbackComponent);
      }

      newLayout.init();

      setLayout(newLayout);

      onGoldenLayoutChange(newLayout);

      return () => {
        newLayout.destroy();
      };
    },
    [
      layoutSettings,
      fallbackComponent,
      onGoldenLayoutChange,
      setIsInitialized,
      setLayout,
    ]
  );

  const handleResize = useMemo(
    () =>
      throttle(() => {
        if (layout?.isInitialised) {
          layout?.updateSize();
        }
      }, RESIZE_THROTTLE),
    [layout]
  );

  useEffect(
    function initResizeEventListner() {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    },
    [handleResize]
  );

  return (
    <div className="dashboard-container w-100 h-100">
      <div className="w-100 h-100" ref={layoutElement} />
      {isInitialized && layout && (
        <DashboardLayout
          emptyDashboard={emptyDashboard}
          id={id}
          layout={layout}
          layoutConfig={layoutConfig}
          onLayoutChange={onLayoutConfigChange}
          onLayoutInitialized={onLayoutInitialized}
          hydrate={hydrate}
          dehydrate={dehydrate}
        >
          {children}
        </DashboardLayout>
      )}
    </div>
  );
};

export default Dashboard;
