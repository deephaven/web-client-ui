import { useCallback, useMemo, useRef, useState } from 'react';
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
  isIrisGridTableModelTemplate,
} from '@deephaven/iris-grid';
import { useSelector } from 'react-redux';
import { getSettings, type RootState } from '@deephaven/redux';
import { LoadingOverlay } from '@deephaven/components';
import { useLayoutManager, useListener } from '@deephaven/dashboard';
import { assertNotNull, getErrorMessage } from '@deephaven/utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { type GridRange, type GridState } from '@deephaven/grid';
import { useIrisGridModel } from './useIrisGridModel';
import useDashboardColumnFilters from './useDashboardColumnFilters';
import { InputFilterEvent } from './events';
import useGridLinker from './useGridLinker';
import { useTablePlugin } from './useTablePlugin';

export function GridWidgetPlugin({
  fetch,
}: WidgetComponentProps<DhType.Table>): JSX.Element | null {
  const settings = useSelector(getSettings<RootState>);
  const { eventHub } = useLayoutManager();

  const fetchResult = useIrisGridModel(fetch);
  const model =
    fetchResult.status === 'success' ? fetchResult.model : undefined;

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
    model?.columns ?? null,
    model != null && isIrisGridTableModelTemplate(model)
      ? model.table
      : undefined
  );

  const irisGridRef = useRef<IrisGridType | null>(null);

  const { alwaysFetchColumns: linkerAlwaysFetchColumns, ...linkerProps } =
    useGridLinker(
      fetchResult.status === 'success' ? fetchResult.model : null,
      irisGridRef.current
    );

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

  const [selection, setSelection] = useState<readonly GridRange[]>([]);

  const {
    Plugin,
    customFilters,
    alwaysFetchColumns: filterFetchColumns,
    onContextMenu,
  } = useTablePlugin({
    model,
    irisGridRef,
    irisGridUtils,
    selectedRanges: selection,
  });

  const alwaysFetchColumns = useMemo(() => {
    const columnSet = new Set([
      ...linkerAlwaysFetchColumns,
      ...filterFetchColumns,
    ]);
    return [...columnSet];
  }, [linkerAlwaysFetchColumns, filterFetchColumns]);

  if (fetchResult.status === 'loading') {
    return (
      <LoadingOverlay isLoading data-testid="grid-widget-plugin-loading" />
    );
  }

  if (fetchResult.status === 'error') {
    return (
      <LoadingOverlay
        data-testid="grid-widget-plugin-loading-error"
        errorMessage={getErrorMessage(fetchResult.error)}
        isLoading={false}
      />
    );
  }

  assertNotNull(model, 'Model should be defined when fetch is successful');

  return (
    <IrisGrid
      ref={irisGridRef}
      model={model}
      settings={settings}
      onStateChange={handleIrisGridChange}
      onSelectionChanged={setSelection}
      onContextMenu={onContextMenu}
      inputFilters={inputFilters}
      customFilters={customFilters}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...linkerProps}
      alwaysFetchColumns={alwaysFetchColumns}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hydratedState}
    >
      {Plugin}
    </IrisGrid>
  );
}

export default GridWidgetPlugin;
