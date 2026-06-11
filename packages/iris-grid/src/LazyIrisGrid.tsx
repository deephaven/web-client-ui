import { forwardRef, lazy, Suspense } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type IrisGridType from './IrisGrid';
import type { IrisGridProps } from './IrisGrid';

const IrisGrid = lazy(() => import('./IrisGrid.js'));

const LazyIrisGrid = forwardRef<
  IrisGridType,
  JSX.LibraryManagedAttributes<typeof IrisGridType, IrisGridProps>
>(
  (
    // This creates the correct type to make defaultProps optional
    props,
    ref
  ): JSX.Element => (
    <Suspense
      fallback={<LoadingOverlay data-testid="lazy-iris-grid-loading" />}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <IrisGrid ref={ref} {...props} />
    </Suspense>
  )
);

LazyIrisGrid.displayName = 'LazyIrisGrid';

export default LazyIrisGrid;
