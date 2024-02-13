import { LoadingOverlay } from '@deephaven/components';
import { lazy, Suspense } from 'react';

const ChartRenderer = lazy(() => import('./ChartRenderer.js'));

function Chart(props: React.ComponentProps<typeof ChartRenderer>): JSX.Element {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ChartRenderer {...props} />
    </Suspense>
  );
}

export default Chart;
