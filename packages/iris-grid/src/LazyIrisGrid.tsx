import { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@deephaven/components';

const IrisGrid = lazy(() => import('./IrisGrid.js'));

function LazyIrisGrid(
  props: React.ComponentProps<typeof IrisGrid>
): JSX.Element {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <IrisGrid {...props} />
    </Suspense>
  );
}

export default LazyIrisGrid;
