import React, {
  ComponentType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import throttle from 'lodash.throttle';
import GoldenLayout, { ItemConfigType } from '@deephaven/golden-layout';
import './layout/golden-layout';
import LayoutUtils from './layout/LayoutUtils';
import DashboardLayout from './DashboardLayout';

const RESIZE_THROTTLE = 100;

export type DashboardData = {
  layoutSettings?: Record<string, unknown>;
};

export type DashboardProps = {
  id?: string;
  data?: DashboardData;
  children?: React.ReactNode | React.ReactNode[];
  layoutConfig?: ItemConfigType[];
  onDataChange?: () => void;
  onLayoutConfigChange?: () => void;
  onGoldenLayoutChange?: () => void;
  fallbackComponent?: ComponentType;
};

export const Dashboard = ({
  id = 'default',
  children,
  data = {},
  layoutConfig,
  onDataChange = () => undefined,
  onLayoutConfigChange = () => undefined,
  onGoldenLayoutChange = () => undefined,
  fallbackComponent = undefined,
}: DashboardProps): JSX.Element => {
  const layoutElement = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [layout, setLayout] = useState<GoldenLayout>();

  useEffect(() => {
    if (!layoutElement.current) {
      setLayout(undefined);
      return;
    }
    const { layoutSettings = {} } = data;
    const newLayout = new GoldenLayout(
      {
        ...LayoutUtils.makeDefaultLayout(),
        ...layoutSettings,

        // Load our content later after plugins have registered
        content: [],
      },
      layoutElement.current
    );

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

    return () => {
      newLayout.destroy();
    };
  }, [data, setIsInitialized, setLayout]);

  const handleResize = useMemo(
    () =>
      throttle(() => {
        // TODO: This doesn't seem to be throttling
        if (layout?.isInitialised) {
          layout?.updateSize();
        }
      }, RESIZE_THROTTLE),
    [layout]
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div className="dashboard-container w-100 h-100">
      <div className="w-100 h-100" ref={layoutElement} />
      {isInitialized && layout && (
        <DashboardLayout id={id} layout={layout} layoutConfig={layoutConfig}>
          {children}
        </DashboardLayout>
      )}
    </div>
  );
};

export default Dashboard;
