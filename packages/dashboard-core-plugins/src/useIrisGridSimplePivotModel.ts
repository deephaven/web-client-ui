import { type dh } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useCallback, useEffect, useState } from 'react';
import {
  IrisGridModel,
  IrisGridSimplePivotModel,
  type SimplePivotSchema,
} from '@deephaven/iris-grid';
import Log from '@deephaven/log';

const log = Log.module('useIrisGridSimplePivotModel');

export interface SimplePivotFetchResult {
  columnMap: (readonly [string, string])[];
  schema: SimplePivotSchema;
  table: dh.Table;
  keyTable: dh.Table;
  totalsTable: dh.Table | null;
  pivotWidget: dh.Widget;
}

export type IrisGridModelFetch = () => Promise<SimplePivotFetchResult>;

export type IrisGridModelFetchErrorResult = {
  error: NonNullable<unknown>;
  status: 'error';
};

export type IrisGridModelFetchLoadingResult = {
  status: 'loading';
};

export type IrisGridModelFetchSuccessResult = {
  status: 'success';
  model: IrisGridModel;
};

export type IrisGridModelFetchResult =
  | IrisGridModelFetchErrorResult
  | IrisGridModelFetchLoadingResult
  | IrisGridModelFetchSuccessResult;

/** Pass in a table `fetch` function, will load the model and handle any errors */
export function useIrisGridSimplePivotModel(
  fetch: IrisGridModelFetch
): IrisGridModelFetchResult {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const [error, setError] = useState<unknown>();

  // Close the model when component is unmounted
  useEffect(
    () => () => {
      if (model) {
        log.debug('Closing model', model);
        model.close();
      }
    },
    [model]
  );

  const makeModel = useCallback(async () => {
    const { columnMap, keyTable, pivotWidget, schema, table, totalsTable } =
      await fetch();
    return new IrisGridSimplePivotModel(
      dh,
      table,
      keyTable,
      totalsTable,
      columnMap,
      schema,
      pivotWidget
    );
  }, [dh, fetch]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setError(undefined);
      try {
        const newModel = await makeModel();
        if (!cancelled) {
          setModel(newModel);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [makeModel]);

  useEffect(
    function startListeningModel() {
      if (!model) {
        return;
      }

      // If the table inside a widget is disconnected, then don't bother trying to listen to reconnect, just close it and show a message
      // Widget closes the table already when it is disconnected, so no need to close it again
      function handleDisconnect() {
        setError(new Error('Table disconnected'));
        setModel(undefined);
      }

      model.addEventListener(IrisGridModel.EVENT.DISCONNECT, handleDisconnect);

      return () => {
        model.removeEventListener(
          IrisGridModel.EVENT.DISCONNECT,
          handleDisconnect
        );
      };
    },
    [model]
  );

  if (error != null) {
    return { error, status: 'error' };
  }
  if (model != null) {
    return { model, status: 'success' };
  }
  throw new Error('Invalid state');
}
