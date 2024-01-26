import { useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-types';
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
  const api = useApi();
  const loadPlugin = useLoadTablePlugin();

  const hydratedProps = useMemo(
    () => ({
      loadPlugin,
      localDashboardId: id,
      makeModel: async () => {
        const table = await fetch();
        return IrisGridModelFactory.makeModel(api, table);
      },
    }),
    [api, loadPlugin, fetch, id]
  );

  return hydratedProps;
}

export default useHydrateGrid;
