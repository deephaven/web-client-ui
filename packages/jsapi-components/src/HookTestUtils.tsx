import React, { forwardRef, ReactNode } from 'react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';

export function makeApiContextWrapper<TProps, TRef = unknown>(dh: DhType) {
  return forwardRef<TRef, TProps>(function ApiContextWrapper(
    {
      children,
    }: {
      children?: ReactNode;
    },
    _ref
  ) {
    return <ApiContext.Provider value={dh}>{children}</ApiContext.Provider>;
  });
}

export default {
  makeApiContextWrapper,
};
