import { forwardRef, lazy, Suspense, useContext } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type IrisGridType from './IrisGrid';
import type { IrisGridProps } from './IrisGrid';
import CellInputRendererContext from './CellInputRendererContext';

const IrisGrid = lazy(() => import('./IrisGrid.js'));

const LazyIrisGrid = forwardRef<
  IrisGridType,
  JSX.LibraryManagedAttributes<typeof IrisGridType, IrisGridProps>
>(
  (
    // This creates the correct type to make defaultProps optional
    props,
    ref
  ): JSX.Element => {
    // Merge context-derived registry as default; caller-provided prop in {...props} wins
    const registry = useContext(CellInputRendererContext);
    const mergedProps = { cellInputRendererRegistry: registry, ...props };
    return (
      <Suspense
        fallback={<LoadingOverlay data-testid="lazy-iris-grid-loading" />}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <IrisGrid ref={ref} {...mergedProps} />
      </Suspense>
    );
  }
);

LazyIrisGrid.displayName = 'LazyIrisGrid';

export default LazyIrisGrid;
