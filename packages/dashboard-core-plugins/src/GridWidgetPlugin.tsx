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
  type IrisGridType,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { useSelector } from 'react-redux';
import { getSettings, type RootState } from '@deephaven/redux';
import { LoadingOverlay } from '@deephaven/components';
import { useLayoutManager, useListener } from '@deephaven/dashboard';
import { EMPTY_ARRAY, getErrorMessage } from '@deephaven/utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { type GridState } from '@deephaven/grid';
import { useIrisGridModel } from './useIrisGridModel';
import useDashboardColumnFilters from './useDashboardColumnFilters';
import { InputFilterEvent } from './events';

export function GridWidgetPlugin({
  fetch,
}: WidgetComponentProps<DhType.Table>): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { eventHub } = useLayoutManager();

  const fetchResult = useIrisGridModel(fetch);

  const dh = useApi();
  const irisGridUtils = useMemo(() => new IrisGridUtils(dh), [dh]);

  const [state, setState] = usePersistentState<
    (DehydratedIrisGridState & DehydratedGridState) | undefined
  >(undefined, {
    version: 1,
    type: 'GridWidgetPlugin',
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

  const inputFilters = useDashboardColumnFilters(
    fetchResult.status === 'success' ? fetchResult.model.columns : EMPTY_ARRAY
  );

  const irisGridRef = useRef<IrisGridType | null>(null);

  const handleClearAllFilters = useCallback(() => {
    if (irisGridRef.current == null) {
      return;
    }
    irisGridRef.current.clearAllFilters();
  }, []);

  useListener(
    eventHub,
    InputFilterEvent.CLEAR_ALL_FILTERS,
    handleClearAllFilters
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
      ref={irisGridRef}
      model={model}
      settings={settings}
      onStateChange={handleIrisGridChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hydratedState}
      inputFilters={inputFilters}
    />
  );
}

export default GridWidgetPlugin;
