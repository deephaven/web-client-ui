import { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@deephaven/components';

const IrisGridComponent = lazy(() => import('./IrisGridComponent.js'));

function IrisGrid(
  props: React.ComponentProps<typeof IrisGridComponent>
): JSX.Element {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <IrisGridComponent {...props} />
    </Suspense>
  );
}

export default IrisGrid;
