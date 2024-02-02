import { useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { Table, VariableDescriptor } from '@deephaven/jsapi-types';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import { type IrisGridPanelProps } from './panels';
import { useLoadTablePlugin } from './useLoadTablePlugin';

/**
 * Hydrate the props for a grid panel
 * @param fetchTable Function to fetch the Table object
 * @param id ID of the dashboard
 * @param metadata Optional serializable metadata for re-fetching the table later
 * @returns Props hydrated for a grid panel
 */
export function useHydrateGrid(
  fetchTable: () => Promise<Table>,
  id: string,
  metadata: VariableDescriptor | undefined
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
