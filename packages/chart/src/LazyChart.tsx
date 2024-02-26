import { LoadingOverlay } from '@deephaven/components';
import { lazy, Suspense } from 'react';

const Chart = lazy(() => import('./Chart.js'));

function LazyChart(props: React.ComponentProps<typeof Chart>): JSX.Element {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Chart {...props} />
    </Suspense>
  );
}

export default LazyChart;
