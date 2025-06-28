import { type dh } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { IrisGridModel, IrisGridModelFactory } from '@deephaven/iris-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type IrisGridModelFetch = () => Promise<dh.Table>;

export type IrisGridModelFetchErrorResult = {
  error: NonNullable<unknown>;
  status: 'error';
  model: undefined;
};

export type IrisGridModelFetchLoadingResult = {
  status: 'loading';
  model: undefined;
};

export type IrisGridModelFetchSuccessResult = {
  status: 'success';
  model: IrisGridModel;
};

export type IrisGridModelFetchResult = (
  | IrisGridModelFetchErrorResult
  | IrisGridModelFetchLoadingResult
  | IrisGridModelFetchSuccessResult
) & {
  reload: () => void;
};

/** Pass in a table `fetch` function, will load the model and handle any errors */
export function useIrisGridModel(
  fetch: IrisGridModelFetch
): IrisGridModelFetchResult {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);

  const makeModel = useCallback(async () => {
    const table = await fetch();
    return IrisGridModelFactory.makeModel(dh, table);
  }, [dh, fetch]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const newModel = await makeModel();
      setModel(newModel);
      setIsLoading(false);
    } catch (e) {
      setError(e);
      setIsLoading(false);
    }
  }, [makeModel]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoading(true);
      setError(undefined);
      try {
        const newModel = await makeModel();
        if (!cancelled) {
          setModel(newModel);
          setIsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setIsLoading(false);
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
        setIsLoading(false);
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

  const result: IrisGridModelFetchResult = useMemo(() => {
    if (isLoading) {
      return { reload, status: 'loading' };
    }
    if (error != null) {
      return { error, reload, status: 'error' };
    }
    if (model != null) {
      return { model, reload, status: 'success' };
    }
    throw new Error('Invalid state');
  }, [error, isLoading, model, reload]);

  return result;
}
