import React, { ReactNode } from 'react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';

export function makeApiContextWrapper(dh: DhType) {
  return function ApiContextWrapper({ children }: { children?: ReactNode }) {
    return <ApiContext.Provider value={dh}>{children}</ApiContext.Provider>;
  };
}

export default {
  makeApiContextWrapper,
};
