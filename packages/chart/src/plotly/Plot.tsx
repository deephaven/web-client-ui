import { lazy, Suspense } from 'react';

const PlotBase = lazy(() => import('./PlotBase.js'));

function Plot(props: React.ComponentProps<typeof PlotBase>): JSX.Element {
  return (
    <Suspense fallback={null}>
      {/* eslint-disable react/jsx-props-no-spreading */}
      <PlotBase {...props} />
    </Suspense>
  );
}

export default Plot;
