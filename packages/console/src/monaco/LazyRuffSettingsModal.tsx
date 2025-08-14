import React, { lazy, Suspense } from 'react';
import { usePromiseFactory } from '@deephaven/react-hooks';
import type { RuffSettingsModalProps } from './RuffSettingsModal';
import MonacoUtils from './MonacoUtils';

const RuffSettingsModal = lazy(() => import('./RuffSettingsModal'));

export function LazyRuffSettingsModal(
  props: RuffSettingsModalProps
): JSX.Element | null {
  const { data: monaco } = usePromiseFactory(MonacoUtils.lazyMonaco, []);

  if (monaco == null) {
    return null;
  }

  return (
    <Suspense fallback={<div data-testid="lazy-ruff-settings-modal-loading" />}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <RuffSettingsModal {...props} monaco={monaco} />
    </Suspense>
  );
}

export default LazyRuffSettingsModal;
