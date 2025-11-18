import { LoadingOverlay } from '@deephaven/components';
import { lazy, Suspense } from 'react';

const PlotBase = lazy(() => import('./Plot.js'));

function Plot(props: React.ComponentProps<typeof PlotBase>): JSX.Element {
  return (
    <Suspense fallback={<LoadingOverlay data-testid="lazy-plot-loading" />}>
      {/* eslint-disable react/jsx-props-no-spreading */}
      <PlotBase {...props} />
    </Suspense>
  );
}

export default Plot;
