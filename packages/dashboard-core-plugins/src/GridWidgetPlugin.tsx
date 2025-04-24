import { useCallback, useMemo, useRef } from 'react';
import {
  type WidgetComponentProps,
  usePersistentState,
} from '@deephaven/plugin';
import { type dh as DhType } from '@deephaven/jsapi-types';
import {
  type DehydratedGridState,
  type DehydratedIrisGridState,
  IrisGrid,
  IrisGridCacheUtils,
  type IrisGridState,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { useSelector } from 'react-redux';
import { getSettings, type RootState } from '@deephaven/redux';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { type GridState } from '@deephaven/grid';
import { useIrisGridModel } from './useIrisGridModel';

export function GridWidgetPlugin({
  fetch,
}: WidgetComponentProps<DhType.Table>): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);

  const fetchResult = useIrisGridModel(fetch);

  const dh = useApi();
  const irisGridUtils = useMemo(() => new IrisGridUtils(dh), [dh]);

  const [state, setState] = usePersistentState<
    (DehydratedIrisGridState & DehydratedGridState) | undefined
  >(undefined, {
    version: 2,
    type: 'GridWidgetPluginss',
  });
  const initialState = useRef(state);
  const hydratedState = useMemo(() => {
    if (
      fetchResult.status !== 'success' ||
      initialState.current === undefined
    ) {
      return;
    }
    return {
      ...irisGridUtils.hydrateIrisGridState(
        fetchResult.model,
        initialState.current
      ),
      ...IrisGridUtils.hydrateGridState(
        fetchResult.model,
        initialState.current
      ),
    };
  }, [fetchResult, irisGridUtils]);

  const dehydrateIrisGridState = useMemo(
    () => IrisGridCacheUtils.makeMemoizedCombinedGridStateDehydrator(),
    []
  );

  const handleIrisGridChange = useCallback(
    (irisGridState: IrisGridState, gridState: GridState) => {
      if (
        fetchResult.status !== 'success' ||
        irisGridState == null ||
        gridState == null
      ) {
        return;
      }

      const newState = dehydrateIrisGridState(
        fetchResult.model,
        irisGridState,
        gridState
      );

      setState(newState);
    },
    [fetchResult, setState, dehydrateIrisGridState]
  );

  if (fetchResult.status === 'loading') {
    return <LoadingOverlay isLoading />;
  }

  if (fetchResult.status === 'error') {
    return (
      <LoadingOverlay
        errorMessage={getErrorMessage(fetchResult.error)}
        isLoading={false}
      />
    );
  }

  const { model } = fetchResult;
  return (
    <IrisGrid
      model={model}
      settings={settings}
      onStateChange={handleIrisGridChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hydratedState}
    />
  );
}

export default GridWidgetPlugin;
