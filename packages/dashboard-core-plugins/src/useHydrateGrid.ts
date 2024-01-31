import { useMemo } from 'react';
import { WidgetDescriptor } from '@deephaven/dashboard';
import { useApi, useObjectFetcher } from '@deephaven/jsapi-bootstrap';
import { Table } from '@deephaven/jsapi-types';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import { type IrisGridPanelProps } from './panels';
import { useLoadTablePlugin } from './useLoadTablePlugin';

export function useHydrateGrid(
  widget: WidgetDescriptor,
  id: string
): { localDashboardId: string } & Pick<
  IrisGridPanelProps,
  'loadPlugin' | 'makeModel'
> {
  const dh = useApi();
  const loadPlugin = useLoadTablePlugin();
  const fetch = useObjectFetcher<Table>();

  const hydratedProps = useMemo(
    () => ({
      loadPlugin,
      localDashboardId: id,
      makeModel: async () => {
        const table = await fetch(widget);
        return IrisGridModelFactory.makeModel(dh, table);
      },
    }),
    [dh, fetch, id, loadPlugin, widget]
  );

  return hydratedProps;
}

export default useHydrateGrid;
