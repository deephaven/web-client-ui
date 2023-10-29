import { useCallback } from 'react';
import {
  DehydratedDashboardPanelProps,
  PanelHydrateFunction,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useConnection } from '@deephaven/jsapi-components';
import { Table } from '@deephaven/jsapi-types';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import {
  IrisGridPanelMetadata,
  IrisGridPanelProps,
  isIrisGridPanelMetadata,
  isLegacyIrisGridPanelMetadata,
} from './panels';
import { useLoadTablePlugin } from './useLoadTablePlugin';

export function useHydrateGrid<
  P extends DehydratedDashboardPanelProps = DehydratedDashboardPanelProps,
>(): PanelHydrateFunction<
  P,
  P & Pick<IrisGridPanelProps, 'loadPlugin' | 'makeModel'>
> {
  const dh = useApi();
  const connection = useConnection();
  const loadPlugin = useLoadTablePlugin();

  const hydrate = useCallback(
    (hydrateProps: P, id: string) => {
      let metadata: IrisGridPanelMetadata;
      if (isIrisGridPanelMetadata(hydrateProps.metadata)) {
        metadata = hydrateProps.metadata;
      } else if (isLegacyIrisGridPanelMetadata(hydrateProps.metadata)) {
        metadata = {
          name: hydrateProps.metadata.table,
          type: hydrateProps.metadata.type ?? dh.VariableType.TABLE,
        };
      } else {
        throw new Error('Metadata is required for table panel');
      }

      return {
        ...hydrateProps,
        loadPlugin,
        localDashboardId: id,
        makeModel: async () => {
          const { name: tableName, type } = metadata;
          const definition = {
            title: tableName,
            name: tableName,
            type,
          };
          const table = (await connection.getObject(definition)) as Table;
          return IrisGridModelFactory.makeModel(dh, table);
        },
      };
    },
    [dh, connection, loadPlugin]
  );

  return hydrate;
}

export default useHydrateGrid;
