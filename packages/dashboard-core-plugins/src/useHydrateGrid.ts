import { useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { dh.Table } from '@deephaven/jsapi-types';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import { type IrisGridPanelProps } from './panels';
import { useLoadTablePlugin } from './useLoadTablePlugin';

export function useHydrateGrid(
  fetch: () => Promise<dh.Table>,
  id: string
): { localDashboardId: string } & Pick<
  IrisGridPanelProps,
  'loadPlugin' | 'makeModel'
> {
  const dh = useApi();
  const loadPlugin = useLoadTablePlugin();

  const hydratedProps = useMemo(
    () => ({
      loadPlugin,
      localDashboardId: id,
      makeModel: async () => {
        const table = await fetch();
        return IrisGridModelFactory.makeModel(dh, table);
      },
    }),
    [dh, loadPlugin, fetch, id]
  );

  return hydratedProps;
}

export default useHydrateGrid;
