import React, { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type { SettingsMenuProps } from './SettingsMenu';

const SettingsMenu = lazy(() => import('./SettingsMenu'));

export function LazySettingsMenu(props: SettingsMenuProps): JSX.Element {
  return (
    <Suspense
      fallback={<LoadingOverlay data-testid="lazy-settings-menu-loading" />}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <SettingsMenu {...props} />
    </Suspense>
  );
}

export default LazySettingsMenu;
