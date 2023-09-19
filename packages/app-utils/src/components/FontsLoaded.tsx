import React, { useContext } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import { FontsLoadedContext } from './FontBootstrap';

export type FontsLoadedProps = {
  /** Children to show when the fonts have completed loading */
  children: React.ReactNode;
};

export function FontsLoaded({ children }: FontsLoadedProps): JSX.Element {
  const isFontsLoaded = useContext(FontsLoadedContext);

  if (!isFontsLoaded) {
    return <LoadingOverlay data-testid="fonts-loaded-loading" />;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default FontsLoaded;
