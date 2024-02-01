import { useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { Table, VariableDescriptor } from '@deephaven/jsapi-types';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import { type IrisGridPanelProps } from './panels';
import { useLoadTablePlugin } from './useLoadTablePlugin';

export function useHydrateGrid(
  fetchTable: () => Promise<Table>,
  id: string,
  metadata?: VariableDescriptor
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
        const table = await fetchTable();
        return IrisGridModelFactory.makeModel(dh, table);
      },
      metadata,
    }),
    [dh, fetchTable, id, loadPlugin, metadata]
  );

  return hydratedProps;
}

export default useHydrateGrid;
