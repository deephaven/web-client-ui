import { useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { TableUtils } from '@deephaven/jsapi-utils';

/**
 * Get a `TableUtils` instance using `dh` api from the current context.
 */
export function useTableUtils(): TableUtils {
  const dh = useApi();
  return useMemo(() => new TableUtils(dh), [dh]);
}

export default useTableUtils;
